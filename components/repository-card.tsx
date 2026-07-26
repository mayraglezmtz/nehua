'use client'

import { Repository } from '@/types'
import { motion } from 'framer-motion'
import { Calendar, GitBranch, Star, Eye, Code2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RepositoryCardProps {
  repository: Repository
  framework?: { framework: string; confidence: number } | null
  onSelect: (repository: Repository) => void
  isSelected?: boolean
  isLoading?: boolean
}

const frameworkColors: Record<string, string> = {
  django: '#092E20',
  fastapi: '#009688',
  react: '#61DAFB',
  nextjs: '#000000',
}

const frameworkIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  django: Code2,
  fastapi: Zap,
  react: Code2,
  nextjs: Code2,
}

export function RepositoryCard({ 
  repository, 
  framework, 
  onSelect, 
  isSelected = false,
  isLoading = false 
}: RepositoryCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getLanguageColor = (language: string | null) => {
    const colors: Record<string, string> = {
      JavaScript: '#F7DF1E',
      TypeScript: '#3178C6',
      Python: '#3776AB',
      HTML: '#E34F26',
      CSS: '#1572B6',
      Java: '#ED8B00',
      'C++': '#00599C',
      Go: '#00ADD8',
    }
    return colors[language || ''] || '#6B7280'
  }

  const FrameworkIcon = framework ? frameworkIcons[framework.framework] || Code2 : null

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`relative group`}
    >
      <div className={`
        glass-card-hover p-6 h-full transition-all duration-300 cursor-pointer
        ${isSelected ? 'ring-2 ring-nehua-primary shadow-glow-pink animate-border' : ''}
        ${isLoading ? 'opacity-50 pointer-events-none loading-shimmer' : ''}
      `}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-nehua-primary transition-colors">
              {repository.name}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {repository.full_name}
            </p>
          </div>
          
          {framework && (
            <div className="flex items-center space-x-1 ml-2">
              {FrameworkIcon && (
                <FrameworkIcon 
                  className="w-4 h-4" 
                  style={{ color: frameworkColors[framework.framework] || '#6B7280' }} 
                />
              )}
              <span className="text-xs px-2 py-1 rounded-full bg-nehua-accent/10 text-nehua-accent font-medium">
                {framework.framework}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {repository.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {repository.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center space-x-4 mb-4 text-xs text-gray-500">
          {repository.language && (
            <div className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getLanguageColor(repository.language) }}
              />
              <span>{repository.language}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>Updated {formatDate(repository.updated_at)}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <GitBranch className="w-3 h-3" />
            <span>{repository.default_branch}</span>
          </div>
        </div>

        {/* Size indicator */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {(repository.size / 1024).toFixed(1)} MB
          </div>
          
          {framework && (
            <div className="text-xs text-gray-500">
              {Math.round(framework.confidence * 100)}% confidence
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <Button
            onClick={() => onSelect(repository)}
            disabled={isLoading}
            className="w-full"
            variant={isSelected ? "default" : "glass"}
            size="sm"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              />
            ) : isSelected ? (
              'Selected'
            ) : (
              'Analyze Architecture'
            )}
          </Button>
        </div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-nehua-primary/5 to-nehua-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </motion.div>
  )
}