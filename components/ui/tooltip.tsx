'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider

const TooltipRoot = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

interface TooltipContentProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  variant?: 'default' | 'glass' | 'dark'
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 4, variant = 'glass', children, ...props }, ref) => {
  const variantStyles = {
    default: 'bg-white border border-gray-200 text-gray-900 shadow-lg',
    glass: 'glass-panel border-white/20 text-gray-800 shadow-2xl',
    dark: 'bg-gray-900 border border-gray-800 text-white shadow-xl'
  }

  return (
    <AnimatePresence>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'z-50 overflow-hidden rounded-lg px-3 py-2 text-sm',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2',
          'data-[side=top]:slide-in-from-bottom-2',
          variantStyles[variant],
          className
        )}
        asChild
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
        >
          {children}
        </motion.div>
      </TooltipPrimitive.Content>
    </AnimatePresence>
  )
})
TooltipContent.displayName = TooltipPrimitive.Content.displayName

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  variant?: 'default' | 'glass' | 'dark'
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  delayDuration?: number
}

function Tooltip({ 
  children, 
  content, 
  variant = 'glass',
  side = 'top',
  align = 'center',
  delayDuration = 200 
}: TooltipProps) {
  return (
    <TooltipRoot delayDuration={delayDuration}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side={side} 
        align={align} 
        variant={variant}
      >
        {content}
      </TooltipContent>
    </TooltipRoot>
  )
}

export { Tooltip, TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent }