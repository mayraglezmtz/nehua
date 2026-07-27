import { Repository, FileAnalysis, FrameworkDetection, ArchitectureNode, ArchitectureEdge, NodeType } from '@/types'
import { FastAPIAnalyzer } from './analyzers/fastapi'
import { ReactAnalyzer } from './analyzers/react'
import { NextJSAnalyzer } from './analyzers/nextjs'

export interface AnalysisContext {
  repository: Repository
  accessToken: string
  config: any // From nehua-config.json
}

export interface FrameworkAnalyzer {
  canAnalyze(framework: FrameworkDetection): boolean
  analyze(context: AnalysisContext): Promise<{
    files: FileAnalysis[]
    nodes: ArchitectureNode[]
    edges: ArchitectureEdge[]
    dependencies: string[]
    risks: string[]
  }>
}

export class StaticAnalysisEngine {
  private analyzers: Map<string, FrameworkAnalyzer> = new Map()
  private config: any

  constructor(config: any) {
    this.config = config
    this.registerAnalyzers()
  }

  private registerAnalyzers() {
    this.analyzers.set('django', new DjangoAnalyzer())
    this.analyzers.set('fastapi', new FastAPIAnalyzer())
    this.analyzers.set('react', new ReactAnalyzer())
    this.analyzers.set('nextjs', new NextJSAnalyzer())
  }

  async analyzeRepository(
    repository: Repository,
    frameworks: FrameworkDetection[],
    accessToken: string
  ): Promise<{
    files: FileAnalysis[]
    nodes: ArchitectureNode[]
    edges: ArchitectureEdge[]
    dependencies: string[]
    risks: string[]
  }> {
    const context: AnalysisContext = {
      repository,
      accessToken,
      config: this.config
    }

    // Find the most confident framework
    const primaryFramework = frameworks.reduce((prev, current) => 
      (current.confidence > prev.confidence) ? current : prev
    )

    const analyzer = this.analyzers.get(primaryFramework.framework)
    if (!analyzer) {
      throw new Error(`No analyzer available for framework: ${primaryFramework.framework}`)
    }

    console.log(`Analyzing ${repository.full_name} with ${primaryFramework.framework} analyzer`)
    
    try {
      const result = await analyzer.analyze(context)
      
      // Add cross-cutting analysis
      const enhancedResult = await this.enhanceWithCrossCuttingAnalysis(result, context)
      
      return enhancedResult
    } catch (error) {
      console.error(`Analysis failed for ${repository.full_name}:`, error)
      throw error
    }
  }

  private async enhanceWithCrossCuttingAnalysis(
    result: any,
    context: AnalysisContext
  ): Promise<any> {
    // Add common analysis patterns that apply to all frameworks
    const enhancedNodes = await this.detectCommonNodes(result.nodes, context)
    const enhancedEdges = await this.detectDataFlows(result.edges, enhancedNodes)
    
    return {
      ...result,
      nodes: enhancedNodes,
      edges: enhancedEdges
    }
  }

  private async detectCommonNodes(
    nodes: ArchitectureNode[],
    context: AnalysisContext
  ): Promise<ArchitectureNode[]> {
    const enhancedNodes = [...nodes]
    
    // Detect common infrastructure patterns
    const files = await this.fetchRepositoryStructure(context)
    
    // Look for database configurations
    const dbFiles = files.filter(f => 
      f.toLowerCase().includes('database') ||
      f.toLowerCase().includes('db') ||
      f.toLowerCase().includes('.sql') ||
      f.toLowerCase().includes('migrate')
    )
    
    if (dbFiles.length > 0) {
      enhancedNodes.push(this.createNode('database', 'Database', 'Data persistence layer', dbFiles))
    }

    // Look for cache configurations
    const cacheFiles = files.filter(f =>
      f.toLowerCase().includes('cache') ||
      f.toLowerCase().includes('redis') ||
      f.toLowerCase().includes('memcache')
    )
    
    if (cacheFiles.length > 0) {
      enhancedNodes.push(this.createNode('cache', 'Cache Layer', 'Caching system', cacheFiles))
    }

    // Look for authentication
    const authFiles = files.filter(f =>
      f.toLowerCase().includes('auth') ||
      f.toLowerCase().includes('login') ||
      f.toLowerCase().includes('jwt') ||
      f.toLowerCase().includes('oauth')
    )
    
    if (authFiles.length > 0) {
      enhancedNodes.push(this.createNode('authentication', 'Authentication', 'Auth system', authFiles))
    }

    return enhancedNodes
  }

  private async detectDataFlows(
    edges: ArchitectureEdge[],
    nodes: ArchitectureNode[]
  ): Promise<ArchitectureEdge[]> {
    const enhancedEdges = [...edges]
    
    // Create basic data flow connections based on node types
    const frontendNodes = nodes.filter(n => n.type === 'frontend')
    const backendNodes = nodes.filter(n => n.type === 'backend')
    const databaseNodes = nodes.filter(n => n.type === 'database')
    
    // Connect frontend to backend
    frontendNodes.forEach(frontend => {
      backendNodes.forEach(backend => {
        enhancedEdges.push({
          id: `${frontend.id}-${backend.id}`,
          source: frontend.id,
          target: backend.id,
          type: 'api_call',
          label: 'API Calls',
          animated: true,
          style: {
            stroke: this.config.ui.colors.secondary,
            strokeWidth: 2
          }
        })
      })
    })

    // Connect backend to database
    backendNodes.forEach(backend => {
      databaseNodes.forEach(database => {
        enhancedEdges.push({
          id: `${backend.id}-${database.id}`,
          source: backend.id,
          target: database.id,
          type: 'dependency',
          label: 'Data Access',
          animated: false,
          style: {
            stroke: this.config.ui.colors.accent,
            strokeWidth: 2
          }
        })
      })
    })

    return enhancedEdges
  }

  private createNode(
    type: NodeType,
    label: string,
    description: string,
    files: string[],
    position?: { x: number; y: number }
  ): ArchitectureNode {
    const nodeConfig = this.config.node_types[type]
    
    return {
      id: `${type}-${Date.now()}`,
      type,
      label,
      description,
      position: position || { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        files,
        dependencies: [],
        exports: [],
      },
      style: {
        backgroundColor: nodeConfig.color,
        borderColor: nodeConfig.color,
        color: '#FFFFFF'
      }
    }
  }

  private async fetchRepositoryStructure(context: AnalysisContext): Promise<string[]> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${context.repository.full_name}/git/trees/${context.repository.default_branch}?recursive=1`,
        {
          headers: {
            'Authorization': `token ${context.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch repository structure: ${response.status}`)
      }

      const data = await response.json()
      return data.tree
        .filter((item: any) => item.type === 'blob')
        .map((item: any) => item.path)
        .slice(0, this.config.analysis.max_files_to_analyze)
    } catch (error) {
      console.error('Error fetching repository structure:', error)
      return []
    }
  }
}

// Framework-specific analyzers
class DjangoAnalyzer implements FrameworkAnalyzer {
  canAnalyze(framework: FrameworkDetection): boolean {
    return framework.framework === 'django'
  }

  async analyze(context: AnalysisContext): Promise<any> {
    const files = await this.fetchDjangoFiles(context)
    const nodes = await this.createDjangoNodes(files, context)
    const edges = await this.createDjangoEdges(nodes)
    const dependencies = await this.analyzeDependencies(context)
    const risks = await this.identifyDjangoRisks(files)

    return { files, nodes, edges, dependencies, risks }
  }

  private async fetchDjangoFiles(
    context: AnalysisContext
  ): Promise<FileAnalysis[]> {
    const structure = await this.fetchRepositoryStructure(context)

    const interestingNames = [
      'settings.py',
      'urls.py',
      'models.py',
      'views.py',
      'requirements.txt',
      'manage.py',
    ]

    const matchingPaths = structure.filter(path =>
      interestingNames.some(name => path.endsWith(name))
    )

    const files: FileAnalysis[] = []

    for (const path of matchingPaths.slice(0, 30)) {
      try {
        const fileContent = await this.fetchFileContent(context, path)

        if (!fileContent) continue

        files.push({
          path,
          type: this.getFileType(path),
          language: path.endsWith('.py') ? 'Python' : 'Text',
          size: fileContent.length,
          lines_of_code: fileContent.split('\n').length,
          imports: this.extractImports(fileContent),
          exports: this.extractExports(fileContent),
          dependencies: [],
        })
      } catch (error) {
        console.warn(`Could not analyze ${path}`, error)
      }
    }

    return files
  }

  private async createDjangoNodes(files: FileAnalysis[], context: AnalysisContext): Promise<ArchitectureNode[]> {
    const nodes: ArchitectureNode[] = []

    // Main Django app node
    nodes.push({
      id: 'django-app',
      type: 'backend',
      label: 'Django Application',
      description: 'Main Django web application with models, views, and URL routing',
      position: { x: 200, y: 100 },
      data: {
        files: files.map(f => f.path),
        dependencies: [],
        exports: ['HTTP API', 'Web Interface'],
      }
    })

    // Models node if models.py exists
    const modelsFile = files.find(f => f.path.includes('models.py'))
    if (modelsFile) {
      nodes.push({
        id: 'django-models',
        type: 'backend',
        label: 'Django Models',
        description: 'Data models and ORM layer',
        position: { x: 100, y: 200 },
        data: {
          files: ['models.py'],
          dependencies: [],
          exports: ['Model Classes', 'Database Schema'],
        }
      })
    }

    // Views node if views.py exists
    const viewsFile = files.find(f => f.path.includes('views.py'))
    if (viewsFile) {
      nodes.push({
        id: 'django-views',
        type: 'backend',
        label: 'Django Views',
        description: 'Request handlers and business logic',
        position: { x: 300, y: 200 },
        data: {
          files: ['views.py'],
          dependencies: [],
          exports: ['HTTP Handlers', 'API Endpoints'],
        }
      })
    }

    return nodes
  }

  private async createDjangoEdges(nodes: ArchitectureNode[]): Promise<ArchitectureEdge[]> {
    const edges: ArchitectureEdge[] = []

    const appNode = nodes.find(n => n.id === 'django-app')
    const modelsNode = nodes.find(n => n.id === 'django-models')
    const viewsNode = nodes.find(n => n.id === 'django-views')

    if (appNode && modelsNode) {
      edges.push({
        id: 'app-models',
        source: appNode.id,
        target: modelsNode.id,
        type: 'contains',
        label: 'includes'
      })
    }

    if (appNode && viewsNode) {
      edges.push({
        id: 'app-views',
        source: appNode.id,
        target: viewsNode.id,
        type: 'contains',
        label: 'includes'
      })
    }

    if (viewsNode && modelsNode) {
      edges.push({
        id: 'views-models',
        source: viewsNode.id,
        target: modelsNode.id,
        type: 'dependency',
        label: 'uses'
      })
    }

    return edges
  }

  private async analyzeDependencies(context: AnalysisContext): Promise<string[]> {
    try {
      const requirementsContent = await this.fetchFileContent(context, 'requirements.txt')
      if (requirementsContent) {
        return requirementsContent
          .split('\n')
          .filter(line => line.trim() && !line.startsWith('#'))
          .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].trim())
      }
    } catch (error) {
      // No requirements.txt found
    }
    return []
  }

  private async identifyDjangoRisks(files: FileAnalysis[]): Promise<string[]> {
    const risks: string[] = []

    const settingsFile = files.find(f => f.path.includes('settings.py'))
    if (settingsFile) {
      // Check for common Django security risks (simplified)
      risks.push('Check DEBUG setting in production')
      risks.push('Verify SECRET_KEY security')
      risks.push('Review ALLOWED_HOSTS configuration')
    }

    return risks
  }

  private async fetchFileContent(context: AnalysisContext, fileName: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${context.repository.full_name}/contents/${fileName}`,
        {
          headers: {
            'Authorization': `token ${context.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (!response.ok) return null

      const data = await response.json()
      return atob(data.content.replace(/\s/g, ''))
    } catch (error) {
      return null
    }
  }

  private async fetchRepositoryStructure(context: AnalysisContext): Promise<string[]> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${context.repository.full_name}/git/trees/${context.repository.default_branch}?recursive=1`,
        {
          headers: {
            'Authorization': `token ${context.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      if (!response.ok) return []

      const data = await response.json()
      return data.tree
        .filter((item: any) => item.type === 'blob')
        .map((item: any) => item.path)
    } catch (error) {
      return []
    }
  }

  private getFileType(fileName: string): 'source' | 'config' | 'dependency' | 'documentation' | 'test' {
    if (fileName.includes('requirements') || fileName.includes('setup.py')) return 'dependency'
    if (fileName.includes('settings')) return 'config'
    if (fileName.includes('test')) return 'test'
    if (fileName.includes('.md')) return 'documentation'
    return 'source'
  }

  private extractImports(content: string): string[] {
    const importRegex = /^(?:from\s+(\S+)\s+)?import\s+(.+)$/gm
    const imports: string[] = []
    let match

    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        imports.push(match[1])
      }
      const importedItems = match[2].split(',').map(item => item.trim())
      imports.push(...importedItems)
    }

    return imports
  }

  private extractExports(content: string): string[] {
    // Simplified export extraction for Django
    const classRegex = /^class\s+(\w+)/gm
    const functionRegex = /^def\s+(\w+)/gm
    const exports: string[] = []
    let match

    while ((match = classRegex.exec(content)) !== null) {
      exports.push(match[1])
    }

    while ((match = functionRegex.exec(content)) !== null) {
      exports.push(match[1])
    }

    return exports
  }
}

