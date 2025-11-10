import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import Link from 'next/link'
import { Leaf, Home, Trees, MapPin, Dna, Menu } from 'lucide-react'
import { ToastContainer } from '@/components/toast'
import ServiceWorker from '@/components/ServiceWorker'


export const metadata: Metadata = {
  title: 'Cladari Plant Management',
  description: 'Cladari — professional plant management for breeding and conservation',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
  themeColor: '#10b981',
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
      <body>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <Link href="/" className="flex items-center space-x-3 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Leaf className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xl font-bold gradient-text">Cladari</span>
                    </Link>

                    <div className="hidden sm:ml-10 sm:flex sm:space-x-1">
                      {[
                        { name: 'Dashboard', href: '/dashboard' },
                        { name: 'Plants', href: '/plants' },
                        { name: 'Locations', href: '/locations' },
                        { name: 'Breeding', href: '/breeding' },
                        { name: 'Genetics', href: '/genetics' },
                      ].map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-emerald-700">67 Plants</span>
                    </div>
                    <Link href="/batch-care" className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium hover:from-emerald-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105">
                      Batch Care
                    </Link>
                  </div>
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <main className="pt-16 pb-16 sm:pb-0">{children}</main>

            {/* Mobile Bottom Navigation */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200">
              <div className="grid grid-cols-5 h-16">
                <Link href="/dashboard" className="flex flex-col items-center justify-center text-gray-600 hover:text-emerald-600">
                  <Home className="w-5 h-5" />
                  <span className="text-xs mt-1">Home</span>
                </Link>
                <Link href="/plants" className="flex flex-col items-center justify-center text-gray-600 hover:text-emerald-600">
                  <Trees className="w-5 h-5" />
                  <span className="text-xs mt-1">Plants</span>
                </Link>
                <Link href="/batch-care" className="flex flex-col items-center justify-center text-gray-600 hover:text-emerald-600">
                  <Leaf className="w-5 h-5" />
                  <span className="text-xs mt-1">Care</span>
                </Link>
                <Link href="/locations" className="flex flex-col items-center justify-center text-gray-600 hover:text-emerald-600">
                  <MapPin className="w-5 h-5" />
                  <span className="text-xs mt-1">Locations</span>
                </Link>
                <Link href="/genetics" className="flex flex-col items-center justify-center text-gray-600 hover:text-emerald-600">
                  <Dna className="w-5 h-5" />
                  <span className="text-xs mt-1">Genetics</span>
                </Link>
              </div>
            </nav>

            <ToastContainer />
            <ServiceWorker />
          </div>
        </Providers>
      </body>
    </html>
  )
}
