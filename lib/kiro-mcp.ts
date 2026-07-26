export interface KiroMCPRequest {
  prompt: string
  context?: any
  temperature?: number
  max_tokens?: number
}

export interface KiroMCPResponse {
  success: boolean
  data?: {
    response: string
    usage?: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
  }
  error?: string
}

export class KiroMCPService {
  private baseUrl: string
  private apiKey?: string

  constructor() {
    this.baseUrl = process.env.KIRO_API_ENDPOINT || 'http://localhost:8000'
    this.apiKey = process.env.KIRO_API_KEY
  }

  async makeRequest(request: KiroMCPRequest): Promise<KiroMCPResponse> {
    try {
      console.log('Making Kiro MCP request:', { 
        prompt: request.prompt.substring(0, 100) + '...',
        temperature: request.temperature,
        max_tokens: request.max_tokens
      })

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`
      }

      const response = await fetch(`${this.baseUrl}/api/gemini/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: request.prompt,
          context: request.context,
          temperature: request.temperature || 0.3,
          max_tokens: request.max_tokens || 4096,
          model: 'gemini-pro'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Kiro MCP API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      console.log('Kiro MCP response received:', {
        success: true,
        usage: data.usage
      })

      return {
        success: true,
        data: {
          response: data.response || data.text || data.content,
          usage: data.usage
        }
      }

    } catch (error) {
      console.error('Kiro MCP request failed:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async analyzeArchitecture(
    repositoryInfo: any,
    staticAnalysis: any,
    config: any
  ): Promise<{
    components: string[]
    relationships: string[]
    patterns: string[]
    insights: string[]
  }> {
    const prompt = this.buildArchitectureAnalysisPrompt(repositoryInfo, staticAnalysis, config)
    
    const response = await this.makeRequest({
      prompt,
      temperature: 0.3,
      max_tokens: 3000
    })

    if (!response.success || !response.data) {
      throw new Error(`Architecture analysis failed: ${response.error}`)
    }

    return this.parseArchitectureResponse(response.data.response)
  }

  async assessRisks(
    repositoryInfo: any,
    dependencies: string[],
    staticAnalysis: any,
    config: any
  ): Promise<{
    risks: Array<{
      category: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      title: string
      description: string
      recommendation: string
    }>
    overall_assessment: string
  }> {
    const prompt = this.buildRiskAssessmentPrompt(repositoryInfo, dependencies, staticAnalysis, config)
    
    const response = await this.makeRequest({
      prompt,
      temperature: 0.2,
      max_tokens: 2500
    })

    if (!response.success || !response.data) {
      throw new Error(`Risk assessment failed: ${response.error}`)
    }

    return this.parseRiskResponse(response.data.response)
  }

  async calculateHealthScore(
    repositoryInfo: any,
    staticAnalysis: any,
    config: any
  ): Promise<{
    overall_score: number
    category_scores: {
      dependencies: number
      architecture: number
      code_quality: number
      performance: number
    }
    reasoning: {
      dependencies: string
      architecture: string
      code_quality: string
      performance: string
      overall: string
    }
  }> {
    const prompt = this.buildHealthScorePrompt(repositoryInfo, staticAnalysis, config)
    
    const response = await this.makeRequest({
      prompt,
      temperature: 0.1,
      max_tokens: 2000
    })

    if (!response.success || !response.data) {
      throw new Error(`Health score calculation failed: ${response.error}`)
    }

    return this.parseHealthScoreResponse(response.data.response)
  }

  async generateRecommendations(
    repositoryInfo: any,
    healthScore: any,
    risks: any[],
    config: any
  ): Promise<Array<{
    category: string
    priority: 'low' | 'medium' | 'high'
    title: string
    description: string
    implementation: string
    estimated_effort: 'low' | 'medium' | 'high'
  }>> {
    const prompt = this.buildRecommendationsPrompt(repositoryInfo, healthScore, risks, config)
    
    const response = await this.makeRequest({
      prompt,
      temperature: 0.4,
      max_tokens: 3000
    })

    if (!response.success || !response.data) {
      throw new Error(`Recommendations generation failed: ${response.error}`)
    }

    return this.parseRecommendationsResponse(response.data.response)
  }

  async explainComponent(
    componentInfo: any,
    contextInfo: any,
    config: any
  ): Promise<{
    explanation: string
    purpose: string
    relationships: string[]
    technical_details: string
  }> {
    const prompt = this.buildComponentExplanationPrompt(componentInfo, contextInfo, config)
    
    const response = await this.makeRequest({
      prompt,
      temperature: 0.3,
      max_tokens: 1500
    })

    if (!response.success || !response.data) {
      throw new Error(`Component explanation failed: ${response.error}`)
    }

    return this.parseComponentResponse(response.data.response)
  }

  // Prompt building methods
  private buildArchitectureAnalysisPrompt(
    repositoryInfo: any,
    staticAnalysis: any,
    config: any
  ): string {
    return `${config.llm.prompts.architecture_analysis}

Repository: ${repositoryInfo.full_name}
Description: ${repositoryInfo.description || 'No description provided'}
Primary Language: ${repositoryInfo.language}
Size: ${repositoryInfo.size} KB

Detected Components:
${staticAnalysis.nodes?.map((node: any) => `- ${node.label}: ${node.description}`).join('\n') || 'None detected'}

Dependencies:
${staticAnalysis.dependencies?.slice(0, 20).join(', ') || 'None found'}

Files Analyzed: ${staticAnalysis.files?.length || 0}

Please provide a detailed architecture analysis focusing on:
1. Main architectural components and their purposes
2. How components interact with each other
3. Architectural patterns identified (MVC, microservices, etc.)
4. Data flow and communication patterns

Format your response as JSON with these keys: components, relationships, patterns, insights`
  }

  private buildRiskAssessmentPrompt(
    repositoryInfo: any,
    dependencies: string[],
    staticAnalysis: any,
    config: any
  ): string {
    return `${config.llm.prompts.risk_assessment}

Repository: ${repositoryInfo.full_name}
Framework: ${staticAnalysis.framework || 'Unknown'}
Dependencies (${dependencies.length}): ${dependencies.slice(0, 15).join(', ')}
Repository Size: ${repositoryInfo.size} KB
Last Updated: ${repositoryInfo.updated_at}

Static Analysis Results:
- Components: ${staticAnalysis.nodes?.length || 0}
- Files Analyzed: ${staticAnalysis.files?.length || 0}
- Basic Risks Found: ${staticAnalysis.risks?.length || 0}

Please assess the following risk categories:
1. Security vulnerabilities and exposures
2. Performance bottlenecks and scalability issues
3. Maintainability and technical debt
4. Dependency management and outdated packages
5. Architectural risks and anti-patterns

Format your response as JSON with: risks (array), overall_assessment (string)
Each risk should have: category, severity, title, description, recommendation`
  }

  private buildHealthScorePrompt(
    repositoryInfo: any,
    staticAnalysis: any,
    config: any
  ): string {
    return `${config.llm.prompts.health_score_reasoning}

Repository Analysis for: ${repositoryInfo.full_name}

Dependencies: ${staticAnalysis.dependencies?.length || 0} packages
Architecture Components: ${staticAnalysis.nodes?.length || 0}
Files: ${staticAnalysis.files?.length || 0}
Repository Size: ${repositoryInfo.size} KB
Age: Created ${repositoryInfo.created_at}

Evaluation Criteria (each category 0-100):
1. Dependencies (25%): Package freshness, security, management
2. Architecture (25%): Separation of concerns, modularity, patterns
3. Code Quality (25%): Organization, documentation, maintainability  
4. Performance (25%): Bundle size, optimization, async patterns

Provide scores and detailed reasoning for each category plus overall assessment.

Format as JSON: overall_score, category_scores {dependencies, architecture, code_quality, performance}, reasoning {dependencies, architecture, code_quality, performance, overall}`
  }

  private buildRecommendationsPrompt(
    repositoryInfo: any,
    healthScore: any,
    risks: any[],
    config: any
  ): string {
    return `Based on the analysis of ${repositoryInfo.full_name}:

Health Score: ${healthScore.overall_score}/100
- Dependencies: ${healthScore.category_scores?.dependencies}/100
- Architecture: ${healthScore.category_scores?.architecture}/100  
- Code Quality: ${healthScore.category_scores?.code_quality}/100
- Performance: ${healthScore.category_scores?.performance}/100

Key Risks Identified: ${risks.length}
${risks.slice(0, 5).map((risk: any) => `- ${risk.title} (${risk.severity})`).join('\n')}

Generate actionable recommendations to improve this codebase. Focus on:
1. Quick wins that provide immediate value
2. Medium-term improvements for sustainability
3. Long-term architectural enhancements

Format as JSON array with: category, priority, title, description, implementation, estimated_effort`
  }

  private buildComponentExplanationPrompt(
    componentInfo: any,
    contextInfo: any,
    config: any
  ): string {
    return `${config.llm.prompts.component_explanation}

Component: ${componentInfo.label}
Type: ${componentInfo.type}
Files: ${componentInfo.data?.files?.join(', ') || 'None'}
Dependencies: ${componentInfo.data?.dependencies?.join(', ') || 'None'}

Repository Context: ${contextInfo.repository?.full_name}
Framework: ${contextInfo.framework}

Please explain this component in basic-to-intermediate detail:
1. What this component does and its primary purpose
2. How it fits into the overall application architecture
3. Key responsibilities and functionality
4. Relationships with other components

Format as JSON: explanation, purpose, relationships (array), technical_details`
  }

  // Response parsing methods
  private parseArchitectureResponse(response: string): any {
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/{[\s\S]*}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      
      // Fallback parsing if no JSON found
      return {
        components: [],
        relationships: [],
        patterns: [],
        insights: [response.substring(0, 500)]
      };
    } catch (error) {
      console.error('Failed to parse architecture response:', error);
      return {
        components: [],
        relationships: [],
        patterns: [],
        insights: ['Analysis completed but response format was unexpected']
      };
    }
  }

  private parseRiskResponse(response: string): any {
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/{[\s\S]*}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      
      return {
        risks: [],
        overall_assessment: response.substring(0, 300)
      };
    } catch (error) {
      return {
        risks: [],
        overall_assessment: 'Risk assessment completed but could not parse detailed results'
      };
    }
  }

  private parseHealthScoreResponse(response: string): any {
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/{[\s\S]*}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      
      return {
        overall_score: 70,
        category_scores: {
          dependencies: 70,
          architecture: 70,
          code_quality: 70,
          performance: 70
        },
        reasoning: {
          dependencies: 'Analysis completed',
          architecture: 'Analysis completed',
          code_quality: 'Analysis completed', 
          performance: 'Analysis completed',
          overall: response.substring(0, 200)
        }
      };
    } catch (error) {
      return {
        overall_score: 70,
        category_scores: { dependencies: 70, architecture: 70, code_quality: 70, performance: 70 },
        reasoning: { dependencies: 'Error parsing', architecture: 'Error parsing', code_quality: 'Error parsing', performance: 'Error parsing', overall: 'Error parsing response' }
      };
    }
  }

  private parseRecommendationsResponse(response: string): any[] {
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      
      return [];
    } catch (error) {
      return [];
    }
  }

  private parseComponentResponse(response: string): any {
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/{[\s\S]*}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      
      return {
        explanation: response.substring(0, 400),
        purpose: 'Component analysis completed',
        relationships: [],
        technical_details: 'See explanation for details'
      };
    } catch (error) {
      return {
        explanation: 'Component analysis completed but could not parse response',
        purpose: 'Analysis completed',
        relationships: [],
        technical_details: 'Response parsing failed'
      };
    }
  }
}

// Export singleton instance
export const kiroMCPService = new KiroMCPService()