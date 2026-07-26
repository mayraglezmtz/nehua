import { AnalysisResult } from '@/types'

export interface ArchitectureReport {
  metadata: {
    title: string
    generatedAt: string
    repository: string
    analysisVersion: string
    duration: number
  }
  executiveSummary: {
    overallHealth: number
    keyFindings: string[]
    criticalIssues: string[]
    recommendations: string[]
  }
  architectureOverview: {
    framework: string
    componentsCount: number
    connectionsCount: number
    layerAnalysis: string
    patterns: string[]
  }
  healthAnalysis: {
    overall: number
    categories: {
      dependencies: { score: number; reasoning: string; issues: string[] }
      architecture: { score: number; reasoning: string; issues: string[] }
      codeQuality: { score: number; reasoning: string; issues: string[] }
      performance: { score: number; reasoning: string; issues: string[] }
    }
  }
  riskAssessment: {
    summary: string
    risksByCategory: {
      security: Array<{ title: string; description: string; severity: string; recommendation: string }>
      performance: Array<{ title: string; description: string; severity: string; recommendation: string }>
      maintainability: Array<{ title: string; description: string; severity: string; recommendation: string }>
      scalability: Array<{ title: string; description: string; severity: string; recommendation: string }>
    }
    riskMatrix: { high: number; medium: number; low: number }
  }
  componentAnalysis: {
    frontend: string[]
    backend: string[]
    data: string[]
    external: string[]
    infrastructure: string[]
  }
  recommendations: {
    immediate: Array<{ title: string; description: string; effort: string; impact: string }>
    shortTerm: Array<{ title: string; description: string; effort: string; impact: string }>
    longTerm: Array<{ title: string; description: string; effort: string; impact: string }>
  }
  technicalDetails: {
    filesAnalyzed: number
    linesOfCode: number
    dependencies: string[]
    technologies: string[]
    dataFlows: Array<{ source: string; target: string; type: string }>
  }
  actionPlan: {
    phase1: Array<{ task: string; timeline: string; owner: string }>
    phase2: Array<{ task: string; timeline: string; owner: string }>
    phase3: Array<{ task: string; timeline: string; owner: string }>
  }
}

export class ReportGenerator {
  private config: any

  constructor() {
    this.loadConfig()
  }

  private async loadConfig() {
    try {
      const configResponse = await fetch('/nehua-config.json')
      this.config = await configResponse.json()
    } catch (error) {
      console.error('Failed to load config for report generation:', error)
    }
  }

  async generateReport(analysisResult: AnalysisResult): Promise<ArchitectureReport> {
    if (!this.config) {
      await this.loadConfig()
    }

    console.log('Generating comprehensive architecture report...')

    const report: ArchitectureReport = {
      metadata: this.generateMetadata(analysisResult),
      executiveSummary: this.generateExecutiveSummary(analysisResult),
      architectureOverview: this.generateArchitectureOverview(analysisResult),
      healthAnalysis: this.generateHealthAnalysis(analysisResult),
      riskAssessment: this.generateRiskAssessment(analysisResult),
      componentAnalysis: this.generateComponentAnalysis(analysisResult),
      recommendations: this.generateRecommendations(analysisResult),
      technicalDetails: this.generateTechnicalDetails(analysisResult),
      actionPlan: this.generateActionPlan(analysisResult)
    }

    console.log('Architecture report generated successfully')
    return report
  }

  private generateMetadata(analysisResult: AnalysisResult) {
    return {
      title: `Architecture Analysis Report - ${analysisResult.repository.name}`,
      generatedAt: new Date().toISOString(),
      repository: analysisResult.repository.full_name,
      analysisVersion: '1.0.0',
      duration: analysisResult.metadata.analysis_duration
    }
  }

  private generateExecutiveSummary(analysisResult: AnalysisResult) {
    const healthScore = analysisResult.health_score.overall
    const criticalRisks = analysisResult.risks.filter(r => r.severity === 'high' || r.severity === 'critical')
    const highPriorityRecs = analysisResult.recommendations.filter(r => r.priority === 'high')

    const keyFindings = [
      `Overall health score: ${healthScore}/100`,
      `${analysisResult.nodes.length} architectural components identified`,
      `${analysisResult.edges.length} component relationships mapped`,
      `${analysisResult.risks.length} potential risks detected`,
      `${analysisResult.recommendations.length} improvement recommendations generated`
    ]

    const criticalIssues = criticalRisks.length > 0 
      ? criticalRisks.slice(0, 3).map(r => r.title)
      : ['No critical issues identified']

    const recommendations = highPriorityRecs.length > 0
      ? highPriorityRecs.slice(0, 3).map(r => r.title)
      : ['Continue monitoring and maintaining current architecture']

    return {
      overallHealth: healthScore,
      keyFindings,
      criticalIssues,
      recommendations
    }
  }

  private generateArchitectureOverview(analysisResult: AnalysisResult) {
    const framework = analysisResult.frameworks[0]?.framework || 'Unknown'
    const nodeTypes = [...new Set(analysisResult.nodes.map(n => n.type))]
    
    let layerAnalysis = 'Standard layered architecture'
    if (nodeTypes.includes('frontend') && nodeTypes.includes('backend')) {
      layerAnalysis = 'Client-server architecture with separated frontend and backend layers'
    }
    if (nodeTypes.includes('database')) {
      layerAnalysis += ', with dedicated data persistence layer'
    }

    const patterns = []
    if (nodeTypes.includes('cache')) patterns.push('Caching pattern')
    if (nodeTypes.includes('queue')) patterns.push('Message queue pattern')
    if (nodeTypes.includes('external_api')) patterns.push('External service integration')
    if (nodeTypes.includes('monitoring')) patterns.push('Observability pattern')

    return {
      framework,
      componentsCount: analysisResult.nodes.length,
      connectionsCount: analysisResult.edges.length,
      layerAnalysis,
      patterns: patterns.length > 0 ? patterns : ['Basic component structure']
    }
  }

  private generateHealthAnalysis(analysisResult: AnalysisResult) {
    const { categories, reasoning } = analysisResult.health_score

    return {
      overall: analysisResult.health_score.overall,
      categories: {
        dependencies: {
          score: categories.dependencies,
          reasoning: reasoning.dependencies,
          issues: this.extractIssuesFromReasoning(reasoning.dependencies)
        },
        architecture: {
          score: categories.architecture,
          reasoning: reasoning.architecture,
          issues: this.extractIssuesFromReasoning(reasoning.architecture)
        },
        codeQuality: {
          score: categories.code_quality,
          reasoning: reasoning.code_quality,
          issues: this.extractIssuesFromReasoning(reasoning.code_quality)
        },
        performance: {
          score: categories.performance,
          reasoning: reasoning.performance,
          issues: this.extractIssuesFromReasoning(reasoning.performance)
        }
      }
    }
  }

  private generateRiskAssessment(analysisResult: AnalysisResult) {
    const risksByCategory = {
      security: analysisResult.risks.filter(r => r.category === 'security'),
      performance: analysisResult.risks.filter(r => r.category === 'performance'),
      maintainability: analysisResult.risks.filter(r => r.category === 'maintainability'),
      scalability: analysisResult.risks.filter(r => r.category === 'scalability')
    }

    const riskMatrix = {
      high: analysisResult.risks.filter(r => r.severity === 'high' || r.severity === 'critical').length,
      medium: analysisResult.risks.filter(r => r.severity === 'medium').length,
      low: analysisResult.risks.filter(r => r.severity === 'low').length
    }

    let summary = `${analysisResult.risks.length} risks identified across multiple categories.`
    if (riskMatrix.high > 0) {
      summary += ` ${riskMatrix.high} high-priority risks require immediate attention.`
    }

    return {
      summary,
      risksByCategory,
      riskMatrix
    }
  }

  private generateComponentAnalysis(analysisResult: AnalysisResult) {
    const componentsByType = {
      frontend: analysisResult.nodes.filter(n => n.type === 'frontend').map(n => n.label),
      backend: analysisResult.nodes.filter(n => n.type === 'backend').map(n => n.label),
      data: analysisResult.nodes.filter(n => 
        ['database', 'cache', 'storage'].includes(n.type)
      ).map(n => n.label),
      external: analysisResult.nodes.filter(n => 
        ['external_api', 'cloud_service', 'ai_service'].includes(n.type)
      ).map(n => n.label),
      infrastructure: analysisResult.nodes.filter(n => 
        ['infrastructure', 'monitoring', 'authentication'].includes(n.type)
      ).map(n => n.label)
    }

    return componentsByType
  }

  private generateRecommendations(analysisResult: AnalysisResult) {
    const recommendations = {
      immediate: analysisResult.recommendations
        .filter(r => r.priority === 'high')
        .map(r => ({
          title: r.title,
          description: r.description,
          effort: r.estimated_effort,
          impact: 'High'
        })),
      shortTerm: analysisResult.recommendations
        .filter(r => r.priority === 'medium')
        .map(r => ({
          title: r.title,
          description: r.description,
          effort: r.estimated_effort,
          impact: 'Medium'
        })),
      longTerm: analysisResult.recommendations
        .filter(r => r.priority === 'low')
        .map(r => ({
          title: r.title,
          description: r.description,
          effort: r.estimated_effort,
          impact: 'Low'
        }))
    }

    return recommendations
  }

  private generateTechnicalDetails(analysisResult: AnalysisResult) {
    const dependencies = analysisResult.nodes
      .flatMap(n => n.data.dependencies || [])
      .filter((dep, index, arr) => arr.indexOf(dep) === index)

    const technologies = [
      ...analysisResult.frameworks.map(f => f.framework),
      ...dependencies.slice(0, 10)
    ]

    const dataFlows = analysisResult.edges.map(e => ({
      source: analysisResult.nodes.find(n => n.id === e.source)?.label || e.source,
      target: analysisResult.nodes.find(n => n.id === e.target)?.label || e.target,
      type: e.type
    }))

    return {
      filesAnalyzed: analysisResult.metadata.files_analyzed,
      linesOfCode: analysisResult.nodes.reduce((sum, n) => 
        sum + (n.data.files?.length || 0) * 100, 0
      ), // Rough estimate
      dependencies,
      technologies,
      dataFlows
    }
  }

  private generateActionPlan(analysisResult: AnalysisResult) {
    const highPriorityRisks = analysisResult.risks.filter(r => r.severity === 'high' || r.severity === 'critical')
    const mediumPriorityRisks = analysisResult.risks.filter(r => r.severity === 'medium')
    const improvements = analysisResult.recommendations

    return {
      phase1: [
        ...highPriorityRisks.slice(0, 3).map(r => ({
          task: `Address ${r.title}`,
          timeline: '1-2 weeks',
          owner: 'Development Team'
        })),
        {
          task: 'Implement critical security fixes',
          timeline: '1 week',
          owner: 'Security Team'
        }
      ],
      phase2: [
        ...mediumPriorityRisks.slice(0, 3).map(r => ({
          task: `Resolve ${r.title}`,
          timeline: '2-4 weeks',
          owner: 'Development Team'
        })),
        {
          task: 'Optimize performance bottlenecks',
          timeline: '3-4 weeks',
          owner: 'Performance Team'
        }
      ],
      phase3: [
        ...improvements.slice(0, 3).map(r => ({
          task: r.title,
          timeline: '1-3 months',
          owner: 'Architecture Team'
        })),
        {
          task: 'Implement long-term architectural improvements',
          timeline: '2-6 months',
          owner: 'Architecture Team'
        }
      ]
    }
  }

  private extractIssuesFromReasoning(reasoning: string): string[] {
    // Simple extraction of issues from reasoning text
    const issues = []
    if (reasoning.toLowerCase().includes('outdated')) {
      issues.push('Outdated dependencies detected')
    }
    if (reasoning.toLowerCase().includes('security')) {
      issues.push('Security concerns identified')
    }
    if (reasoning.toLowerCase().includes('performance')) {
      issues.push('Performance optimization needed')
    }
    if (reasoning.toLowerCase().includes('documentation')) {
      issues.push('Documentation improvements needed')
    }
    
    return issues.length > 0 ? issues : ['No major issues identified']
  }

  // Export methods
  async exportToMarkdown(report: ArchitectureReport): Promise<string> {
    const markdown = `
# ${report.metadata.title}

**Generated:** ${new Date(report.metadata.generatedAt).toLocaleDateString()}  
**Repository:** ${report.metadata.repository}  
**Analysis Duration:** ${(report.metadata.duration / 1000).toFixed(2)}s

## Executive Summary

### Overall Health Score: ${report.executiveSummary.overallHealth}/100

### Key Findings
${report.executiveSummary.keyFindings.map(f => `- ${f}`).join('\n')}

### Critical Issues
${report.executiveSummary.criticalIssues.map(i => `- ${i}`).join('\n')}

### Top Recommendations
${report.executiveSummary.recommendations.map(r => `- ${r}`).join('\n')}

## Architecture Overview

**Framework:** ${report.architectureOverview.framework}  
**Components:** ${report.architectureOverview.componentsCount}  
**Connections:** ${report.architectureOverview.connectionsCount}

**Architecture Pattern:** ${report.architectureOverview.layerAnalysis}

**Identified Patterns:**
${report.architectureOverview.patterns.map(p => `- ${p}`).join('\n')}

## Health Analysis

### Dependencies (${report.healthAnalysis.categories.dependencies.score}/100)
${report.healthAnalysis.categories.dependencies.reasoning}

**Issues:**
${report.healthAnalysis.categories.dependencies.issues.map(i => `- ${i}`).join('\n')}

### Architecture (${report.healthAnalysis.categories.architecture.score}/100)
${report.healthAnalysis.categories.architecture.reasoning}

**Issues:**
${report.healthAnalysis.categories.architecture.issues.map(i => `- ${i}`).join('\n')}

### Code Quality (${report.healthAnalysis.categories.codeQuality.score}/100)
${report.healthAnalysis.categories.codeQuality.reasoning}

**Issues:**
${report.healthAnalysis.categories.codeQuality.issues.map(i => `- ${i}`).join('\n')}

### Performance (${report.healthAnalysis.categories.performance.score}/100)
${report.healthAnalysis.categories.performance.reasoning}

**Issues:**
${report.healthAnalysis.categories.performance.issues.map(i => `- ${i}`).join('\n')}

## Risk Assessment

${report.riskAssessment.summary}

**Risk Matrix:**
- High Priority: ${report.riskAssessment.riskMatrix.high}
- Medium Priority: ${report.riskAssessment.riskMatrix.medium}
- Low Priority: ${report.riskAssessment.riskMatrix.low}

### Security Risks
${report.riskAssessment.risksByCategory.security.map(r => `
**${r.title}** (${r.severity})
${r.description}
*Recommendation:* ${r.recommendation}
`).join('\n')}

## Component Analysis

### Frontend Components
${report.componentAnalysis.frontend.map(c => `- ${c}`).join('\n')}

### Backend Components
${report.componentAnalysis.backend.map(c => `- ${c}`).join('\n')}

### Data Components
${report.componentAnalysis.data.map(c => `- ${c}`).join('\n')}

## Recommendations

### Immediate Actions (High Priority)
${report.recommendations.immediate.map(r => `
**${r.title}**
${r.description}
*Effort:* ${r.effort} | *Impact:* ${r.impact}
`).join('\n')}

### Short-term Improvements (Medium Priority)
${report.recommendations.shortTerm.map(r => `
**${r.title}**
${r.description}
*Effort:* ${r.effort} | *Impact:* ${r.impact}
`).join('\n')}

## Action Plan

### Phase 1 (Immediate)
${report.actionPlan.phase1.map(a => `- **${a.task}** (${a.timeline}) - ${a.owner}`).join('\n')}

### Phase 2 (Short-term)
${report.actionPlan.phase2.map(a => `- **${a.task}** (${a.timeline}) - ${a.owner}`).join('\n')}

### Phase 3 (Long-term)
${report.actionPlan.phase3.map(a => `- **${a.task}** (${a.timeline}) - ${a.owner}`).join('\n')}

## Technical Details

**Files Analyzed:** ${report.technicalDetails.filesAnalyzed}  
**Estimated Lines of Code:** ${report.technicalDetails.linesOfCode.toLocaleString()}

**Key Technologies:**
${report.technicalDetails.technologies.map(t => `- ${t}`).join('\n')}

**Dependencies:**
${report.technicalDetails.dependencies.slice(0, 20).map(d => `- ${d}`).join('\n')}

---
*Report generated by Nehua Architecture Analysis System*
`
    return markdown.trim()
  }

  async exportToJSON(report: ArchitectureReport): Promise<string> {
    return JSON.stringify(report, null, 2)
  }

  async exportToPDF(report: ArchitectureReport): Promise<Blob> {
    // For now, return a simple text-based PDF content
    // In a real implementation, you would use a library like jsPDF or Puppeteer
    const content = await this.exportToMarkdown(report)
    const blob = new Blob([content], { type: 'application/pdf' })
    return blob
  }
}

// Export singleton instance
export const reportGenerator = new ReportGenerator()