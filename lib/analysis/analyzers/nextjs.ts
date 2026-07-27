import type { AnalysisContext, FrameworkAnalyzer } from '../static-engine'
import { FileAnalysis, ArchitectureNode, ArchitectureEdge } from '@/types'

export class NextJSAnalyzer implements FrameworkAnalyzer {
  canAnalyze(framework: any): boolean {
    return framework.framework === 'nextjs'
  }

  async analyze(context: AnalysisContext): Promise<{
    files: FileAnalysis[]
    nodes: ArchitectureNode[]
    edges: ArchitectureEdge[]
    dependencies: string[]
    risks: string[]
  }> {
    const files = await this.fetchNextJSFiles(context)
    const dependencies = await this.analyzeDependencies(context)
    const nodes = await this.createNextJSNodes(files, dependencies, context)
    const edges = await this.createNextJSEdges(nodes)
    const risks = await this.identifyNextJSRisks(files, dependencies)

    return { files, nodes, edges, dependencies, risks }
  }

  private async fetchNextJSFiles(context: AnalysisContext): Promise<FileAnalysis[]> {
    const keyFiles = [
      'package.json',
      'next.config.js',
      'next.config.mjs',
      'middleware.ts',
      'middleware.js',
    ]

    const files: FileAnalysis[] = []

    // Fetch key files
    for (const fileName of keyFiles) {
      const fileContent = await this.fetchFileContent(context, fileName)
      if (fileContent) {
        const language = this.getLanguageFromExtension(fileName)
        files.push(this.createFileAnalysis(fileName, fileContent, language))
      }
    }

    const allFiles = await this.fetchRepositoryStructure(context)

    // App Router: pages, layouts, and route handlers under app/
    const appRouterFiles = allFiles.filter(f =>
      f.startsWith('app/') &&
      (f.endsWith('page.tsx') || f.endsWith('page.jsx') || f.endsWith('page.ts') || f.endsWith('page.js') ||
       f.endsWith('layout.tsx') || f.endsWith('layout.jsx'))
    )

    for (const file of appRouterFiles.slice(0, 15)) {
      const content = await this.fetchFileContent(context, file)
      if (content) {
        files.push(this.createFileAnalysis(file, content, this.getLanguageFromExtension(file)))
      }
    }

    // App Router API route handlers
    const appApiFiles = allFiles.filter(f =>
      f.startsWith('app/api/') && (f.endsWith('route.ts') || f.endsWith('route.js'))
    )

    for (const file of appApiFiles.slice(0, 10)) {
      const content = await this.fetchFileContent(context, file)
      if (content) {
        files.push(this.createFileAnalysis(file, content, this.getLanguageFromExtension(file)))
      }
    }

    // Pages Router: pages/ (excluding pages/api/)
    const pagesRouterFiles = allFiles.filter(f =>
      f.startsWith('pages/') && !f.startsWith('pages/api/') &&
      (f.endsWith('.tsx') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.js'))
    )

    for (const file of pagesRouterFiles.slice(0, 15)) {
      const content = await this.fetchFileContent(context, file)
      if (content) {
        files.push(this.createFileAnalysis(file, content, this.getLanguageFromExtension(file)))
      }
    }

    // Pages Router API routes
    const pagesApiFiles = allFiles.filter(f =>
      f.startsWith('pages/api/') &&
      (f.endsWith('.ts') || f.endsWith('.js'))
    )

    for (const file of pagesApiFiles.slice(0, 10)) {
      const content = await this.fetchFileContent(context, file)
      if (content) {
        files.push(this.createFileAnalysis(file, content, this.getLanguageFromExtension(file)))
      }
    }

    return files
  }

  private async createNextJSNodes(
    files: FileAnalysis[],
    dependencies: string[],
    context: AnalysisContext
  ): Promise<ArchitectureNode[]> {
    const nodes: ArchitectureNode[] = []
    const nodeConfig = context.config.node_types

    const usesAppRouter = files.some(f => f.path.startsWith('app/') && !f.path.startsWith('app/api/'))
    const usesPagesRouter = files.some(f => f.path.startsWith('pages/') && !f.path.startsWith('pages/api/'))

    // Root Next.js application node
    nodes.push({
      id: 'nextjs-app',
      type: 'frontend',
      label: 'Next.js Application',
      description: usesAppRouter
        ? 'Full-stack React application using the Next.js App Router with server components'
        : 'Full-stack React application using the Next.js Pages Router',
      position: { x: 250, y: 80 },
      data: {
        files: files.filter(f => f.path === 'package.json' || f.path.includes('next.config')).map(f => f.path),
        dependencies: dependencies.filter(d => ['next', 'react', 'react-dom'].includes(d)),
        exports: ['Pages', 'Layouts', 'Server & Client Components'],
      },
      style: {
        backgroundColor: nodeConfig.frontend.color,
        borderColor: nodeConfig.frontend.color,
        color: '#FFFFFF',
      },
    })

    if (usesAppRouter) {
      const appRouterFiles = files.filter(f => f.path.startsWith('app/') && !f.path.startsWith('app/api/'))
      nodes.push({
        id: 'nextjs-app-router',
        type: 'frontend',
        label: 'App Router',
        description: `Route segments, layouts, and server components: ${appRouterFiles.length} files`,
        position: { x: 100, y: 220 },
        data: {
          files: appRouterFiles.map(f => f.path),
          dependencies: [],
          exports: ['Pages', 'Layouts', 'Server Components'],
        },
        style: {
          backgroundColor: nodeConfig.frontend.color,
          borderColor: nodeConfig.frontend.color,
          color: '#FFFFFF',
        },
      })
    }

    if (usesPagesRouter) {
      const pagesRouterFiles = files.filter(f => f.path.startsWith('pages/') && !f.path.startsWith('pages/api/'))
      nodes.push({
        id: 'nextjs-pages-router',
        type: 'frontend',
        label: 'Pages Router',
        description: `File-system routed pages: ${pagesRouterFiles.length} files`,
        position: { x: 100, y: 220 },
        data: {
          files: pagesRouterFiles.map(f => f.path),
          dependencies: [],
          exports: ['Pages', 'getServerSideProps/getStaticProps'],
        },
        style: {
          backgroundColor: nodeConfig.frontend.color,
          borderColor: nodeConfig.frontend.color,
          color: '#FFFFFF',
        },
      })
    }

    // API routes (App Router route handlers or Pages Router pages/api)
    const apiRouteFiles = files.filter(f =>
      (f.path.startsWith('app/api/') && f.path.endsWith('route.ts')) ||
      (f.path.startsWith('app/api/') && f.path.endsWith('route.js')) ||
      f.path.startsWith('pages/api/')
    )

    if (apiRouteFiles.length > 0) {
      nodes.push({
        id: 'nextjs-api-routes',
        type: 'backend',
        label: 'API Routes',
        description: `Server-side API endpoints handled within Next.js: ${apiRouteFiles.length} routes`,
        position: { x: 400, y: 220 },
        data: {
          files: apiRouteFiles.map(f => f.path),
          dependencies: [],
          exports: ['HTTP Handlers', 'REST/JSON API'],
        },
        style: {
          backgroundColor: nodeConfig.backend.color,
          borderColor: nodeConfig.backend.color,
          color: '#FFFFFF',
        },
      })
    }

    // Middleware
    const middlewareFile = files.find(f => f.path === 'middleware.ts' || f.path === 'middleware.js')
    if (middlewareFile) {
      nodes.push({
        id: 'nextjs-middleware',
        type: 'infrastructure',
        label: 'Middleware',
        description: 'Edge middleware for request interception (auth checks, redirects, header rewriting)',
        position: { x: 400, y: 350 },
        data: {
          files: [middlewareFile.path],
          dependencies: [],
          exports: ['Request Interception'],
        },
        style: {
          backgroundColor: nodeConfig.infrastructure.color,
          borderColor: nodeConfig.infrastructure.color,
          color: '#FFFFFF',
        },
      })
    }

    // Database / ORM layer
    const hasPrisma = dependencies.includes('@prisma/client') || dependencies.includes('prisma')
    const hasMongoose = dependencies.includes('mongoose')
    const hasDrizzle = dependencies.some(d => d.includes('drizzle'))
    if (hasPrisma || hasMongoose || hasDrizzle) {
      nodes.push({
        id: 'nextjs-database',
        type: 'database',
        label: 'Database Layer',
        description: hasPrisma
          ? 'Prisma ORM for type-safe database access'
          : hasMongoose
            ? 'MongoDB access via Mongoose'
            : 'Drizzle ORM for type-safe database access',
        position: { x: 550, y: 320 },
        data: {
          files: [],
          dependencies: dependencies.filter(d => ['@prisma/client', 'prisma', 'mongoose'].includes(d) || d.includes('drizzle')),
          exports: ['Data Models', 'Queries'],
        },
        style: {
          backgroundColor: nodeConfig.database.color,
          borderColor: nodeConfig.database.color,
          color: '#FFFFFF',
        },
      })
    }

    // Global state management
    if (dependencies.includes('redux') || dependencies.includes('@reduxjs/toolkit')) {
      nodes.push({
        id: 'nextjs-redux',
        type: 'frontend',
        label: 'Redux Store',
        description: 'Global client-side state management with Redux',
        position: { x: 250, y: 350 },
        data: {
          files: [],
          dependencies: ['redux'],
          exports: ['Global State', 'Actions', 'Reducers'],
        },
        style: {
          backgroundColor: nodeConfig.frontend.color,
          borderColor: nodeConfig.frontend.color,
          color: '#FFFFFF',
        },
      })
    } else if (dependencies.includes('zustand') || dependencies.includes('jotai')) {
      nodes.push({
        id: 'nextjs-state',
        type: 'frontend',
        label: 'State Management',
        description: 'Modern lightweight client-side state management',
        position: { x: 250, y: 350 },
        data: {
          files: [],
          dependencies: dependencies.filter(d => ['zustand', 'jotai', 'valtio'].includes(d)),
          exports: ['Global State'],
        },
        style: {
          backgroundColor: nodeConfig.frontend.color,
          borderColor: nodeConfig.frontend.color,
          color: '#FFFFFF',
        },
      })
    }

    // Authentication
    if (dependencies.includes('next-auth') || dependencies.includes('@auth/core')) {
      nodes.push({
        id: 'nextjs-auth',
        type: 'authentication',
        label: 'Authentication',
        description: 'Session-based authentication via NextAuth.js',
        position: { x: 550, y: 220 },
        data: {
          files: [],
          dependencies: ['next-auth'],
          exports: ['Session Management', 'OAuth Providers'],
        },
        style: {
          backgroundColor: nodeConfig.authentication.color,
          borderColor: nodeConfig.authentication.color,
          color: '#FFFFFF',
        },
      })
    }

    return nodes
  }

  private async createNextJSEdges(nodes: ArchitectureNode[]): Promise<ArchitectureEdge[]> {
    const edges: ArchitectureEdge[] = []

    const appNode = nodes.find(n => n.id === 'nextjs-app')
    const appRouterNode = nodes.find(n => n.id === 'nextjs-app-router')
    const pagesRouterNode = nodes.find(n => n.id === 'nextjs-pages-router')
    const apiRoutesNode = nodes.find(n => n.id === 'nextjs-api-routes')
    const middlewareNode = nodes.find(n => n.id === 'nextjs-middleware')
    const databaseNode = nodes.find(n => n.id === 'nextjs-database')
    const stateNode = nodes.find(n => n.id === 'nextjs-redux' || n.id === 'nextjs-state')
    const authNode = nodes.find(n => n.id === 'nextjs-auth')

    const routerNode = appRouterNode || pagesRouterNode
    if (appNode && routerNode) {
      edges.push({
        id: `app-${routerNode.id}`,
        source: appNode.id,
        target: routerNode.id,
        type: 'contains',
        label: 'renders',
        style: { stroke: '#00DDFA', strokeWidth: 2 },
      })
    }

    if (routerNode && apiRoutesNode) {
      edges.push({
        id: `${routerNode.id}-api`,
        source: routerNode.id,
        target: apiRoutesNode.id,
        type: 'api_call',
        label: 'fetches data',
        animated: true,
        style: { stroke: '#FA0080', strokeWidth: 2 },
      })
    }

    if (appNode && middlewareNode) {
      edges.push({
        id: 'app-middleware',
        source: appNode.id,
        target: middlewareNode.id,
        type: 'dependency',
        label: 'intercepted by',
        style: { stroke: '#7A3D5D', strokeWidth: 2 },
      })
    }

    if (apiRoutesNode && databaseNode) {
      edges.push({
        id: 'api-database',
        source: apiRoutesNode.id,
        target: databaseNode.id,
        type: 'dependency',
        label: 'queries',
        animated: true,
        style: { stroke: '#FADD00', strokeWidth: 2 },
      })
    }

    if (appNode && stateNode) {
      edges.push({
        id: 'app-state',
        source: appNode.id,
        target: stateNode.id,
        type: 'dependency',
        label: 'manages state',
        style: { stroke: '#A59837', strokeWidth: 2 },
      })
    }

    if (appNode && authNode) {
      edges.push({
        id: 'app-auth',
        source: appNode.id,
        target: authNode.id,
        type: 'dependency',
        label: 'authenticates via',
        style: { stroke: '#3D737A', strokeWidth: 2 },
      })
    }

    return edges
  }

  private async analyzeDependencies(context: AnalysisContext): Promise<string[]> {
    const packageJsonContent = await this.fetchFileContent(context, 'package.json')
    if (!packageJsonContent) return []

    try {
      const packageJson = JSON.parse(packageJsonContent)
      return [
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.devDependencies || {}),
      ]
    } catch (error) {
      return []
    }
  }

  private async identifyNextJSRisks(files: FileAnalysis[], dependencies: string[]): Promise<string[]> {
    const risks: string[] = []

    const hasAppRouter = files.some(f => f.path.startsWith('app/'))
    const hasApiRoutes = files.some(f =>
      f.path.startsWith('app/api/') || f.path.startsWith('pages/api/')
    )
    const middlewareFile = files.find(f => f.path === 'middleware.ts' || f.path === 'middleware.js')

    if (hasApiRoutes && !middlewareFile && !dependencies.includes('next-auth')) {
      risks.push('API routes detected with no middleware or auth library - verify endpoints are properly protected')
    }

    const nextConfigFile = files.find(f => f.path.includes('next.config'))
    if (nextConfigFile) {
      risks.push('Review next.config for security headers (Content-Security-Policy, X-Frame-Options)')
    }

    if (!hasAppRouter && files.some(f => f.path.startsWith('pages/'))) {
      risks.push('Using the legacy Pages Router - consider migrating to the App Router for React Server Components and improved data fetching')
    }

    const hasLargeBundle = dependencies.some(dep =>
      ['lodash', 'moment', 'antd'].includes(dep.split('@')[0])
    )
    if (hasLargeBundle) {
      risks.push('Large dependencies detected - consider code splitting and tree shaking')
    }

    if (!dependencies.includes('typescript')) {
      risks.push('No TypeScript detected - consider adding it for type safety across pages and API routes')
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
      imports: this.extractJSImports(content),
      exports: this.extractJSExports(content),
      dependencies: [],
    }
  }

  private getLanguageFromExtension(fileName: string): string {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) return 'TypeScript'
    if (fileName.endsWith('.jsx') || fileName.endsWith('.js') || fileName.endsWith('.mjs')) return 'JavaScript'
    if (fileName.endsWith('.json')) return 'JSON'
    return 'JavaScript'
  }

  private extractJSImports(content: string): string[] {
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*(?:{[^}]*}|\w+))?\s*from\s+['"]([^'"]+)['"]/g
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g

    const imports: string[] = []
    let match

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1])
    }

    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1])
    }

    return imports
  }

  private extractJSExports(content: string): string[] {
    const exportDefaultRegex = /export\s+default\s+(\w+)/g
    const exportNamedRegex = /export\s+(?:const|let|var|function|class|async function)\s+(\w+)/g

    const exports: string[] = []
    let match

    while ((match = exportDefaultRegex.exec(content)) !== null) {
      exports.push(match[1])
    }

    while ((match = exportNamedRegex.exec(content)) !== null) {
      exports.push(match[1])
    }

    return exports
  }

  private getFileType(path: string): 'source' | 'config' | 'dependency' | 'documentation' | 'test' {
    if (path.includes('package.json') || path.includes('yarn.lock') || path.includes('package-lock.json')) {
      return 'dependency'
    }
    if (path.includes('next.config') || path.includes('middleware')) {
      return 'config'
    }
    if (path.includes('test') || path.includes('.test.') || path.includes('.spec.')) {
      return 'test'
    }
    if (path.includes('.md') || path.includes('README')) {
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

      if (Array.isArray(data)) return null

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
