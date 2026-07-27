// Demo Performance Optimizations and Polish

// 1. Error Boundary for Production-Ready Experience
"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class DemoErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Demo Error Boundary caught an error:', error, errorInfo)
    
    // In a production app, you would log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Analytics tracking for demo
      console.log('Error tracked for demo analytics:', {
        error: error.message,
        stack: error.stack,
        component: errorInfo.componentStack
      })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="glass-panel p-8 max-w-md text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Demo Encountered an Issue
            </h2>
            <p className="text-gray-600 mb-6">
              Don't worry! This is just a demo hiccup. Let's get you back on track.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left mb-4 p-3 bg-red-50 rounded-lg text-sm">
                <summary className="font-medium cursor-pointer">Technical Details</summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}

            <div className="flex space-x-3">
              <Button onClick={this.handleReset} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Restart Demo
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 2. Demo Analytics & Tracking
export class DemoAnalytics {
  private static instance: DemoAnalytics
  private events: Array<{
    event: string
    timestamp: number
    data?: any
  }> = []

  static getInstance(): DemoAnalytics {
    if (!DemoAnalytics.instance) {
      DemoAnalytics.instance = new DemoAnalytics()
    }
    return DemoAnalytics.instance
  }

  track(event: string, data?: any) {
    this.events.push({
      event,
      timestamp: Date.now(),
      data
    })

    // Log for demo purposes
    console.log(`📊 Demo Analytics: ${event}`, data)
  }

  getSessionSummary() {
    const summary = {
      sessionStart: this.events[0]?.timestamp,
      sessionDuration: Date.now() - (this.events[0]?.timestamp || Date.now()),
      totalEvents: this.events.length,
      eventTypes: [...new Set(this.events.map(e => e.event))],
      lastActivity: this.events[this.events.length - 1]?.timestamp
    }

    console.log('📈 Demo Session Summary:', summary)
    return summary
  }
}

// 3. Performance Monitoring
export class DemoPerformanceMonitor {
  private static metrics: Map<string, number> = new Map()

  static startTimer(label: string) {
    this.metrics.set(label, performance.now())
  }

  static endTimer(label: string): number {
    const start = this.metrics.get(label)
    if (!start) return 0
    
    const duration = performance.now() - start
    this.metrics.delete(label)
    
    console.log(`⚡ Performance: ${label} took ${duration.toFixed(2)}ms`)
    return duration
  }

  static measureAsync<T>(label: string, promise: Promise<T>): Promise<T> {
    this.startTimer(label)
    return promise.finally(() => {
      this.endTimer(label)
    })
  }
}

// Demo data for offline mode (declared standalone so it can be referenced
// directly inside demoAnalysisResult below, instead of patched in after
// the fact)
const demoRepository = {
  id: 12345,
  name: 'demo-fastapi-app',
  full_name: 'demo-user/demo-fastapi-app',
  description: 'A sample FastAPI application for Nehua demo',
  html_url: 'https://github.com/demo-user/demo-fastapi-app',
  clone_url: 'https://github.com/demo-user/demo-fastapi-app.git',
  default_branch: 'main',
  language: 'Python',
  languages_url: 'https://api.github.com/repos/demo-user/demo-fastapi-app/languages',
  size: 2048,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T15:30:00Z',
  pushed_at: '2024-01-20T15:30:00Z'
}

// 4. Demo Configuration
export const DEMO_CONFIG = {
  // Feature flags for demo
  features: {
    enableAnalytics: true,
    enablePerformanceMonitoring: true,
    enableErrorBoundary: true,
    enableDemoMode: process.env.NODE_ENV === 'production',
    enableDebugPanel: process.env.NODE_ENV === 'development'
  },

  demoRepository,

  // Demo analysis result
  demoAnalysisResult: {
    repository: demoRepository,
    frameworks: [{ framework: 'fastapi', confidence: 0.9, evidence: ['main.py', 'requirements.txt'] }],
    nodes: [
      {
        id: 'fastapi-app',
        type: 'backend' as const,
        label: 'FastAPI Application',
        description: 'Main FastAPI application with async endpoints',
        position: { x: 200, y: 100 },
        data: {
          files: ['main.py', 'routers/users.py', 'routers/items.py'],
          dependencies: ['fastapi', 'uvicorn', 'pydantic'],
          exports: ['REST API', 'OpenAPI Docs']
        }
      },
      {
        id: 'database',
        type: 'database' as const,
        label: 'PostgreSQL Database',
        description: 'Primary database for data persistence',
        position: { x: 100, y: 300 },
        data: {
          files: ['models.py'],
          dependencies: ['sqlalchemy'],
          exports: ['Data Models']
        }
      },
      {
        id: 'redis-cache',
        type: 'cache' as const,
        label: 'Redis Cache',
        description: 'Caching layer for performance optimization',
        position: { x: 300, y: 300 },
        data: {
          files: [],
          dependencies: ['redis'],
          exports: ['Cache Operations']
        }
      }
    ],
    edges: [
      {
        id: 'app-database',
        source: 'fastapi-app',
        target: 'database',
        type: 'dependency' as const,
        label: 'queries',
        animated: true,
        style: { stroke: '#FA0080', strokeWidth: 2 }
      },
      {
        id: 'app-cache',
        source: 'fastapi-app',
        target: 'redis-cache',
        type: 'dependency' as const,
        label: 'caches',
        style: { stroke: '#00DDFA', strokeWidth: 2 }
      }
    ],
    health_score: {
      overall: 85,
      categories: {
        dependencies: 78,
        architecture: 89,
        code_quality: 82,
        performance: 91
      },
      reasoning: {
        dependencies: 'Most dependencies are up-to-date with good security practices',
        architecture: 'Well-structured FastAPI application with clear separation of concerns',
        code_quality: 'Clean code with good documentation and type hints',
        performance: 'Excellent performance with async patterns and caching'
      }
    },
    risks: [
      {
        id: 'risk-1',
        category: 'security' as const,
        severity: 'medium' as const,
        title: 'Missing rate limiting',
        description: 'API endpoints should implement rate limiting for security',
        affected_files: ['main.py'],
        recommendation: 'Add rate limiting middleware like slowapi'
      }
    ],
    recommendations: [
      {
        id: 'rec-1',
        category: 'performance' as const,
        priority: 'medium' as const,
        title: 'Add response caching',
        description: 'Implement response caching for frequently accessed endpoints',
        implementation: 'Use Redis-based response caching with appropriate TTL',
        estimated_effort: 'low' as const
      }
    ],
    metadata: {
      analyzed_at: new Date().toISOString(),
      analysis_duration: 3500,
      files_analyzed: 15,
      llm_calls: 4
    }
  },

  // UI polish settings
  animations: {
    enableReducedMotion: false,
    defaultDuration: 300,
    staggerDelay: 100
  },

  // Demo flow
  demoFlow: {
    steps: [
      'signin',
      'repository-selection', 
      'analysis',
      'visualization',
      'report-generation'
    ],
    currentStep: 0
  }
}

// 5. Demo Utilities
export class DemoUtils {
  static async simulateDelay(ms: number = 1000): Promise<void> {
    if (DEMO_CONFIG.features.enableDemoMode) {
      await new Promise(resolve => setTimeout(resolve, ms))
    }
  }

  static formatDemoData(data: any): any {
    // Add demo-specific formatting or sanitization
    return {
      ...data,
      _isDemoData: true,
      _timestamp: Date.now()
    }
  }

  static isDemoMode(): boolean {
    return DEMO_CONFIG.features.enableDemoMode
  }

  static trackDemoStep(step: string, data?: any) {
    DemoAnalytics.getInstance().track(`demo_step_${step}`, data)
  }
}

// 6. Demo Navigation Helper
export class DemoNavigationHelper {
  static getNextStep(currentPath: string): string | null {
    const stepMap: Record<string, string> = {
      '/auth/signin': '/repositories',
      '/repositories': '/analysis',
      '/analysis': '/analysis' // Stay on analysis for report generation
    }

    return stepMap[currentPath] || null
  }

  static getDemoProgress(currentPath: string): { current: number; total: number; percentage: number } {
    const steps = DEMO_CONFIG.demoFlow.steps
    const pathToStep: Record<string, number> = {
      '/auth/signin': 0,
      '/repositories': 1,
      '/analysis': 2
    }

    const current = pathToStep[currentPath] ?? 0
    const total = steps.length - 1 // Exclude last step
    const percentage = Math.round((current / total) * 100)

    return { current, total, percentage }
  }
}

export default {
  DemoErrorBoundary,
  DemoAnalytics,
  DemoPerformanceMonitor,
  DEMO_CONFIG,
  DemoUtils,
  DemoNavigationHelper
}