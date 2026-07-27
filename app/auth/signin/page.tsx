'use client'

import { signIn, getSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Github, Brain, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DemoAnalytics, DemoPerformanceMonitor } from '@/lib/demo-optimization'

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Track demo page view
    DemoAnalytics.getInstance().track('page_view_signin', {
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    })

    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push('/repositories')
      }
    })
  }, [router])

  const handleGitHubSignIn = async () => {
    setIsLoading(true)
    DemoAnalytics.getInstance().track('signin_attempt', { provider: 'github' })
    
    try {
      DemoPerformanceMonitor.startTimer('github_signin')
      await signIn('github', { callbackUrl: '/repositories' })
      
      DemoAnalytics.getInstance().track('signin_success', { 
        provider: 'github',
        redirectTo: '/repositories'
      })
    } catch (error) {
      console.error('Sign in error:', error)
      DemoAnalytics.getInstance().track('signin_error', { 
        provider: 'github',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      DemoPerformanceMonitor.endTimer('github_signin')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 overflow-hidden">
      {/* Enhanced background gradient mesh */}
      <div className="absolute inset-0 gradient-mesh" />
      
      {/* Enhanced floating orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-30"
          style={{
            background: 'linear-gradient(135deg, #FA0080, #00DDFA)',
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{
            background: 'linear-gradient(135deg, #FADD00, #A59837)',
          }}
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full blur-2xl opacity-25"
          style={{
            background: 'linear-gradient(135deg, #7A3D5D, #3D737A)',
          }}
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -80, 40, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main content */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Enhanced Glass card */}
        <div className="glass-panel p-8 shadow-2xl">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: 0.2, 
                type: "spring", 
                stiffness: 200,
                damping: 15
              }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-glow-pink relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #FA0080, #00DDFA)',
              }}
            >
              <Brain className="w-8 h-8 text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-bold gradient-text-animated mb-2"
            >
              Nehua
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-gray-600 mt-2"
            >
              Autonomous Software Architecture Agent
            </motion.p>
          </div>

          {/* Enhanced features preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-4 mb-8"
          >
            <div className="flex items-center space-x-3 text-sm text-gray-700 glass-card-hover p-3 rounded-xl">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
                   style={{ background: 'linear-gradient(135deg, #00DDFA, #007B8A)' }}>
                <Github className="w-5 h-5 text-white relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
              </div>
              <span className="font-medium">Connect your GitHub repositories</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm text-gray-700 glass-card-hover p-3 rounded-xl">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
                   style={{ background: 'linear-gradient(135deg, #FA0080, #B8005A)' }}>
                <Brain className="w-5 h-5 text-white relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
              </div>
              <span className="font-medium">AI-powered architecture analysis</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm text-gray-700 glass-card-hover p-3 rounded-xl">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
                   style={{ background: 'linear-gradient(135deg, #FADD00, #C7B400)' }}>
                <Zap className="w-5 h-5 text-white relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
              </div>
              <span className="font-medium">Interactive visualization</span>
            </div>
          </motion.div>

          {/* Sign in button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
          >
            <Button
              onClick={handleGitHubSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Github className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                  Continue with GitHub
                </>
              )}
            </Button>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-xs text-gray-500 text-center mt-6"
          >
            We only access your public repositories
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}