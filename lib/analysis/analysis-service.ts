import { Repository, FrameworkDetection, AnalysisResult, HealthScore } from '@/types'
import { StaticAnalysisEngine } from './static-engine'
import { kiroMCPService } from '@/lib/kiro-mcp'

export class AnalysisService {
  private engine: StaticAnalysisEngine
  private config: any

  constructor() {
    this.loadConfig()
  }

  private async loadConfig() {
    try {
      const configResponse = await fetch('/nehua-config.json')
      this.config = await configResponse.json()
      this.engine = new StaticAnalysisEngine(this.config)
    } catch (error) {
      console.error('Failed to load configuration:', error)
      throw new Error('Configuration not available')
    }
  }

  async analyzeRepository(
    repository: Repository,
    frameworks: FrameworkDetection[],
    accessToken: string
  ): Promise<AnalysisResult> {
    if (!this.engine) {
      await this.loadConfig()
    }

    const startTime = Date.now()
    let llmCalls = 0

    try {
      console.log(`Starting enhanced AI analysis of ${repository.full_name}`)

      // Perform static analysis first
      const staticResult = await this.engine.analyzeRepository(
        repository,
        frameworks,
        accessToken
      )

      console.log('Static analysis completed, starting AI enhancement...')

      // Enhance with AI analysis
      let enhancedNodes = staticResult.nodes
      let enhancedEdges = staticResult.edges
      let aiRisks = staticResult.risks
      let aiHealthScore: HealthScore
      let aiRecommendations: any[] = []

      try {
        // AI Architecture Analysis
        console.log('Running AI architecture analysis...')
        const architectureAnalysis = await kiroMCPService.analyzeArchitecture(
          repository,
          { 
            nodes: staticResult.nodes, 
            files: staticResult.files, 
            dependencies: staticResult.dependencies,
            framework: frameworks[0]?.framework
          },
          this.config
        )
        llmCalls++

        // Enhance nodes with AI insights
        enhancedNodes = this.enhanceNodesWithAI(staticResult.nodes, architectureAnalysis)

        // AI Risk Assessment  
        console.log('Running AI risk assessment...')
        const riskAssessment = await kiroMCPService.assessRisks(
          repository,
          staticResult.dependencies,
          staticResult,
          this.config
        )
        llmCalls++

        // Combine static and AI risks
        aiRisks = [...staticResult.risks, ...riskAssessment.risks.map(r => r.description)]

        // AI Health Score Calculation
        console.log('Calculating AI-powered health score...')
        const aiHealthScoreResult = await kiroMCPService.calculateHealthScore(
          repository,
          {
            nodes: enhancedNodes,
            files: staticResult.files,
            dependencies: staticResult.dependencies,
            risks: aiRisks
          },
          this.config
        )
        llmCalls++

        aiHealthScore = {
          overall: aiHealthScoreResult.overall_score,
          categories: aiHealthScoreResult.category_scores,
          reasoning: aiHealthScoreResult.reasoning
        }

        // AI Recommendations
        console.log('Generating AI recommendations...')
        aiRecommendations = await kiroMCPService.generateRecommendations(
          repository,
          aiHealthScore,
          riskAssessment.risks,
          this.config
        )
        llmCalls++

      } catch (aiError) {
        console.warn('AI analysis failed, falling back to static analysis:', aiError)
        // Fallback to static analysis
        aiHealthScore = await this.calculateStaticHealthScore(staticResult, repository)
        aiRecommendations = await this.generateStaticRecommendations(staticResult, aiHealthScore)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      const result: AnalysisResult = {
        repository,
        frameworks,
        nodes: enhancedNodes,
        edges: enhancedEdges,
        health_score: aiHealthScore,
        risks: aiRisks.map((risk, index) => ({
          id: `risk-${index}`,
          category: this.categorizeRisk(risk),
          severity: this.assessRiskSeverity(risk),
          title: this.extractRiskTitle(risk),
          description: risk,
          affected_files: [],
          recommendation: this.generateRiskRecommendation(risk)
        })),
        recommendations: aiRecommendations,
        metadata: {
          analyzed_at: new Date().toISOString(),
          analysis_duration: duration,
          files_analyzed: staticResult.files.length,
          llm_calls: llmCalls
        }
      }

      console.log(`Enhanced AI analysis completed in ${duration}ms with ${llmCalls} LLM calls`)
      return result

    } catch (error) {
      console.error('Analysis failed:', error)
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private enhanceNodesWithAI(staticNodes: any[], architectureAnalysis: any): any[] {
    // Enhance node descriptions with AI insights
    return staticNodes.map(node => {
      const aiInsight = architectureAnalysis.components?.find((comp: string) => 
        comp.toLowerCase().includes(node.label.toLowerCase()) ||
        node.label.toLowerCase().includes(comp.toLowerCase())
      )

      if (aiInsight) {
        return {
          ...node,
          description: `${node.description}. AI Insight: ${aiInsight.substring(0, 100)}...`
        }
      }

      return node
    })
  }

  // Fallback methods for when AI analysis fails
  private async calculateStaticHealthScore(analysisResult: any, repository: Repository): Promise<HealthScore> {
    // Simple scoring based on static analysis
    const categories = this.config.health_score.categories

    const dependenciesScore = this.scoreDependencies(analysisResult.dependencies)
    const architectureScore = this.scoreArchitecture(analysisResult.nodes, analysisResult.edges)
    const codeQualityScore = this.scoreCodeQuality(analysisResult.files)
    const performanceScore = this.scorePerformance(analysisResult.dependencies, repository.size)

    const overall = Math.round(
      (dependenciesScore * categories.dependencies.weight +
       architectureScore * categories.architecture.weight +
       codeQualityScore * categories.code_quality.weight +
       performanceScore * categories.performance.weight) / 100
    )

    return {
      overall,
      categories: {
        dependencies: dependenciesScore,
        architecture: architectureScore,
        code_quality: codeQualityScore,
        performance: performanceScore
      },
      reasoning: {
        dependencies: this.generateDependenciesReasoning(dependenciesScore, analysisResult.dependencies),
        architecture: this.generateArchitectureReasoning(architectureScore, analysisResult.nodes),
        code_quality: this.generateCodeQualityReasoning(codeQualityScore, analysisResult.files),
        performance: this.generatePerformanceReasoning(performanceScore, repository.size)
      }
    }
  }

  private async generateStaticRecommendations(analysisResult: any, healthScore: HealthScore): Promise<any[]> {
    const recommendations: any[] = []

    // Architecture recommendations
    if (healthScore.categories.architecture < 70) {
      recommendations.push({
        id: 'arch-separation',
        category: 'architecture',
        priority: 'high',
        title: 'Improve Separation of Concerns',
        description: 'Consider breaking down large modules into smaller, more focused components.',
        implementation: 'Create separate modules for different business domains.',
        estimated_effort: 'medium'
      })
    }

    // Dependencies recommendations
    if (healthScore.categories.dependencies < 60) {
      recommendations.push({
        id: 'deps-security',
        category: 'dependencies',
        priority: 'high',
        title: 'Add Security Dependencies',
        description: 'Include security-focused libraries to protect against common vulnerabilities.',
        implementation: 'Add libraries like helmet, cors, or bcrypt depending on your framework.',
        estimated_effort: 'low'
      })
    }

    // Performance recommendations
    if (healthScore.categories.performance < 70) {
      recommendations.push({
        id: 'perf-optimization',
        category: 'performance',
        priority: 'medium',
        title: 'Optimize Bundle Size',
        description: 'Consider code splitting and tree shaking to reduce bundle size.',
        implementation: 'Use dynamic imports and remove unused dependencies.',
        estimated_effort: 'medium'
      })
    }

    return recommendations
  }
    
  private scoreDependencies(dependencies: string[]): number {
    if (!dependencies || dependencies.length === 0) return 50

    // Basic scoring - can be enhanced
    const hasSecurityLibraries = dependencies.some(dep => 
      ['helmet', 'cors', 'bcrypt', 'jsonwebtoken'].includes(dep)
    )
    
    const hasModernLibraries = dependencies.some(dep => 
      dep.includes('react@18') || dep.includes('fastapi') || dep.includes('django@4')
    )

    let score = 60
    if (hasSecurityLibraries) score += 20
    if (hasModernLibraries) score += 15
    if (dependencies.length > 50) score -= 10 // Too many dependencies

    return Math.max(0, Math.min(100, score))
  }

  private scoreArchitecture(nodes: any[], edges: any[]): number {
    if (!nodes || nodes.length === 0) return 30

    let score = 50

    // Good separation of concerns
    const hasMultipleNodeTypes = new Set(nodes.map(n => n.type)).size > 2
    if (hasMultipleNodeTypes) score += 20

    // Proper layering
    const hasFrontendBackend = nodes.some(n => n.type === 'frontend') && 
                              nodes.some(n => n.type === 'backend')
    if (hasFrontendBackend) score += 15

    // Database separation
    const hasDatabaseLayer = nodes.some(n => n.type === 'database')
    if (hasDatabaseLayer) score += 10

    // Not too complex
    if (nodes.length > 20) score -= 15

    return Math.max(0, Math.min(100, score))
  }

  private scoreCodeQuality(files: any[]): number {
    if (!files || files.length === 0) return 40

    let score = 60

    // File organization
    const avgFileSize = files.reduce((sum, f) => sum + f.size, 0) / files.length
    if (avgFileSize < 5000) score += 15 // Reasonable file sizes

    // Type safety
    const hasTypeScript = files.some(f => f.language === 'TypeScript')
    if (hasTypeScript) score += 20

    // Documentation
    const hasDocFiles = files.some(f => f.type === 'documentation')
    if (hasDocFiles) score += 10

    return Math.max(0, Math.min(100, score))
  }

  private scorePerformance(dependencies: string[], repoSize: number): number {
    let score = 70

    // Repository size
    if (repoSize > 100000) score -= 20 // Large repo
    if (repoSize < 10000) score += 10   // Reasonably sized

    // Performance libraries
    const hasPerformanceLibs = dependencies?.some(dep => 
      ['react-query', 'swr', 'redis', 'memcached'].includes(dep)
    )
    if (hasPerformanceLibs) score += 15

    return Math.max(0, Math.min(100, score))
  }

  private async generateRecommendations(analysisResult: any, healthScore: HealthScore): Promise<any[]> {
    const recommendations: any[] = []

    // Architecture recommendations
    if (healthScore.categories.architecture < 70) {
      recommendations.push({
        id: 'arch-separation',
        category: 'architecture',
        priority: 'high',
        title: 'Improve Separation of Concerns',
        description: 'Consider breaking down large modules into smaller, more focused components.',
        implementation: 'Create separate modules for different business domains.',
        estimated_effort: 'medium'
      })
    }

    // Dependencies recommendations
    if (healthScore.categories.dependencies < 60) {
      recommendations.push({
        id: 'deps-security',
        category: 'dependencies',
        priority: 'high',
        title: 'Add Security Dependencies',
        description: 'Include security-focused libraries to protect against common vulnerabilities.',
        implementation: 'Add libraries like helmet, cors, or bcrypt depending on your framework.',
        estimated_effort: 'low'
      })
    }

    // Performance recommendations
    if (healthScore.categories.performance < 70) {
      recommendations.push({
        id: 'perf-optimization',
        category: 'performance',
        priority: 'medium',
        title: 'Optimize Bundle Size',
        description: 'Consider code splitting and tree shaking to reduce bundle size.',
        implementation: 'Use dynamic imports and remove unused dependencies.',
        estimated_effort: 'medium'
      })
    }

    return recommendations
  }

  // Helper methods for risk categorization
  private categorizeRisk(risk: string): 'security' | 'performance' | 'maintainability' | 'scalability' | 'technical_debt' {
    const riskLower = risk.toLowerCase()
    
    if (riskLower.includes('security') || riskLower.includes('auth') || riskLower.includes('cors')) {
      return 'security'
    }
    if (riskLower.includes('performance') || riskLower.includes('bundle') || riskLower.includes('async')) {
      return 'performance'
    }
    if (riskLower.includes('update') || riskLower.includes('version') || riskLower.includes('outdated')) {
      return 'technical_debt'
    }
    if (riskLower.includes('scale') || riskLower.includes('size')) {
      return 'scalability'
    }
    
    return 'maintainability'
  }

  private assessRiskSeverity(risk: string): 'low' | 'medium' | 'high' | 'critical' {
    const riskLower = risk.toLowerCase()
    
    if (riskLower.includes('critical') || riskLower.includes('security')) {
      return 'high'
    }
    if (riskLower.includes('performance') || riskLower.includes('update')) {
      return 'medium'
    }
    
    return 'low'
  }

  private extractRiskTitle(risk: string): string {
    return risk.split(' - ')[0] || risk.substring(0, 50) + (risk.length > 50 ? '...' : '')
  }

  private generateRiskRecommendation(risk: string): string {
    const riskLower = risk.toLowerCase()
    
    if (riskLower.includes('security')) {
      return 'Review security best practices and add appropriate security middleware'
    }
    if (riskLower.includes('update') || riskLower.includes('version')) {
      return 'Update to the latest stable version and review breaking changes'
    }
    if (riskLower.includes('performance')) {
      return 'Profile the application and implement performance optimizations'
    }
    
    return 'Review the issue and implement appropriate fixes'
  }

  // Reasoning generation methods
  private generateDependenciesReasoning(score: number, dependencies: string[]): string {
    if (score >= 80) return `Excellent dependency management with ${dependencies?.length || 0} well-chosen libraries`
    if (score >= 60) return `Good dependency selection with room for security improvements`
    return `Dependencies need attention - consider security updates and cleanup`
  }

  private generateArchitectureReasoning(score: number, nodes: any[]): string {
    if (score >= 80) return `Well-structured architecture with proper separation of concerns`
    if (score >= 60) return `Decent architecture with ${nodes?.length || 0} components identified`
    return `Architecture needs improvement - consider better modularization`
  }

  private generateCodeQualityReasoning(score: number, files: any[]): string {
    if (score >= 80) return `High code quality with good organization and documentation`
    if (score >= 60) return `Acceptable code quality across ${files?.length || 0} files analyzed`
    return `Code quality needs improvement - focus on documentation and organization`
  }

  private generatePerformanceReasoning(score: number, repoSize: number): string {
    if (score >= 80) return `Good performance characteristics with reasonable size`
    if (score >= 60) return `Acceptable performance with some optimization opportunities`
    return `Performance needs attention - repository size: ${(repoSize / 1024).toFixed(1)}KB`
  }
}

// Export singleton instance
export const analysisService = new AnalysisService()