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
    // Fetch the repo's full file listing ONCE and match every framework's
    // key_files against it locally, instead of firing one Contents-API
    // request per candidate file. The latter (13-16 concurrent requests per
    // repo, times every repo on the page) is what was tripping GitHub's
    // secondary/abuse rate limit (403) when the repository list loads.
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
      {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )

    if (treeResponse.ok) {
      const treeData = await treeResponse.json()
      const paths: string[] = Array.isArray(treeData.tree)
        ? treeData.tree.filter((item: any) => item.type === 'blob').map((item: any) => item.path as string)
        : []

      for (const [frameworkKey, frameworkConfig] of Object.entries(frameworks)) {
        const keyFiles = frameworkConfig.key_files as string[]
        const matchedFile = paths.find(path => keyFiles.some(keyFile => path === keyFile || path.endsWith(`/${keyFile}`)))

        if (matchedFile) {
          return {
            framework: frameworkKey,
            confidence: 0.9,
            evidence: [matchedFile]
          }
        }
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