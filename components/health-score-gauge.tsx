'use client'

import { motion } from 'framer-motion'
import { HealthScore } from '@/types'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Shield, 
  Code, 
  Zap,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react'

interface HealthScoreGaugeProps {
  healthScore: HealthScore
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
}

export function HealthScoreGauge({ 
  healthScore, 
  size = 'md', 
  showDetails = true 
}: HealthScoreGaugeProps) {
  const { overall, categories, reasoning } = healthScore

  // Size configurations
  const sizeConfig = {
    sm: { 
      gauge: 80, 
      stroke: 6, 
      text: 'text-lg', 
      subtext: 'text-xs',
      categorySize: 40,
      categoryStroke: 4
    },
    md: { 
      gauge: 120, 
      stroke: 8, 
      text: 'text-2xl', 
      subtext: 'text-sm',
      categorySize: 50,
      categoryStroke: 5
    },
    lg: { 
      gauge: 160, 
      stroke: 10, 
      text: 'text-3xl', 
      subtext: 'text-base',
      categorySize: 60,
      categoryStroke: 6
    }
  }

  const config = sizeConfig[size]
  const radius = (config.gauge - config.stroke) / 2
  const circumference = radius * 2 * Math.PI
  
  // Score color and status
  const getScoreColor = (score: number) => {
    if (score >= 90) return { color: '#10b981', bg: '#ecfdf5', status: 'excellent' }
    if (score >= 75) return { color: '#3b82f6', bg: '#eff6ff', status: 'good' }
    if (score >= 60) return { color: '#f59e0b', bg: '#fffbeb', status: 'fair' }
    return { color: '#ef4444', bg: '#fef2f2', status: 'poor' }
  }

  const overallConfig = getScoreColor(overall)
  
  // Category configurations
  const categoryConfigs = [
    {
      key: 'dependencies',
      icon: Shield,
      label: 'Dependencies',
      score: categories.dependencies,
      color: '#FA0080'
    },
    {
      key: 'architecture', 
      icon: Activity,
      label: 'Architecture',
      score: categories.architecture,
      color: '#00DDFA'
    },
    {
      key: 'code_quality',
      icon: Code,
      label: 'Code Quality', 
      score: categories.code_quality,
      color: '#FADD00'
    },
    {
      key: 'performance',
      icon: Zap,
      label: 'Performance',
      score: categories.performance,
      color: '#A59837'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Main Health Score Gauge */}
      <div className="flex flex-col items-center">
        <div className="relative">
          {/* Background circle */}
          <svg
            width={config.gauge}
            height={config.gauge}
            className="transform -rotate-90"
          >
            <circle
              cx={config.gauge / 2}
              cy={config.gauge / 2}
              r={radius}
              stroke="#e5e7eb"
              strokeWidth={config.stroke}
              fill="none"
            />
            
            {/* Progress circle */}
            <motion.circle
              cx={config.gauge / 2}
              cy={config.gauge / 2}
              r={radius}
              stroke={overallConfig.color}
              strokeWidth={config.stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ 
                strokeDashoffset: circumference - (overall / 100) * circumference 
              }}
              transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
              style={{
                filter: `drop-shadow(0 0 8px ${overallConfig.color}40)`
              }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, type: "spring", stiffness: 200 }}
              className={`font-bold ${config.text}`}
              style={{ color: overallConfig.color }}
            >
              {overall}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className={`${config.subtext} text-gray-600 capitalize`}
            >
              {overallConfig.status}
            </motion.div>
          </div>

          {/* Status icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 1.5, type: "spring" }}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: overallConfig.bg }}
          >
            {overall >= 75 ? (
              <CheckCircle2 className="w-4 h-4" style={{ color: overallConfig.color }} />
            ) : overall >= 60 ? (
              <AlertTriangle className="w-4 h-4" style={{ color: overallConfig.color }} />
            ) : (
              <TrendingDown className="w-4 h-4" style={{ color: overallConfig.color }} />
            )}
          </motion.div>
        </div>

        {/* Overall reasoning */}
        {reasoning.overall && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className="text-center text-sm text-gray-600 mt-4 max-w-xs"
          >
            {reasoning.overall}
          </motion.p>
        )}
      </div>

      {/* Category Breakdown */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="grid grid-cols-2 gap-4"
        >
          {categoryConfigs.map((category, index) => {
            const categoryRadius = (config.categorySize - config.categoryStroke) / 2
            const categoryCircumference = categoryRadius * 2 * Math.PI
            const categoryScoreConfig = getScoreColor(category.score)
            const Icon = category.icon

            return (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2 + index * 0.1 }}
                className="glass-panel p-4 hover:shadow-xl transition-all duration-300 interactive-hover"
              >
                <div className="flex items-center space-x-3">
                  {/* Category mini-gauge */}
                  <div className="relative">
                    <svg
                      width={config.categorySize}
                      height={config.categorySize}
                      className="transform -rotate-90"
                    >
                      <circle
                        cx={config.categorySize / 2}
                        cy={config.categorySize / 2}
                        r={categoryRadius}
                        stroke="#e5e7eb"
                        strokeWidth={config.categoryStroke}
                        fill="none"
                      />
                      <motion.circle
                        cx={config.categorySize / 2}
                        cy={config.categorySize / 2}
                        r={categoryRadius}
                        stroke={category.color}
                        strokeWidth={config.categoryStroke}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={categoryCircumference}
                        initial={{ strokeDashoffset: categoryCircumference }}
                        animate={{ 
                          strokeDashoffset: categoryCircumference - (category.score / 100) * categoryCircumference 
                        }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 2.5 + index * 0.2 }}
                      />
                    </svg>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon 
                        className="w-4 h-4" 
                        style={{ color: category.color }}
                      />
                    </div>
                  </div>

                  {/* Category details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {category.label}
                      </h4>
                      <span 
                        className="text-sm font-bold ml-2"
                        style={{ color: category.color }}
                      >
                        {category.score}
                      </span>
                    </div>
                    
                    {reasoning[category.key as keyof typeof reasoning] && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {reasoning[category.key as keyof typeof reasoning]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Category trend indicator */}
                <div className="mt-2 flex items-center space-x-1">
                  {category.score >= 80 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : category.score >= 60 ? (
                    <Info className="w-3 h-3 text-yellow-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className="text-xs text-gray-500">
                    {category.score >= 80 ? 'Excellent' : 
                     category.score >= 60 ? 'Needs attention' : 'Critical'}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}