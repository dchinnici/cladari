import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import Link from 'next/link'
import { Leaf } from 'lucide-react'
import { ToastContainer } from '@/components/toast'


export const metadata: Metadata = {
  title: 'Cladari Plant Management',
  description: 'Cladari — professional plant management for breeding and conservation',
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
            <main className="pt-16">{children}</main>
            <ToastContainer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
