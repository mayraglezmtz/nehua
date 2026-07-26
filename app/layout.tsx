import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { DemoErrorBoundary } from '@/lib/demo-optimization'

const inter = Inter({ subsets: ['latin'], display: 'swap' })


export const metadata: Metadata = {
  title: 'Nehua',
  description: 'Autonomous Software Architecture Agent',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DemoErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </DemoErrorBoundary>
      </body>
    </html>
  )
}