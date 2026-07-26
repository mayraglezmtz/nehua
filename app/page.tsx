'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (!session) {
      router.push('/auth/signin')
    } else {
      // User is authenticated, redirect to repository selection
      router.push('/repositories')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <Loader2 className="w-8 h-8 text-nehua-primary" />
          </motion.div>
          <p className="text-gray-600">Loading Nehua...</p>
        </motion.div>
      </div>
    )
  }

  if (session) {
    // This will rarely show as we redirect immediately, but good for debugging
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold gradient-text mb-4">
            Redirecting to Repository Selection...
          </h1>
          <p className="text-gray-600">
            Welcome, {session.user?.name}!
          </p>
        </div>
      </div>
    )
  }

  return null
}