'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArchitectureReport } from '@/lib/report-generator'
import { AnalysisResult } from '@/types'
import { 
  FileText, 
  Download, 
  Share, 
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Shield,
  Zap,
  Code,
  Target,
  TrendingUp,
  Users,
  Calendar,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'

interface ReportViewerProps {
  analysisResult: AnalysisResult
  isOpen: boolean
  onClose: () => void
}

export function ReportViewer({ analysisResult, isOpen, onClose }: ReportViewerProps) {
  const [report, setReport] = useState<ArchitectureReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']))
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown' | 'pdf'>('markdown')
  const [exporting, setExporting] = useState(false)

  const generateReport = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          analysisResult,
          format: 'json' // Always get structured data first
        })
      })

      const result = await response.json()
      if (result.success) {
        setReport(result.data.report)
        setExpandedSections(new Set(['summary', 'health', 'risks']))
      } else {
        console.error('Report generation failed:', result.error)
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'json' | 'markdown' | 'pdf') => {
    if (!report) return

    setExporting(true)
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          analysisResult,
          format
        })
      })

      const result = await response.json()
      if (result.success) {
        // Create download - binary formats (PDF) come back base64-encoded
        const blob = result.data.encoding === 'base64'
          ? new Blob([Uint8Array.from(atob(result.data.content), c => c.charCodeAt(0))], {
              type: result.metadata.contentType
            })
          : new Blob([result.data.content], { type: result.metadata.contentType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.metadata.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to export report:', error)
    } finally {
      setExporting(false)
    }
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const formatScore = (score: number) => {
    if (score >= 80) return { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Excellent' }
    if (score >= 60) return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Good' }
    if (score >= 40) return { color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Fair' }
    return { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Poor' }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-panel w-full max-w-6xl h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-nehua-primary" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  Architecture Report
                </h2>
                <p className="text-sm text-gray-300">
                  {analysisResult.repository.name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {report && (
                <>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="glass-input px-3 py-2 text-sm text-white border-0 rounded-lg"
                  >
                    <option value="markdown" className="bg-slate-900 text-white">Markdown</option>
                    <option value="json" className="bg-slate-900 text-white">JSON</option>
                    <option value="pdf" className="bg-slate-900 text-white">PDF</option>
                  </select>

                  <Button
                    variant="glass-primary"
                    size="sm"
                    onClick={() => exportReport(exportFormat)}
                    disabled={exporting}
                  >
                    {exporting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </>
                    )}
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!report ? (
              <div className="flex flex-col items-center justify-center h-full">
                {loading ? (
                  <LoadingSpinner 
                    size="lg" 
                    variant="glass" 
                    text="Generating comprehensive report..." 
                  />
                ) : (
                  <div className="text-center space-y-4">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Generate Architecture Report
                      </h3>
                      <p className="text-gray-300 mb-6 max-w-md">
                        Create a comprehensive analysis report with detailed insights, 
                        recommendations, and action plans.
                      </p>
                      <Button
                        onClick={generateReport}
                        className="px-8"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Executive Summary */}
                <ReportSection
                  id="summary"
                  title="Executive Summary"
                  icon={<BarChart3 className="w-5 h-5" />}
                  isExpanded={expandedSections.has('summary')}
                  onToggle={() => toggleSection('summary')}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="glass-card p-4 text-center">
                      <div className={`text-3xl font-bold mb-2 ${formatScore(report.executiveSummary.overallHealth).color}`}>
                        {report.executiveSummary.overallHealth}
                      </div>
                      <div className="text-sm text-gray-300">Overall Health</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                      <div className="text-3xl font-bold text-nehua-secondary mb-2">
                        {report.architectureOverview.componentsCount}
                      </div>
                      <div className="text-sm text-gray-300">Components</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                      <div className="text-3xl font-bold text-nehua-accent mb-2">
                        {report.riskAssessment.riskMatrix.high + report.riskAssessment.riskMatrix.medium}
                      </div>
                      <div className="text-sm text-gray-300">Active Risks</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                      <div className="text-3xl font-bold text-nehua-primary mb-2">
                        {report.recommendations.immediate.length + report.recommendations.shortTerm.length}
                      </div>
                      <div className="text-sm text-gray-300">Recommendations</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-white mb-2">Key Findings</h4>
                      <ul className="space-y-1">
                        {report.executiveSummary.keyFindings.map((finding, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {report.executiveSummary.criticalIssues.length > 0 && 
                     report.executiveSummary.criticalIssues[0] !== 'No critical issues identified' && (
                      <div>
                        <h4 className="font-semibold text-white mb-2 flex items-center">
                          <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                          Critical Issues
                        </h4>
                        <ul className="space-y-1">
                          {report.executiveSummary.criticalIssues.map((issue, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ReportSection>

                {/* Health Analysis */}
                <ReportSection
                  id="health"
                  title="Health Analysis"
                  icon={<Shield className="w-5 h-5" />}
                  isExpanded={expandedSections.has('health')}
                  onToggle={() => toggleSection('health')}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(report.healthAnalysis.categories).map(([category, data]) => {
                      const scoreInfo = formatScore(data.score)
                      return (
                        <div key={category} className="glass-card p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold capitalize">
                              {category.replace('_', ' ')}
                            </h4>
                            <div className={`px-2 py-1 rounded-full text-sm font-medium ${scoreInfo.bg} ${scoreInfo.color}`}>
                              {data.score}/100
                            </div>
                          </div>
                          <p className="text-sm text-gray-300 mb-3">{data.reasoning}</p>
                          {data.issues.length > 0 && data.issues[0] !== 'No major issues identified' && (
                            <div>
                              <h5 className="text-xs font-medium text-gray-300 mb-1">Issues:</h5>
                              <ul className="space-y-1">
                                {data.issues.map((issue, index) => (
                                  <li key={index} className="text-xs text-gray-300 flex items-start space-x-1">
                                    <span className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                                    <span>{issue}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </ReportSection>

                {/* Risk Assessment */}
                <ReportSection
                  id="risks"
                  title="Risk Assessment"
                  icon={<AlertTriangle className="w-5 h-5" />}
                  isExpanded={expandedSections.has('risks')}
                  onToggle={() => toggleSection('risks')}
                >
                  <div className="mb-6">
                    <p className="text-gray-300 mb-4">{report.riskAssessment.summary}</p>
                    
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-sm">High ({report.riskAssessment.riskMatrix.high})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-sm">Medium ({report.riskAssessment.riskMatrix.medium})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-400 rounded"></div>
                        <span className="text-sm">Low ({report.riskAssessment.riskMatrix.low})</span>
                      </div>
                    </div>
                  </div>

                  {Object.entries(report.riskAssessment.risksByCategory).map(([category, risks]) => (
                    risks.length > 0 && (
                      <div key={category} className="mb-6">
                        <h4 className="font-semibold capitalize text-white mb-3 flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          {category} Risks ({risks.length})
                        </h4>
                        <div className="space-y-3">
                          {risks.map((risk, index) => (
                            <div key={index} className="glass-card p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium text-white">{risk.title}</h5>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  risk.severity === 'high' ? 'bg-red-500/10 text-red-400' :
                                  risk.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                  'bg-white/10 text-gray-300'
                                }`}>
                                  {risk.severity}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300 mb-3">{risk.description}</p>
                              <div className="text-sm">
                                <span className="font-medium text-gray-300">Recommendation: </span>
                                <span className="text-gray-300">{risk.recommendation}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </ReportSection>

                {/* Action Plan */}
                <ReportSection
                  id="actions"
                  title="Action Plan"
                  icon={<Target className="w-5 h-5" />}
                  isExpanded={expandedSections.has('actions')}
                  onToggle={() => toggleSection('actions')}
                >
                  <div className="space-y-6">
                    <ActionPhase
                      title="Phase 1: Immediate Actions"
                      icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
                      actions={report.actionPlan.phase1}
                      color="red"
                    />
                    <ActionPhase
                      title="Phase 2: Short-term Improvements"
                      icon={<Clock className="w-4 h-4 text-yellow-500" />}
                      actions={report.actionPlan.phase2}
                      color="yellow"
                    />
                    <ActionPhase
                      title="Phase 3: Long-term Enhancements"
                      icon={<TrendingUp className="w-4 h-4 text-green-500" />}
                      actions={report.actionPlan.phase3}
                      color="green"
                    />
                  </div>
                </ReportSection>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

interface ReportSectionProps {
  id: string
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
}

function ReportSection({ id, title, icon, children, isExpanded, onToggle }: ReportSectionProps) {
  return (
    <div className="glass-panel">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {icon}
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-300" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-300" />
        )}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-white/10">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface ActionPhaseProps {
  title: string
  icon: React.ReactNode
  actions: Array<{ task: string; timeline: string; owner: string }>
  color: 'red' | 'yellow' | 'green'
}

function ActionPhase({ title, icon, actions, color }: ActionPhaseProps) {
  const colorClasses = {
    red: 'border-red-500/30 bg-red-950/30',
    yellow: 'border-yellow-500/30 bg-yellow-950/20',
    green: 'border-green-500/30 bg-green-950/20'
  }

  return (
    <div className={`glass-card border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center space-x-3 mb-4">
        {icon}
        <h4 className="font-semibold text-white">{title}</h4>
      </div>
      
      <div className="space-y-3">
        {actions.map((action, index) => (
          <div key={index} className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium text-sm text-white">{action.task}</p>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-xs text-gray-300 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {action.timeline}
                </span>
                <span className="text-xs text-gray-300 flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {action.owner}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}