import { Repository, FrameworkDetection } from '@/types'
import nehuaConfig from '@/public/nehua-config.json'

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
        `${this.baseUrl}/user/repos?page=${page}&per_page=${per_page}&sort=updated&affiliation=owner,collaborator,organization_member`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
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
): Promise<FrameworkDetection | null> {
  // Load framework detection rules from config
  const frameworks = nehuaConfig.frameworks

  if (!frameworks) {
    throw new Error('The frameworks property is missing from nehua-config.json')
  }

  try {
    // Check for key files that indicate specific frameworks. Every
    // (framework, file) pair is probed concurrently instead of sequentially
    // to avoid a multi-second, rate-limit-heavy detection step.
    const checks = Object.entries(frameworks).flatMap(([frameworkKey, frameworkConfig]) =>
      (frameworkConfig.key_files as string[]).map(file => ({ frameworkKey, file }))
    )

    const results = await Promise.all(
      checks.map(async ({ frameworkKey, file }) => {
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

          return response.ok ? { frameworkKey, file } : null
        } catch (error) {
          return null
        }
      })
    )

    const detected = results.find(
      (result): result is { frameworkKey: string; file: string } => result !== null
    )
    if (detected) {
      return {
        framework: detected.frameworkKey,
        confidence: 0.9,
        evidence: [detected.file]
      }
    }

    // Fallback to language-based detection with lower confidence
    const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0)

    if (languages.Python && languages.Python / totalBytes > 0.5) {
      // Check for Django/FastAPI patterns
      if (languages.HTML || languages.CSS) {
        return { framework: 'django', confidence: 0.6, evidence: ['Python-majority codebase with HTML/CSS templates'] }
      }
      return { framework: 'fastapi', confidence: 0.5, evidence: ['Python-majority codebase'] }
    }

    if (languages.JavaScript || languages.TypeScript) {
      const jsBytes = (languages.JavaScript || 0) + (languages.TypeScript || 0)
      if (jsBytes / totalBytes > 0.5) {
        // Default to React for JS/TS heavy repos
        return { framework: 'react', confidence: 0.4, evidence: ['JavaScript/TypeScript-majority codebase'] }
      }
    }

    return null
  } catch (error) {
    console.error('Error detecting framework:', error)
    return null
  }
}