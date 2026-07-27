'use client'

import { motion } from 'framer-motion'
import { Loader2, Brain, Zap } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'glass' | 'pulse'
  text?: string
  showIcon?: boolean
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  text,
  showIcon = true 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  if (variant === 'glass') {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="glass-panel p-6 rounded-2xl">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <div className={`${sizeClasses[size]} border-4 border-nehua-primary/20 rounded-full relative`}>
              <div className="absolute inset-0 border-4 border-transparent border-t-nehua-primary rounded-full animate-spin" />
            </div>
          </motion.div>
        </div>
        
        {text && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${textSizeClasses[size]} text-gray-400 text-center`}
          >
            {text}
          </motion.p>
        )}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`${sizeClasses[size]} bg-gradient-to-br from-nehua-primary to-nehua-secondary rounded-full`}
          />
          
          {showIcon && (
            <motion.div
              animate={{
                scale: [1, 0.8, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Brain className="w-1/2 h-1/2 text-white" />
            </motion.div>
          )}
        </div>
        
        {text && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${textSizeClasses[size]} text-gray-400 text-center`}
          >
            {text}
          </motion.p>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className="flex flex-col items-center space-y-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizeClasses[size]} text-nehua-primary`}
      >
        <Loader2 className="w-full h-full" />
      </motion.div>
      
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${textSizeClasses[size]} text-gray-400`}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  text?: string
  variant?: 'glass' | 'blur'
}

export function LoadingOverlay({ 
  isLoading, 
  text = 'Loading...', 
  variant = 'glass' 
}: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        ${variant === 'glass' ? 'glass-overlay' : 'bg-slate-950/80 backdrop-blur-sm'}
      `}
    >
      <LoadingSpinner 
        size="lg" 
        variant={variant === 'glass' ? 'glass' : 'pulse'} 
        text={text} 
      />
    </motion.div>
  )
}

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circle' | 'rectangle'
  animate?: boolean
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangle', 
  animate = true 
}: SkeletonProps) {
  const baseClasses = 'bg-white/10 rounded'
  
  const variantClasses = {
    text: 'h-4 w-full',
    circle: 'w-10 h-10 rounded-full',
    rectangle: 'h-20 w-full rounded-lg'
  }

  return (
    <div
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${animate ? 'loading-shimmer' : ''} 
        ${className}
      `}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center space-x-3">
        <Skeleton variant="circle" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-5 w-3/4" />
          <Skeleton variant="text" className="h-3 w-1/2" />
        </div>
      </div>
      
      <Skeleton variant="text" className="h-3 w-full" />
      <Skeleton variant="text" className="h-3 w-2/3" />
      
      <div className="flex justify-between">
        <Skeleton variant="text" className="h-3 w-1/4" />
        <Skeleton variant="text" className="h-3 w-1/4" />
      </div>
    </div>
  )
}

export default LoadingSpinner