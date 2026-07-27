import type { AnalysisContext, FrameworkAnalyzer } from '../static-engine'
import { FileAnalysis, ArchitectureNode, ArchitectureEdge } from '@/types'

export class ReactAnalyzer implements FrameworkAnalyzer {
  canAnalyze(framework: any): boolean {
    return framework.framework === 'react'
  }

  async analyze(context: AnalysisContext): Promise<{
    files: FileAnalysis[]
    nodes: ArchitectureNode[]
    edges: ArchitectureEdge[]
    dependencies: string[]
    risks: string[]
  }> {
    const files = await this.fetchReactFiles(context)
    const nodes = await this.createReactNodes(files, context)
    const edges = await this.createReactEdges(nodes)
    const dependencies = await this.analyzeDependencies(context)
    const risks = await this.identifyReactRisks(files, dependencies)

    return { files, nodes, edges, dependencies, risks }
  }

  private async fetchReactFiles(context: AnalysisContext): Promise<FileAnalysis[]> {
    const keyFiles = [
      'package.json',
      'src/App.js',
      'src/App.tsx',
      'src/index.js',
      'src/index.tsx',
      'public/index.html'
    ]
    
    const componentPatterns = ['src/components/', 'src/pages/', 'components/']
    const hookPatterns = ['src/hooks/', 'hooks/']
    const utilPatterns = ['src/utils/', 'src/lib/', 'utils/', 'lib/']
    
    const files: FileAnalysis[] = []

    // Fetch key files
    for (const fileName of keyFiles) {
      const fileContent = await this.fetchFileContent(context, fileName)
      if (fileContent) {
        const language = this.getLanguageFromExtension(fileName)
        files.push(this.createFileAnalysis(fileName, fileContent, language))
      }
    }

    // Fetch component files
    const allFiles = await this.fetchRepositoryStructure(context)
    
    for (const pattern of componentPatterns) {
      const componentFiles = allFiles.filter(f => 
        f.startsWith(pattern) && (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.tsx'))
      )
      
      for (const componentFile of componentFiles.slice(0, 10)) { // Limit to 10 files
        const content = await this.fetchFileContent(context, componentFile)
        if (content) {
          const language = this.getLanguageFromExtension(componentFile)
          files.push(this.createFileAnalysis(componentFile, content, language))
        }
      }
    }

    // Fetch hook files
    for (const pattern of hookPatterns) {
      const hookFiles = allFiles.filter(f => 
        f.startsWith(pattern) && (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.tsx'))
      )
      
      for (const hookFile of hookFiles.slice(0, 5)) { // Limit to 5 files
        const content = await this.fetchFileContent(context, hookFile)
        if (content) {
          const language = this.getLanguageFromExtension(hookFile)
          files.push(this.createFileAnalysis(hookFile, content, language))
        }
      }
    }

    return files
  }

  private async createReactNodes(files: FileAnalysis[], context: AnalysisContext): Promise<ArchitectureNode[]> {
    const nodes: ArchitectureNode[] = []
    const nodeConfig = context.config.node_types

    // Main React Application
    const appFiles = files.filter(f => 
      f.path.includes('App.') || f.path.includes('index.')
    )

    if (appFiles.length > 0) {
      nodes.push({
        id: 'react-app',
        type: 'frontend',
        label: 'React Application',
        description: 'Main React application with component hierarchy and state management',
        position: { x: 200, y: 100 },
        data: {
          files: appFiles.map(f => f.path),
          dependencies: this.extractReactImports(appFiles),
          exports: ['React Components', 'UI Interface', 'User Interactions']
        },
        style: {
          backgroundColor: nodeConfig.frontend.color,
          borderColor: nodeConfig.frontend.color,
          color: '#FFFFFF'
        }
      })
    }

    // Components Layer
    const componentFiles = files.filter(f => 
      f.path.includes('component') || f.path.includes('Component')
    )

    if (componentFiles.length > 0) {
      const componentNames = componentFiles.map(f => this.extractComponentName(f.path))
      
      nodes.push({
        id: 'react-components',
        type: 'frontend',
        label: 'React Components',
        description: `Reusable UI components: ${componentNames.slice(0, 5).join(', ')}${componentNames.length > 5 ? '...' : ''}`,
        position: { x: 100, y: 250 },
        data: {
          files: componentFiles.map(f => f.path),
          dependencies: [],
          exports: componentNames
        },
        style: {
          backgroundColor: nodeConfig.frontend.color,
          borderColor: nodeConfig.frontend.color,
          color: '#FFFFFF'
        }
      })
    }

    // Hooks Layer
    const hookFiles = files.filter(f => 
      f.path.includes('hooks/') || f.path.includes('use')
    )

    if (hookFiles.length > 0) {
      const hookNames = hookFiles.map(f => this.extractHookName(f.path))
      
      nodes.push({
        id: 'react-hooks',
        type: 'frontend',
        label: 'Custom Hooks',
        description: `State and effect management: ${hookNames.join(', ')}`,
        position: { x: 300, y: 250 },
        data: {
          files: hookFiles.map(f => f.path),
          dependencies: ['react'],
          exports: hookNames
        },
        style: {
          backgroundColor: nodeConfig.frontend.color,
          borderColor: nodeConfig.frontend.color,
          color: '#FFFFFF'
        }
      })
    }

    // State Management
    const dependencies = await this.analyzeDependencies(context)
    
    if (dependencies.includes('redux') || dependencies.includes('@reduxjs/toolkit')) {
      nodes.push({
        id: 'react-redux',
        type: 'frontend',
        label: 'Redux Store',
        description: 'Global state management with Redux',
        position: { x: 400, y: 150 },
        data: {
          files: [],
          dependencies: ['redux'],
          exports: ['Global State', 'Actions', 'Reducers']
        },
        style: {
          backgroundColor: nodeConfig.frontend.color,
          borderColor: nodeConfig.frontend.color,
          color: '#FFFFFF'
        }
      })
    }

    if (dependencies.includes('zustand') || dependencies.includes('jotai')) {
      nodes.push({
        id: 'react-state',
        type: 'frontend',
        label: 'State Management',
        description: 'Modern state management solution',
        position: { x: 400, y: 150 },
        data: {
          files: [],
          dependencies: dependencies.filter(d => ['zustand', 'jotai', 'valtio'].includes(d)),
          exports: ['Global State', 'State Updates']
        },
        style: {
          backgroundColor: nodeConfig.frontend.color,
          borderColor: nodeConfig.frontend.color,
          color: '#FFFFFF'
        }
      })
    }

    // API Layer
    if (dependencies.includes('axios') || dependencies.includes('fetch') || 
        files.some(f => f.imports.includes('fetch'))) {
      nodes.push({
        id: 'react-api',
        type: 'external_api',
        label: 'API Client',
        description: 'HTTP client for backend communication',
        position: { x: 50, y: 400 },
        data: {
          files: [],
          dependencies: ['axios'],
          exports: ['HTTP Requests', 'Data Fetching']
        },
        style: {
          backgroundColor: nodeConfig.external_api.color,
          borderColor: nodeConfig.external_api.color,
          color: '#FFFFFF'
        }
      })
    }

    // Routing
    if (dependencies.includes('react-router-dom') || dependencies.includes('@reach/router')) {
      nodes.push({
        id: 'react-router',
        type: 'frontend',
        label: 'React Router',
        description: 'Client-side routing and navigation',
        position: { x: 350, y: 350 },
        data: {
          files: [],
          dependencies: ['react-router-dom'],
          exports: ['Routes', 'Navigation']
        },
        style: {
          backgroundColor: nodeConfig.frontend.color,
          borderColor: nodeConfig.frontend.color,
          color: '#FFFFFF'
        }
      })
    }

    return nodes
  }

  private async createReactEdges(nodes: ArchitectureNode[]): Promise<ArchitectureEdge[]> {
    const edges: ArchitectureEdge[] = []

    const appNode = nodes.find(n => n.id === 'react-app')
    const componentsNode = nodes.find(n => n.id === 'react-components')
    const hooksNode = nodes.find(n => n.id === 'react-hooks')
    const stateNode = nodes.find(n => n.id === 'react-redux' || n.id === 'react-state')
    const apiNode = nodes.find(n => n.id === 'react-api')
    const routerNode = nodes.find(n => n.id === 'react-router')

    // App uses components
    if (appNode && componentsNode) {
      edges.push({
        id: 'app-components',
        source: appNode.id,
        target: componentsNode.id,
        type: 'contains',
        label: 'renders',
        style: {
          stroke: '#00DDFA',
          strokeWidth: 2
        }
      })
    }

    // Components use hooks
    if (componentsNode && hooksNode) {
      edges.push({
        id: 'components-hooks',
        source: componentsNode.id,
        target: hooksNode.id,
        type: 'dependency',
        label: 'uses',
        style: {
          stroke: '#FADD00',
          strokeWidth: 2
        }
      })
    }

    // App connects to state management
    if (appNode && stateNode) {
      edges.push({
        id: 'app-state',
        source: appNode.id,
        target: stateNode.id,
        type: 'dependency',
        label: 'manages state',
        animated: true,
        style: {
          stroke: '#FA0080',
          strokeWidth: 2
        }
      })
    }

    // App uses API
    if (appNode && apiNode) {
      edges.push({
        id: 'app-api',
        source: appNode.id,
        target: apiNode.id,
        type: 'api_call',
        label: 'fetches data',
        animated: true,
        style: {
          stroke: '#A59837',
          strokeWidth: 2
        }
      })
    }

    // App uses routing
    if (appNode && routerNode) {
      edges.push({
        id: 'app-router',
        source: appNode.id,
        target: routerNode.id,
        type: 'dependency',
        label: 'navigates',
        style: {
          stroke: '#7A3D5D',
          strokeWidth: 2
        }
      })
    }

    return edges
  }

  private async analyzeDependencies(context: AnalysisContext): Promise<string[]> {
    const packageJsonContent = await this.fetchFileContent(context, 'package.json')
    if (!packageJsonContent) return []

    try {
      const packageJson = JSON.parse(packageJsonContent)
      const dependencies = [
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.devDependencies || {})
      ]
      
      return dependencies
    } catch (error) {
      return []
    }
  }

  private async identifyReactRisks(files: FileAnalysis[], dependencies: string[]): Promise<string[]> {
    const risks: string[] = []

    // Check React version
    const packageJsonContent = await this.fetchPackageJson(files)
    if (packageJsonContent) {
      const reactVersion = packageJsonContent.dependencies?.react
      if (reactVersion && reactVersion.includes('16.')) {
        risks.push('Using React 16 - consider upgrading to React 18 for latest features and performance')
      }
    }

    // Check for outdated packages
    const outdatedPatterns = [
      'react-router@5',
      'react-scripts@4',
      'webpack@4'
    ]

    dependencies.forEach(dep => {
      if (dep.includes('react-router') && !dep.includes('dom')) {
        risks.push('Using older React Router - consider upgrading to react-router-dom v6')
      }
    })

    // Security risks
    if (!dependencies.includes('helmet') && !dependencies.includes('react-helmet')) {
      risks.push('No helmet library detected - consider adding for security headers')
    }

    // Performance risks
    const hasLargeBundle = dependencies.some(dep => 
      ['lodash', 'moment', 'antd'].includes(dep.split('@')[0])
    )
    
    if (hasLargeBundle) {
      risks.push('Large dependencies detected - consider code splitting and tree shaking')
    }

    // Check for console.log in production files
    const hasConsoleLog = files.some(file => 
      file.path.includes('src/') && 
      !file.path.includes('test') &&
      this.containsConsoleLog(file)
    )

    if (hasConsoleLog) {
      risks.push('Console.log statements found in source files - remove for production')
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
      dependencies: []
    }
  }

  private extractReactImports(files: FileAnalysis[]): string[] {
    const reactImports: string[] = []
    files.forEach(file => {
      file.imports.forEach(imp => {
        if (imp.includes('react') || imp.includes('React')) {
          reactImports.push(imp)
        }
      })
    })
    return [...new Set(reactImports)]
  }

  private extractComponentName(path: string): string {
    const fileName = path.split('/').pop()?.replace(/\.(js|jsx|ts|tsx)$/, '') || 'Component'
    return fileName.charAt(0).toUpperCase() + fileName.slice(1)
  }

  private extractHookName(path: string): string {
    const fileName = path.split('/').pop()?.replace(/\.(js|jsx|ts|tsx)$/, '') || 'hook'
    return fileName.startsWith('use') ? fileName : `use${fileName.charAt(0).toUpperCase() + fileName.slice(1)}`
  }

  private getLanguageFromExtension(fileName: string): string {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) return 'TypeScript'
    if (fileName.endsWith('.jsx') || fileName.endsWith('.js')) return 'JavaScript'
    if (fileName.endsWith('.json')) return 'JSON'
    if (fileName.endsWith('.html')) return 'HTML'
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
    const exportNamedRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g
    const exportListRegex = /export\s+{\s*([^}]+)\s*}/g
    
    const exports: string[] = []
    let match

    while ((match = exportDefaultRegex.exec(content)) !== null) {
      exports.push(match[1])
    }

    while ((match = exportNamedRegex.exec(content)) !== null) {
      exports.push(match[1])
    }

    while ((match = exportListRegex.exec(content)) !== null) {
      const namedExports = match[1].split(',').map(exp => exp.trim())
      exports.push(...namedExports)
    }

    return exports
  }

  private getFileType(path: string): 'source' | 'config' | 'dependency' | 'documentation' | 'test' {
    if (path.includes('package.json') || path.includes('yarn.lock') || path.includes('package-lock.json')) {
      return 'dependency'
    }
    if (path.includes('config') || path.includes('.config.') || path.includes('webpack.')) {
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

  private async fetchPackageJson(files: FileAnalysis[]): Promise<any> {
    const packageFile = files.find(f => f.path === 'package.json')
    if (!packageFile) return null

    try {
      // This would need actual file content, simplified for demo
      return { dependencies: {}, devDependencies: {} }
    } catch (error) {
      return null
    }
  }

  private containsConsoleLog(file: FileAnalysis): boolean {
    // This would need to check actual file content
    // Simplified for demo
    return false
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