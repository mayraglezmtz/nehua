import type { AnalysisContext, FrameworkAnalyzer } from '../static-engine'
import { FileAnalysis, ArchitectureNode, ArchitectureEdge } from '@/types'

export class FastAPIAnalyzer implements FrameworkAnalyzer {
  canAnalyze(framework: any): boolean {
    return framework.framework === 'fastapi'
  }

  async analyze(context: AnalysisContext): Promise<{
    files: FileAnalysis[]
    nodes: ArchitectureNode[]
    edges: ArchitectureEdge[]
    dependencies: string[]
    risks: string[]
  }> {
    const files = await this.fetchFastAPIFiles(context)
    const nodes = await this.createFastAPINodes(files, context)
    const edges = await this.createFastAPIEdges(nodes)
    const dependencies = await this.analyzeDependencies(context)
    const risks = await this.identifyFastAPIRisks(files, dependencies)

    return { files, nodes, edges, dependencies, risks }
  }

  private async fetchFastAPIFiles(context: AnalysisContext): Promise<FileAnalysis[]> {
    const keyFiles = [
      'main.py',
      'app/main.py', 
      'requirements.txt',
      'pyproject.toml',
      'Pipfile'
    ]
    
    const routerPatterns = ['routers/', 'app/routers/', 'api/']
    const modelPatterns = ['models/', 'app/models/', 'schemas/']
    
    const files: FileAnalysis[] = []

    // Fetch key files
    for (const fileName of keyFiles) {
      const fileContent = await this.fetchFileContent(context, fileName)
      if (fileContent) {
        files.push(this.createFileAnalysis(fileName, fileContent, 'Python'))
      }
    }

    // Fetch router files
    const allFiles = await this.fetchRepositoryStructure(context)
    
    for (const pattern of routerPatterns) {
      const routerFiles = allFiles.filter(f => 
        f.startsWith(pattern) && f.endsWith('.py')
      )
      
      for (const routerFile of routerFiles.slice(0, 5)) { // Limit to 5 files
        const content = await this.fetchFileContent(context, routerFile)
        if (content) {
          files.push(this.createFileAnalysis(routerFile, content, 'Python'))
        }
      }
    }

    // Fetch model/schema files
    for (const pattern of modelPatterns) {
      const modelFiles = allFiles.filter(f => 
        f.startsWith(pattern) && f.endsWith('.py')
      )
      
      for (const modelFile of modelFiles.slice(0, 3)) { // Limit to 3 files
        const content = await this.fetchFileContent(context, modelFile)
        if (content) {
          files.push(this.createFileAnalysis(modelFile, content, 'Python'))
        }
      }
    }

    return files
  }

  private async createFastAPINodes(files: FileAnalysis[], context: AnalysisContext): Promise<ArchitectureNode[]> {
    const nodes: ArchitectureNode[] = []
    const nodeConfig = context.config.node_types

    // Main FastAPI Application
    const mainFiles = files.filter(f => 
      f.path.includes('main.py') || f.path === 'main.py'
    )

    if (mainFiles.length > 0) {
      nodes.push({
        id: 'fastapi-app',
        type: 'backend',
        label: 'FastAPI Application',
        description: 'Main FastAPI application with async API endpoints and automatic OpenAPI documentation',
        position: { x: 200, y: 100 },
        data: {
          files: mainFiles.map(f => f.path),
          dependencies: this.extractFastAPIImports(mainFiles[0]),
          exports: ['REST API', 'OpenAPI Docs', 'Async Endpoints']
        },
        style: {
          backgroundColor: nodeConfig.backend.color,
          borderColor: nodeConfig.backend.color,
          color: '#FFFFFF'
        }
      })
    }

    // API Routers
    const routerFiles = files.filter(f => 
      f.path.includes('router') || f.path.includes('api/')
    )

    if (routerFiles.length > 0) {
      const routerNames = routerFiles.map(f => this.extractRouterName(f.path))
      
      nodes.push({
        id: 'fastapi-routers',
        type: 'backend',
        label: 'API Routers',
        description: `Modular API endpoints: ${routerNames.join(', ')}`,
        position: { x: 400, y: 150 },
        data: {
          files: routerFiles.map(f => f.path),
          dependencies: [],
          exports: routerNames.map(name => `${name} API`)
        },
        style: {
          backgroundColor: nodeConfig.backend.color,
          borderColor: nodeConfig.backend.color,
          color: '#FFFFFF'
        }
      })
    }

    // Data Models/Schemas
    const modelFiles = files.filter(f => 
      f.path.includes('model') || f.path.includes('schema')
    )

    if (modelFiles.length > 0) {
      nodes.push({
        id: 'fastapi-models',
        type: 'backend',
        label: 'Data Models',
        description: 'Pydantic models for request/response validation and serialization',
        position: { x: 100, y: 250 },
        data: {
          files: modelFiles.map(f => f.path),
          dependencies: ['pydantic'],
          exports: this.extractModelClasses(modelFiles)
        },
        style: {
          backgroundColor: nodeConfig.backend.color,
          borderColor: nodeConfig.backend.color,
          color: '#FFFFFF'
        }
      })
    }

    // Dependencies as separate nodes
    const dependencies = await this.analyzeDependencies(context)
    
    if (dependencies.includes('sqlalchemy') || dependencies.some(d => d.includes('database'))) {
      nodes.push({
        id: 'fastapi-database',
        type: 'database',
        label: 'Database Layer',
        description: 'SQLAlchemy ORM with async database operations',
        position: { x: 50, y: 400 },
        data: {
          files: [],
          dependencies: ['sqlalchemy'],
          exports: ['Database Models', 'Async Queries']
        },
        style: {
          backgroundColor: nodeConfig.database.color,
          borderColor: nodeConfig.database.color,
          color: '#FFFFFF'
        }
      })
    }

    if (dependencies.includes('redis')) {
      nodes.push({
        id: 'fastapi-cache',
        type: 'cache',
        label: 'Redis Cache',
        description: 'Redis-backed caching layer',
        position: { x: 350, y: 400 },
        data: {
          files: [],
          dependencies: ['redis'],
          exports: ['Cache Operations']
        },
        style: {
          backgroundColor: nodeConfig.cache.color,
          borderColor: nodeConfig.cache.color,
          color: '#FFFFFF'
        }
      })
    }
    // Celery / task-queue detection is handled generically for all
    // frameworks by the cross-cutting pass in static-engine.ts.

    return nodes
  }

  private async createFastAPIEdges(nodes: ArchitectureNode[]): Promise<ArchitectureEdge[]> {
    const edges: ArchitectureEdge[] = []

    const appNode = nodes.find(n => n.id === 'fastapi-app')
    const routersNode = nodes.find(n => n.id === 'fastapi-routers')
    const modelsNode = nodes.find(n => n.id === 'fastapi-models')
    const databaseNode = nodes.find(n => n.id === 'fastapi-database')
    const cacheNode = nodes.find(n => n.id === 'fastapi-cache')

    // App includes routers
    if (appNode && routersNode) {
      edges.push({
        id: 'app-routers',
        source: appNode.id,
        target: routersNode.id,
        type: 'contains',
        label: 'includes',
        style: {
          stroke: '#00DDFA',
          strokeWidth: 2
        }
      })
    }

    // Routers use models
    if (routersNode && modelsNode) {
      edges.push({
        id: 'routers-models',
        source: routersNode.id,
        target: modelsNode.id,
        type: 'dependency',
        label: 'validates with',
        style: {
          stroke: '#FADD00',
          strokeWidth: 2
        }
      })
    }

    // App connects to database
    if (appNode && databaseNode) {
      edges.push({
        id: 'app-database',
        source: appNode.id,
        target: databaseNode.id,
        type: 'dependency',
        label: 'queries',
        animated: true,
        style: {
          stroke: '#FA0080',
          strokeWidth: 2
        }
      })
    }

    // App uses cache
    if (appNode && cacheNode) {
      edges.push({
        id: 'app-cache',
        source: appNode.id,
        target: cacheNode.id,
        type: 'dependency',
        label: 'caches',
        style: {
          stroke: '#A59837',
          strokeWidth: 2
        }
      })
    }

    return edges
  }

  private async analyzeDependencies(context: AnalysisContext): Promise<string[]> {
    const dependencies: string[] = []
    
    // Check requirements.txt
    const requirementsContent = await this.fetchFileContent(context, 'requirements.txt')
    if (requirementsContent) {
      const reqDeps = this.parsePythonDependencies(requirementsContent)
      dependencies.push(...reqDeps)
    }

    // Check pyproject.toml
    const pyprojectContent = await this.fetchFileContent(context, 'pyproject.toml')
    if (pyprojectContent) {
      const pyprojectDeps = this.parsePyprojectDependencies(pyprojectContent)
      dependencies.push(...pyprojectDeps)
    }

    // Check Pipfile
    const pipfileContent = await this.fetchFileContent(context, 'Pipfile')
    if (pipfileContent) {
      const pipDeps = this.parsePipfileDependencies(pipfileContent)
      dependencies.push(...pipDeps)
    }

    return [...new Set(dependencies)] // Remove duplicates
  }

  private async identifyFastAPIRisks(files: FileAnalysis[], dependencies: string[]): Promise<string[]> {
    const risks: string[] = []

    // Check for security risks
    const mainFile = files.find(f => f.path.includes('main.py'))
    if (mainFile) {
      if (!mainFile.imports.includes('fastapi.security')) {
        risks.push('No security middleware detected - consider adding authentication')
      }
      
      if (!mainFile.imports.includes('fastapi.middleware.cors')) {
        risks.push('CORS middleware not configured - may cause frontend integration issues')
      }
    }

    // Check dependencies for security
    const outdatedPackages = ['fastapi<0.100.0', 'pydantic<2.0.0', 'sqlalchemy<1.4.0']
    for (const pkg of outdatedPackages) {
      if (dependencies.some(dep => dep.includes(pkg.split('<')[0]))) {
        risks.push(`Consider updating ${pkg.split('<')[0]} to latest version for security patches`)
      }
    }

    // Performance risks
    if (!dependencies.includes('uvicorn')) {
      risks.push('No ASGI server detected - add uvicorn for production deployment')
    }

    if (dependencies.includes('sqlalchemy') && !dependencies.includes('asyncpg')) {
      risks.push('Using sync database driver - consider asyncpg for better performance')
    }

    return risks
  }

  // Helper methods
  private createFileAnalysis(path: string, content: string, language: string): FileAnalysis {
    return {
      path,
      type: this.getFileType(path),
      language,
      size: content.length,
      lines_of_code: content.split('\n').filter(line => line.trim()).length,
      imports: this.extractPythonImports(content),
      exports: this.extractPythonExports(content),
      dependencies: []
    }
  }

  private extractFastAPIImports(file: FileAnalysis): string[] {
    return file.imports.filter(imp => 
      imp.includes('fastapi') || 
      imp.includes('pydantic') || 
      imp.includes('sqlalchemy')
    )
  }

  private extractRouterName(path: string): string {
    const fileName = path.split('/').pop()?.replace('.py', '') || 'router'
    return fileName.charAt(0).toUpperCase() + fileName.slice(1)
  }

  private extractModelClasses(files: FileAnalysis[]): string[] {
    const classes: string[] = []
    files.forEach(file => {
      file.exports.forEach(exp => {
        if (exp.includes('Model') || exp.includes('Schema')) {
          classes.push(exp)
        }
      })
    })
    return classes
  }

  private parsePythonDependencies(content: string): string[] {
    return content
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].trim())
  }

  private parsePyprojectDependencies(content: string): string[] {
    // Simplified TOML parsing for dependencies
    const dependencySection = content.match(/\[tool\.poetry\.dependencies\](.*?)(\[|$)/s)
    if (!dependencySection) return []
    
    const deps = dependencySection[1]
      .split('\n')
      .filter(line => line.includes('='))
      .map(line => line.split('=')[0].trim())
      .filter(dep => dep !== 'python')
    
    return deps
  }

  private parsePipfileDependencies(content: string): string[] {
    // Simplified Pipfile parsing
    const packageSection = content.match(/\[packages\](.*?)(\[|$)/s)
    if (!packageSection) return []
    
    return packageSection[1]
      .split('\n')
      .filter(line => line.includes('='))
      .map(line => line.split('=')[0].trim())
  }

  private extractPythonImports(content: string): string[] {
    const importRegex = /^(?:from\s+([^\s]+)\s+)?import\s+(.+)$/gm
    const imports: string[] = []
    let match

    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) imports.push(match[1])
      const importedItems = match[2].split(',').map(item => item.trim().split(' as ')[0])
      imports.push(...importedItems)
    }

    return [...new Set(imports)]
  }

  private extractPythonExports(content: string): string[] {
    const classRegex = /^class\s+(\w+)/gm
    const functionRegex = /^(?:async\s+)?def\s+(\w+)/gm
    const exports: string[] = []
    let match

    while ((match = classRegex.exec(content)) !== null) {
      exports.push(match[1])
    }

    while ((match = functionRegex.exec(content)) !== null) {
      if (!match[1].startsWith('_')) { // Exclude private functions
        exports.push(match[1])
      }
    }

    return exports
  }

  private getFileType(path: string): 'source' | 'config' | 'dependency' | 'documentation' | 'test' {
    if (path.includes('requirements') || path.includes('pyproject.toml') || path.includes('Pipfile')) {
      return 'dependency'
    }
    if (path.includes('config') || path.includes('settings')) {
      return 'config'
    }
    if (path.includes('test')) {
      return 'test'
    }
    if (path.includes('.md') || path.includes('.rst')) {
      return 'documentation'
    }
    return 'source'
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
      
      if (Array.isArray(data)) return null // It's a directory
      
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
}