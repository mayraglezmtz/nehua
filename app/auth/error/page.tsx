'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'Access denied. You do not have permission to access this resource.',
  Verification: 'The verification link has expired or has already been used.',
  Default: 'An unexpected error occurred during authentication.',
}

export default function AuthError() {
  return (
    <Suspense fallback={null}>
      <AuthErrorContent />
    </Suspense>
  )
}

function AuthErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-orange-950/20 to-transparent" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-md w-full"
      >
        {/* Glass card */}
        <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-3xl p-8 shadow-glass text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mb-6"
          >
            <AlertCircle className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-white mb-4"
          >
            Authentication Error
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-gray-300 mb-8"
          >
            {errorMessage}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              onClick={() => router.push('/auth/signin')}
              className="w-full h-12 bg-gradient-to-r from-nehua-primary to-nehua-secondary hover:from-nehua-primary/80 hover:to-nehua-secondary/80 text-white rounded-xl transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Try Again
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}