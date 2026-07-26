import { Repository } from '@/types'

export class GitHubService {
  private baseUrl = 'https://api.github.com'
  
  constructor(private accessToken: string) {}

  async getUserRepositories(page = 1, per_page = 30): Promise<{
    repositories: Repository[]
    hasMore: boolean
    totalCount?: number
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/user/repos?page=${page}&per_page=${per_page}&sort=updated&type=public`,
        {
          headers: {
            'Authorization': `token ${this.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      const repositories = await response.json()
      const linkHeader = response.headers.get('Link')
      const hasMore = linkHeader ? linkHeader.includes('rel="next"') : false

      return {
        repositories: repositories.map(this.transformRepository),
        hasMore,
      }
    } catch (error) {
      console.error('Error fetching repositories:', error)
      throw error
    }
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}`,
        {
          headers: {
            'Authorization': `token ${this.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      const repository = await response.json()
      return this.transformRepository(repository)
    } catch (error) {
      console.error('Error fetching repository:', error)
      throw error
    }
  }

  async getRepositoryLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/languages`,
        {
          headers: {
            'Authorization': `token ${this.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching repository languages:', error)
      throw error
    }
  }

  private transformRepository(repo: any): Repository {
    return {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      default_branch: repo.default_branch,
      language: repo.language,
      languages_url: repo.languages_url,
      size: repo.size,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
    }
  }
}

export async function detectFramework(
  languages: Record<string, number>,
  accessToken: string,
  owner: string,
  repo: string
): Promise<{ framework: string; confidence: number } | null> {
  // Load framework detection rules from config
  const configResponse = await fetch('/nehua-config.json')
  const config = await configResponse.json()
  const frameworks = config.frameworks

  // Check for framework-specific files
  const githubService = new GitHubService(accessToken)
  
  try {
    // Check for key files that indicate specific frameworks
    for (const [frameworkKey, frameworkConfig] of Object.entries(frameworks)) {
      const keyFiles = frameworkConfig.key_files as string[]
      
      for (const file of keyFiles) {
        try {
          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${file}`,
            {
              headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }
          )
          
          if (response.ok) {
            // Found a key file, high confidence
            return {
              framework: frameworkKey,
              confidence: 0.9
            }
          }
        } catch (error) {
          // File doesn't exist, continue checking
          continue
        }
      }
    }

    // Fallback to language-based detection with lower confidence
    const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0)
    
    if (languages.Python && languages.Python / totalBytes > 0.5) {
      // Check for Django/FastAPI patterns
      if (languages.HTML || languages.CSS) {
        return { framework: 'django', confidence: 0.6 }
      }
      return { framework: 'fastapi', confidence: 0.5 }
    }
    
    if (languages.JavaScript || languages.TypeScript) {
      const jsBytes = (languages.JavaScript || 0) + (languages.TypeScript || 0)
      if (jsBytes / totalBytes > 0.5) {
        // Default to React for JS/TS heavy repos
        return { framework: 'react', confidence: 0.4 }
      }
    }

    return null
  } catch (error) {
    console.error('Error detecting framework:', error)
    return null
  }
}