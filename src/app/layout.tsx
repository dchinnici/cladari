import type { Metadata, Viewport } from 'next'
import { Outfit, Fraunces } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ToastContainer } from '@/components/toast'
import ServiceWorker from '@/components/ServiceWorker'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1a3a2f',
}

export const metadata: Metadata = {
  title: 'Cladari',
  description: 'Plant collection management for breeding and conservation',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cladari'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`bg-[var(--cream)] ${outfit.variable} ${fraunces.variable}`}>
        <Providers>
          <div className="min-h-screen">
            {children}
            <ToastContainer />
            <ServiceWorker />
          </div>
        </Providers>
      </body>
    </html>
  )
}
