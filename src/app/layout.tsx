import type { Metadata, Viewport } from 'next'
import { DM_Sans, Instrument_Serif } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ToastContainer } from '@/components/toast'
import ServiceWorker from '@/components/ServiceWorker'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
  style: ['normal', 'italic'],
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
      <body className={`bg-[var(--cream)] ${dmSans.variable} ${instrumentSerif.variable}`}>
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
