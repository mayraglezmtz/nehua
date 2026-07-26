import { kiroMCPService } from './kiro-mcp'
import { ArchitectureNode } from '@/types'

export interface ComponentExplanation {
  explanation: string
  purpose: string
  relationships: string[]
  technical_details: string
  key_responsibilities: string[]
  integration_points: string[]
}

export class ComponentExplanationService {
  private config: any

  constructor() {
    this.loadConfig()
  }

  private async loadConfig() {
    try {
      const configResponse = await fetch('/nehua-config.json')
      this.config = await configResponse.json()
    } catch (error) {
      console.error('Failed to load config for component explanation:', error)
    }
  }

  async explainComponent(
    node: ArchitectureNode,
    contextInfo: {
      repository: any
      framework: string
      allNodes: ArchitectureNode[]
      edges: any[]
    }
  ): Promise<ComponentExplanation> {
    if (!this.config) {
      await this.loadConfig()
    }

    try {
      console.log(`Explaining component: ${node.label}`)

      // Get related nodes for better context
      const relatedNodes = this.findRelatedNodes(node, contextInfo.allNodes, contextInfo.edges)
      
      const enhancedComponentInfo = {
        ...node,
        related_components: relatedNodes.map(n => ({ label: n.label, type: n.type }))
      }

      const aiExplanation = await kiroMCPService.explainComponent(
        enhancedComponentInfo,
        contextInfo,
        this.config
      )

      // Enhance with static analysis insights
      const enhancedExplanation: ComponentExplanation = {
        explanation: aiExplanation.explanation,
        purpose: aiExplanation.purpose,
        relationships: aiExplanation.relationships,
        technical_details: aiExplanation.technical_details,
        key_responsibilities: this.extractKeyResponsibilities(node, aiExplanation),
        integration_points: this.extractIntegrationPoints(node, contextInfo.edges)
      }

      return enhancedExplanation

    } catch (error) {
      console.error('Component explanation failed:', error)
      
      // Fallback to static explanation
      return this.generateStaticExplanation(node, contextInfo)
    }
  }

  private findRelatedNodes(
    node: ArchitectureNode, 
    allNodes: ArchitectureNode[], 
    edges: any[]
  ): ArchitectureNode[] {
    const relatedNodeIds = new Set<string>()

    // Find nodes connected via edges
    edges.forEach(edge => {
      if (edge.source === node.id) {
        relatedNodeIds.add(edge.target)
      }
      if (edge.target === node.id) {
        relatedNodeIds.add(edge.source)
      }
    })

    return allNodes.filter(n => relatedNodeIds.has(n.id))
  }

  private extractKeyResponsibilities(node: ArchitectureNode, aiExplanation: any): string[] {
    const responsibilities: string[] = []

    // Extract from AI explanation
    const explanationText = aiExplanation.explanation + ' ' + aiExplanation.technical_details
    
    // Look for responsibility keywords
    const responsibilityPatterns = [
      /responsible for ([^.]+)/gi,
      /handles ([^.]+)/gi,
      /manages ([^.]+)/gi,
      /provides ([^.]+)/gi,
      /implements ([^.]+)/gi
    ]

    responsibilityPatterns.forEach(pattern => {
      const matches = explanationText.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const responsibility = match.replace(/responsible for |handles |manages |provides |implements /gi, '').trim()
          if (responsibility.length > 5 && responsibility.length < 100) {
            responsibilities.push(responsibility)
          }
        })
      }
    })

    // Add static analysis based responsibilities
    if (node.type === 'frontend') {
      responsibilities.push('User interface rendering', 'User interaction handling')
    } else if (node.type === 'backend') {
      responsibilities.push('Business logic processing', 'Data validation')
    } else if (node.type === 'database') {
      responsibilities.push('Data persistence', 'Query processing')
    }

    // Remove duplicates and limit to top 5
    return [...new Set(responsibilities)].slice(0, 5)
  }

  private extractIntegrationPoints(node: ArchitectureNode, edges: any[]): string[] {
    const integrationPoints: string[] = []

    // Find all connections
    edges.forEach(edge => {
      if (edge.source === node.id) {
        integrationPoints.push(`Sends ${edge.type} to ${edge.target}`)
      }
      if (edge.target === node.id) {
        integrationPoints.push(`Receives ${edge.type} from ${edge.source}`)
      }
    })

    // Add file-based integration points
    if (node.data.files && node.data.files.length > 0) {
      integrationPoints.push(`File-based integration via ${node.data.files.length} files`)
    }

    if (node.data.dependencies && node.data.dependencies.length > 0) {
      integrationPoints.push(`External dependencies: ${node.data.dependencies.slice(0, 3).join(', ')}`)
    }

    return integrationPoints.slice(0, 6)
  }

  private generateStaticExplanation(
    node: ArchitectureNode, 
    contextInfo: any
  ): ComponentExplanation {
    const typeDescriptions: Record<string, string> = {
      frontend: 'This is a frontend component responsible for user interface and user experience.',
      backend: 'This is a backend component that handles server-side logic and data processing.',
      database: 'This is a database component responsible for data storage and retrieval.',
      cache: 'This is a caching component that improves application performance.',
      queue: 'This is a message queue component for asynchronous task processing.',
      storage: 'This is a storage component for file and asset management.',
      authentication: 'This is an authentication component for user identity and access management.',
      external_api: 'This is an external API integration point for third-party services.',
      monitoring: 'This is a monitoring component for observability and health tracking.',
    }

    const baseExplanation = typeDescriptions[node.type] || 'This is a system component.'
    
    return {
      explanation: `${baseExplanation} ${node.description}`,
      purpose: `The primary purpose of ${node.label} is to ${node.description.toLowerCase()}`,
      relationships: contextInfo.edges
        ?.filter((e: any) => e.source === node.id || e.target === node.id)
        ?.map((e: any) => `${e.type} with other components`)
        ?.slice(0, 3) || [],
      technical_details: `This component includes ${node.data.files?.length || 0} files and ${node.data.dependencies?.length || 0} dependencies.`,
      key_responsibilities: this.extractKeyResponsibilities(node, { 
        explanation: baseExplanation, 
        technical_details: node.description 
      }),
      integration_points: this.extractIntegrationPoints(node, contextInfo.edges || [])
    }
  }
}

// Export singleton instance
export const componentExplanationService = new ComponentExplanationService()