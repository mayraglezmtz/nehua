'use client'

import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { DemoNavigationHelper } from '@/lib/demo-optimization'

interface DemoProgressProps {
  className?: string
}

export function DemoProgress({ className = '' }: DemoProgressProps) {
  const pathname = usePathname()
  const router = useRouter()
  
  const steps = [
    { id: 'signin', label: 'Authentication', path: '/auth/signin' },
    { id: 'repositories', label: 'Repository Selection', path: '/repositories' },
    { id: 'analysis', label: 'Architecture Analysis', path: '/analysis' }
  ]

  const { current, total, percentage } = DemoNavigationHelper.getDemoProgress(pathname)

  // Don't show on signin page or if there's an error
  if (pathname === '/auth/signin' || pathname === '/auth/error') {
    return null
  }

  return (
    <div className={`glass-panel p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Demo Progress</h3>
        <span className="text-xs text-gray-400">{percentage}% Complete</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-nehua-primary to-nehua-secondary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isCompleted = index < current
          const isCurrent = index === current
          const isUpcoming = index > current

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                isCurrent ? 'bg-nehua-primary/10' : 'hover:bg-white/5'
              }`}
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : isCurrent ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Circle className="w-5 h-5 text-nehua-primary fill-current" />
                  </motion.div>
                ) : (
                  <Circle className="w-5 h-5 text-gray-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  isCompleted ? 'text-green-500' :
                  isCurrent ? 'text-nehua-primary' :
                  'text-gray-500'
                }`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-gray-400">In Progress</p>
                )}
                {isCompleted && (
                  <p className="text-xs text-green-500">Completed</p>
                )}
              </div>

              {(isCompleted || isCurrent) && index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-500" />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Demo info */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <p className="text-xs text-gray-400 text-center">
          🏗️ Nehua Architecture Analysis Demo
        </p>
        <p className="text-xs text-gray-500 text-center mt-1">
          24-Hour Hackathon MVP
        </p>
      </div>
    </div>
  )
}