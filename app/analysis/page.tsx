'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AnalysisResult, ArchitectureNode as NodeType } from '@/types'
import { ArchitectureDiagram } from '@/components/architecture-diagram'
import { HealthScoreGauge } from '@/components/health-score-gauge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Download,
  Share,
  RefreshCw,
  Clock,
  Database,
  AlertTriangle,
  CheckCircle2,
  Github,
  Eye,
  EyeOff,
  Lightbulb,
  X,
  ExternalLink,
  FileText
} from 'lucide-react'

import { ReportViewer } from '@/components/report-viewer'
import { DemoAnalytics, DemoPerformanceMonitor } from '@/lib/demo-optimization'

export default function AnalysisResults() {
  const { data: session } = useSession()
  const router = useRouter()
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [componentExplanation, setComponentExplanation] = useState<any>(null)
  const [explainLoading, setExplainLoading] = useState(false)
  const [showReportViewer, setShowReportViewer] = useState(false)

  useEffect(() => {
    // Load analysis result from localStorage (in a real app, this would come from URL params or state management)
    const storedResult = localStorage.getItem('nehua-analysis-result')
    if (storedResult) {
      try {
        const result = JSON.parse(storedResult)
        setAnalysisResult(result)
        
        // Track analysis results page view
        DemoAnalytics.getInstance().track('page_view_analysis_results', {
          repositoryName: result.repository?.name,
          healthScore: result.health_score?.overall,
          componentsCount: result.nodes?.length,
          timestamp: Date.now()
        })
      } catch (error) {
        console.error('Failed to parse stored analysis result:', error)
        router.push('/repositories')
      }
    } else {
      router.push('/repositories')
    }
    setLoading(false)
  }, [router])

  const handleNodeSelect = (node: NodeType) => {
    setSelectedNode(node)
    setComponentExplanation(null) // Clear previous explanation
    
    // Track node selection
    DemoAnalytics.getInstance().track('node_selected', {
      nodeId: node.id,
      nodeType: node.type,
      nodeLabel: node.label
    })
  }

  const handleNodeExplain = async (node: NodeType) => {
    if (!analysisResult) return

    setExplainLoading(true)
    setComponentExplanation(null)

    // Track explanation request
    DemoAnalytics.getInstance().track('component_explanation_requested', {
      nodeId: node.id,
      nodeType: node.type,
      nodeLabel: node.label
    })

    try {
      DemoPerformanceMonitor.startTimer('component_explanation')
      
      const response = await fetch('/api/explain-component', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          node,
          contextInfo: {
            repository: analysisResult.repository,
            framework: analysisResult.frameworks[0]?.framework,
            allNodes: analysisResult.nodes,
            edges: analysisResult.edges
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        setComponentExplanation(result.data)
        setSelectedNode(node)
        
        DemoAnalytics.getInstance().track('component_explanation_success', {
          nodeId: node.id,
          explanationLength: result.data.explanation?.length || 0
        })
      } else {
        console.error('Component explanation failed:', result.error)
        DemoAnalytics.getInstance().track('component_explanation_error', {
          nodeId: node.id,
          error: result.error
        })
      }
    } catch (error) {
      console.error('Failed to explain component:', error)
      DemoAnalytics.getInstance().track('component_explanation_error', {
        nodeId: node.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      DemoPerformanceMonitor.endTimer('component_explanation')
      setExplainLoading(false)
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-nehua-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    )
  }

  if (!analysisResult) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Found</h2>
          <p className="text-gray-600 mb-4">Please select a repository to analyze first.</p>
          <Button onClick={() => router.push('/repositories')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Repositories
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-80 border-r border-gray-200 bg-white overflow-y-auto flex-shrink-0"
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Analysis Results
                  </h1>
                  <p className="text-sm text-gray-600">
                    {analysisResult.repository.name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/repositories')}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>

              {/* Repository Info */}
              <div className="glass-panel p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Github className="w-4 h-4 text-gray-600" />
                  <a
                    href={analysisResult.repository.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-nehua-primary hover:underline flex items-center interactive-hover"
                  >
                    {analysisResult.repository.full_name}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
                {analysisResult.repository.description && (
                  <p className="text-xs text-gray-600">
                    {analysisResult.repository.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Language: {analysisResult.repository.language}</span>
                  <span>Size: {(analysisResult.repository.size / 1024).toFixed(1)}MB</span>
                </div>
              </div>

              {/* Health Score */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Score</h3>
                <HealthScoreGauge 
                  healthScore={analysisResult.health_score}
                  size="sm"
                  showDetails={true}
                />
              </div>

              {/* Analysis Metadata */}
              <div className="glass-panel p-4 space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Analysis Details
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{formatDuration(analysisResult.metadata.analysis_duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Files analyzed:</span>
                    <span>{analysisResult.metadata.files_analyzed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI calls:</span>
                    <span>{analysisResult.metadata.llm_calls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Components:</span>
                    <span>{analysisResult.nodes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connections:</span>
                    <span>{analysisResult.edges.length}</span>
                  </div>
                </div>
              </div>

              {/* Risks Summary */}
              {analysisResult.risks.length > 0 && (
                <div className="glass-panel p-4">
                  <h4 className="font-medium text-gray-900 flex items-center mb-3">
                    <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                    Risks Identified ({analysisResult.risks.length})
                  </h4>
                  <div className="space-y-2">
                    {analysisResult.risks.slice(0, 3).map((risk, index) => (
                      <div key={risk.id} className="text-sm">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            risk.severity === 'high' ? 'bg-red-500' :
                            risk.severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`} />
                          <span className="font-medium text-gray-900">{risk.title}</span>
                        </div>
                        <p className="text-xs text-gray-600 ml-4 mt-1">
                          {risk.description.substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                    {analysisResult.risks.length > 3 && (
                      <p className="text-xs text-gray-500 mt-2">
                        +{analysisResult.risks.length - 3} more risks
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysisResult.recommendations.length > 0 && (
                <div className="glass-panel p-4">
                  <h4 className="font-medium text-gray-900 flex items-center mb-3">
                    <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                    Recommendations ({analysisResult.recommendations.length})
                  </h4>
                  <div className="space-y-2">
                    {analysisResult.recommendations.slice(0, 2).map((rec, index) => (
                      <div key={rec.id} className="text-sm">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            rec.priority === 'high' ? 'bg-red-500' :
                            rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <span className="font-medium text-gray-900">{rec.title}</span>
                        </div>
                        <p className="text-xs text-gray-600 ml-4 mt-1">
                          {rec.description.substring(0, 80)}...
                        </p>
                      </div>
                    ))}
                    {analysisResult.recommendations.length > 2 && (
                      <p className="text-xs text-gray-500 mt-2">
                        +{analysisResult.recommendations.length - 2} more recommendations
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Report Preview */}
              <div className="glass-panel p-4">
                <h4 className="font-medium text-gray-900 flex items-center mb-3">
                  <FileText className="w-4 h-4 mr-2 text-nehua-primary" />
                  Architecture Report
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Health Score:</span>
                    <span className="font-medium">{analysisResult.health_score.overall}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Components:</span>
                    <span className="font-medium">{analysisResult.nodes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risks:</span>
                    <span className="font-medium">{analysisResult.risks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recommendations:</span>
                    <span className="font-medium">{analysisResult.recommendations.length}</span>
                  </div>
                </div>

                <Button
                  onClick={() => setShowReportViewer(true)}
                  variant="glass-primary"
                  size="sm"
                  className="w-full mt-4"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Full Report
                </Button>
              </div>

              {/* Selected Component Details */}
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Selected Component</h4>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-nehua-primary">{selectedNode.label}</p>
                      <p className="text-xs text-gray-600">{selectedNode.description}</p>
                    </div>
                    
                    {selectedNode.data.files && selectedNode.data.files.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700">Files:</p>
                        <ul className="text-xs text-gray-600 ml-2">
                          {selectedNode.data.files.slice(0, 3).map((file, i) => (
                            <li key={i} className="truncate">• {file}</li>
                          ))}
                          {selectedNode.data.files.length > 3 && (
                            <li className="text-gray-500">+{selectedNode.data.files.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Component Explanation */}
                  {componentExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-3 border-t border-gray-200"
                    >
                      <h5 className="text-xs font-medium text-gray-700 mb-2">AI Explanation:</h5>
                      <p className="text-xs text-gray-600 mb-2">{componentExplanation.explanation}</p>
                      
                      {componentExplanation.key_responsibilities && componentExplanation.key_responsibilities.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-700">Key Responsibilities:</p>
                          <ul className="text-xs text-gray-600 ml-2">
                            {componentExplanation.key_responsibilities.slice(0, 3).map((resp: string, i: number) => (
                              <li key={i}>• {resp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {explainLoading && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center space-x-2">
                      <RefreshCw className="w-3 h-3 animate-spin text-nehua-primary" />
                      <span className="text-xs text-gray-600">Generating AI explanation...</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="border-b border-gray-200 bg-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            
            <h2 className="text-lg font-semibold text-gray-900">
              Architecture Visualization
            </h2>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Database className="w-4 h-4" />
              <span>{analysisResult.frameworks[0]?.framework || 'Unknown'} Architecture</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowReportViewer(true)}
            >
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Architecture Diagram */}
        <div className="flex-1 p-4">
          <ArchitectureDiagram
            analysisResult={analysisResult}
            onNodeSelect={handleNodeSelect}
            onNodeExplain={handleNodeExplain}
          />
        </div>
      </div>

      {/* Report Viewer Modal */}
      {analysisResult && (
        <ReportViewer
          analysisResult={analysisResult}
          isOpen={showReportViewer}
          onClose={() => setShowReportViewer(false)}
        />
      )}
    </div>
  )
}