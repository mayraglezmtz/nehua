'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Repository } from '@/types'
import { GitHubService, detectFramework } from '@/lib/github'
import { RepositoryCard } from '@/components/repository-card'
import { RepositoryFilters } from '@/components/repository-filters'
import { Button } from '@/components/ui/button'
import { 
  Loader2, 
  RefreshCw, 
  Github, 
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  User,
  LogOut
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { DemoAnalytics, DemoPerformanceMonitor, DemoUtils } from '@/lib/demo-optimization'
import { DemoProgress } from "@/components/demo-progress"

interface RepositoryWithFramework extends Repository {
  framework?: { framework: string; confidence: number } | null
}

export default function RepositorySelection() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [repositories, setRepositories] = useState<RepositoryWithFramework[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [analyzingRepo, setAnalyzingRepo] = useState<string | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [languageFilter, setLanguageFilter] = useState('')
  const [frameworkFilter, setFrameworkFilter] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // Track page view
    DemoAnalytics.getInstance().track('page_view_repositories', {
      userId: session.user?.name,
      timestamp: Date.now()
    })
    
    loadRepositories()
  }, [session, status, router])

  const loadRepositories = async (pageNum = 1, reset = true) => {
    if (!session?.accessToken) return

    try {
      if (reset) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const githubService = new GitHubService(session.accessToken)
      const result = await githubService.getUserRepositories(pageNum, 20)

      // Detect frameworks for each repository
      const reposWithFrameworks: RepositoryWithFramework[] = await Promise.all(
        result.repositories.map(async (repo) => {
          try {
            const languages = await githubService.getRepositoryLanguages(
              repo.full_name.split('/')[0], 
              repo.name
            )
            const framework = await detectFramework(
              languages, 
              session.accessToken!, 
              repo.full_name.split('/')[0], 
              repo.name
            )
            return { ...repo, framework }
          } catch (error) {
            console.warn(`Failed to detect framework for ${repo.name}:`, error)
            return { ...repo, framework: null }
          }
        })
      )

      if (reset) {
        setRepositories(reposWithFrameworks)
      } else {
        setRepositories(prev => [...prev, ...reposWithFrameworks])
      }

      setHasMore(result.hasMore)
      setPage(pageNum)
    } catch (error) {
      console.error('Error loading repositories:', error)
      setError(error instanceof Error ? error.message : 'Failed to load repositories')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadRepositories(page + 1, false)
    }
  }

  const handleRepositorySelect = async (repository: Repository) => {
    setSelectedRepo(repository)
    setAnalyzingRepo(repository.full_name)
    
    // Track repository selection
    DemoAnalytics.getInstance().track('repository_selected', {
      repositoryName: repository.name,
      repositoryLanguage: repository.language,
      repositorySize: repository.size
    })
    
    try {
      console.log('Starting analysis for:', repository.full_name)
      
      // Add performance monitoring with demo delay
      DemoPerformanceMonitor.startTimer('repository_analysis')
      await DemoUtils.simulateDelay(500) // Demo polish: slight delay for UX
      
      const response = await DemoPerformanceMonitor.measureAsync(
        'api_analyze_request',
        fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ repository })
        })
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Analysis failed')
      }

      console.log('Analysis completed:', result.data)
      
      // Show enhanced analysis info
      const metadata = result.data.metadata
      console.log(`Analysis completed in ${metadata.analysis_duration}ms with ${metadata.llm_calls} AI calls`)
      console.log(`Health Score: ${result.data.health_score.overall}/100`)
      console.log(`Risks found: ${result.data.risks.length}`)
      console.log(`Recommendations: ${result.data.recommendations.length}`)
      
      // Track successful analysis
      DemoAnalytics.getInstance().track('analysis_completed', {
        repositoryName: repository.name,
        healthScore: result.data.health_score.overall,
        risksCount: result.data.risks.length,
        recommendationsCount: result.data.recommendations.length,
        duration: metadata.analysis_duration,
        llmCalls: metadata.llm_calls
      })
      
      // Store analysis result for next page
      localStorage.setItem('nehua-analysis-result', JSON.stringify(result.data))
      
      // Navigate to analysis results page
      router.push('/analysis')
      
    } catch (error) {
      console.error('Analysis error:', error)
      setError(error instanceof Error ? error.message : 'Analysis failed')
      
      DemoAnalytics.getInstance().track('analysis_error', {
        repositoryName: repository.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      DemoPerformanceMonitor.endTimer('repository_analysis')
      setAnalyzingRepo(null)
    }
  }

  // Memoized filtered repositories
  const filteredRepositories = useMemo(() => {
    return repositories.filter(repo => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = repo.name.toLowerCase().includes(query)
        const matchesDescription = repo.description?.toLowerCase().includes(query)
        if (!matchesName && !matchesDescription) return false
      }

      // Language filter
      if (languageFilter && repo.language !== languageFilter) return false

      // Framework filter
      if (frameworkFilter && repo.framework?.framework !== frameworkFilter) return false

      return true
    })
  }, [repositories, searchQuery, languageFilter, frameworkFilter])

  // Extract unique values for filters
  const availableLanguages = useMemo(() => {
    const languages = repositories
      .map(repo => repo.language)
      .filter((lang): lang is string => Boolean(lang))
      .filter((lang, index, arr) => arr.indexOf(lang) === index)
    return languages.sort()
  }, [repositories])

  const availableFrameworks = useMemo(() => {
    const frameworks = repositories
      .map(repo => repo.framework?.framework)
      .filter((framework): framework is string => Boolean(framework))
      .filter((framework, index, arr) => arr.indexOf(framework) === index)
    return frameworks.sort()
  }, [repositories])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-nehua-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-nehua-primary to-nehua-secondary rounded-lg flex items-center justify-center">
                  <Github className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold gradient-text">Nehua</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <User className="w-4 h-4" />
                <span>{session.user?.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-gray-300 hover:text-gray-100"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Progress */}
        <div className="mb-6">
          <DemoProgress />
        </div>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Select Repository for Analysis
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Choose a public repository from your GitHub account to analyze its architecture,
            generate insights, and get AI-powered recommendations.
          </p>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-4 mb-8 border-red-500/30"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-300">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadRepositories()}
                className="text-red-400 hover:text-red-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-nehua-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading your repositories...</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <RepositoryFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                languageFilter={languageFilter}
                onLanguageFilterChange={setLanguageFilter}
                frameworkFilter={frameworkFilter}
                onFrameworkFilterChange={setFrameworkFilter}
                availableLanguages={availableLanguages}
                availableFrameworks={availableFrameworks}
                totalCount={repositories.length}
                filteredCount={filteredRepositories.length}
              />
            </motion.div>

            {/* Repository Grid */}
            {filteredRepositories.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Github className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  No repositories found
                </h3>
                <p className="text-gray-400">
                  {repositories.length === 0
                    ? "You don't have any public repositories yet."
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {filteredRepositories.map((repository, index) => (
                    <motion.div
                      key={repository.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <RepositoryCard
                        repository={repository}
                        framework={repository.framework}
                        onSelect={handleRepositorySelect}
                        isSelected={selectedRepo?.id === repository.id}
                        isLoading={analyzingRepo === repository.full_name}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Load More Button */}
            {hasMore && filteredRepositories.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mt-8"
              >
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="outline"
                  size="lg"
                  className="px-8"
                >
                  {loadingMore ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5 mr-2" />
                  )}
                  {loadingMore ? 'Loading...' : 'Load More Repositories'}
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Selected Repository Notification */}
      <AnimatePresence>
        {selectedRepo && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 right-6 glass-card p-4 max-w-sm"
          >
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-white">Repository Selected</p>
                <p className="text-sm text-gray-400">{selectedRepo.name}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}