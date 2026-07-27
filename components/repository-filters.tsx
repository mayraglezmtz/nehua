'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RepositoryFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  languageFilter: string
  onLanguageFilterChange: (language: string) => void
  frameworkFilter: string
  onFrameworkFilterChange: (framework: string) => void
  availableLanguages: string[]
  availableFrameworks: string[]
  totalCount: number
  filteredCount: number
}

export function RepositoryFilters({
  searchQuery,
  onSearchChange,
  languageFilter,
  onLanguageFilterChange,
  frameworkFilter,
  onFrameworkFilterChange,
  availableLanguages,
  availableFrameworks,
  totalCount,
  filteredCount,
}: RepositoryFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const clearFilters = () => {
    onSearchChange('')
    onLanguageFilterChange('')
    onFrameworkFilterChange('')
  }

  const hasActiveFilters = searchQuery || languageFilter || frameworkFilter

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-500" />
        </div>
        <input
          type="text"
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="
            w-full pl-10 pr-4 py-3
            glass-input border-0
            text-white placeholder-gray-500
            focus:ring-2 focus:ring-nehua-primary focus:ring-opacity-50
            transition-all duration-200
          "
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filter Toggle & Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-nehua-primary rounded-full" />
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-400 hover:text-gray-200"
            >
              Clear all
            </Button>
          )}
        </div>

        <div className="text-sm text-gray-400">
          {filteredCount === totalCount ? (
            `${totalCount} repositories`
          ) : (
            `${filteredCount} of ${totalCount} repositories`
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="glass-panel p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Primary Language
              </label>
              <select
                value={languageFilter}
                onChange={(e) => onLanguageFilterChange(e.target.value)}
                className="
                  w-full px-3 py-2
                  glass-input border-0 rounded-lg
                  text-white
                  focus:ring-2 focus:ring-nehua-primary focus:ring-opacity-50
                  transition-all duration-200
                "
              >
                <option value="">All languages</option>
                {availableLanguages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>

            {/* Framework Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Detected Framework
              </label>
              <select
                value={frameworkFilter}
                onChange={(e) => onFrameworkFilterChange(e.target.value)}
                className="
                  w-full px-3 py-2
                  glass-input border-0 rounded-lg
                  text-white
                  focus:ring-2 focus:ring-nehua-primary focus:ring-opacity-50
                  transition-all duration-200
                "
              >
                <option value="">All frameworks</option>
                {availableFrameworks.map((framework) => (
                  <option key={framework} value={framework}>
                    {framework.charAt(0).toUpperCase() + framework.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/20">
              {searchQuery && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-nehua-primary/10 text-nehua-primary">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => onSearchChange('')}
                    className="ml-1 hover:text-nehua-primary/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {languageFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-nehua-secondary/10 text-nehua-secondary">
                  Language: {languageFilter}
                  <button
                    onClick={() => onLanguageFilterChange('')}
                    className="ml-1 hover:text-nehua-secondary/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {frameworkFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-nehua-accent/10 text-nehua-accent">
                  Framework: {frameworkFilter}
                  <button
                    onClick={() => onFrameworkFilterChange('')}
                    className="ml-1 hover:text-nehua-accent/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}