export interface GeminiRequest {
  prompt: string
  temperature?: number
  max_tokens?: number
}

export interface GeminiResponse {
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

export class GeminiService {
  // Backup models tried, in order, if the configured model 429s (quota
  // varies per-account and per-model-generation on Google's side - the
  // gemini-2.0-* family being fully quota-exhausted on an otherwise-valid
  // key is exactly the failure this list exists to route around).
  private static readonly FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite']

  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  private apiKey?: string
  private model: string

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  }

  async makeRequest(request: GeminiRequest): Promise<GeminiResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'GEMINI_API_KEY is not configured'
      }
    }

    const modelsToTry = [this.model, ...GeminiService.FALLBACK_MODELS.filter(m => m !== this.model)]
    let lastError = 'Unknown error'

    for (const model of modelsToTry) {
      try {
        console.log('Making Gemini request:', {
          model,
          prompt: request.prompt.substring(0, 100) + '...',
          temperature: request.temperature,
          max_tokens: request.max_tokens
        })

        const response = await fetch(
          `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: request.prompt }] }],
              generationConfig: {
                temperature: request.temperature ?? 0.3,
                maxOutputTokens: request.max_tokens ?? 4096,
                // Every prompt in this service asks for a JSON response.
                // Forcing native JSON output mode (constrained decoding)
                // instead of parsing free-form/markdown-fenced text avoids
                // the "almost valid JSON" syntax errors that come with
                // asking the model to format its own JSON as prose.
                responseMimeType: 'application/json',
              }
            })
          }
        )

        if (response.status === 429) {
          // This model's quota is exhausted - try the next candidate
          // instead of failing the whole request.
          lastError = `Gemini API error: 429 - quota exceeded for model ${model}`
          console.warn(lastError)
          continue
        }

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts
          ?.map((part: any) => part.text || '')
          .join('') || ''

        if (!text) {
          throw new Error('Gemini returned an empty response')
        }

        const usageMetadata = data.usageMetadata

        console.log('Gemini response received:', {
          success: true,
          model,
          usage: usageMetadata
        })

        return {
          success: true,
          data: {
            response: text,
            usage: usageMetadata ? {
              prompt_tokens: usageMetadata.promptTokenCount,
              completion_tokens: usageMetadata.candidatesTokenCount,
              total_tokens: usageMetadata.totalTokenCount
            } : undefined
          }
        }

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Gemini request failed for model ${model}:`, error)
      }
    }

    return {
      success: false,
      error: lastError
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

}

// Export singleton instance
export const geminiService = new GeminiService()
