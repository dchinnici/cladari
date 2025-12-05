import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import Link from 'next/link'
import { Home, Trees, Droplets, MapPin, Dna } from 'lucide-react'
import { ToastContainer } from '@/components/toast'
import ServiceWorker from '@/components/ServiceWorker'


export const metadata: Metadata = {
  title: 'Cladari',
  description: 'Plant collection management for breeding and conservation',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
  themeColor: '#1a3a2f',
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
      <body className="bg-[var(--cream)]">
        <Providers>
          <div className="min-h-screen">
            {/* Compact header - hidden on mobile, nav is at bottom */}
            <nav className="hidden sm:block fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/[0.08]">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex justify-between h-12">
                  <div className="flex items-center gap-10">
                    <Link href="/" className="text-lg font-semibold text-[var(--forest)]">
                      Cladari
                    </Link>

                    <div className="flex gap-1">
                      {[
                        { name: 'Dashboard', href: '/dashboard' },
                        { name: 'Plants', href: '/plants' },
                        { name: 'Locations', href: '/locations' },
                        { name: 'Breeding', href: '/breeding' },
                        { name: 'Batches', href: '/batches' },
                        { name: 'Genetics', href: '/genetics' },
                      ].map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="px-3 py-1.5 text-sm text-[var(--bark)] hover:text-[var(--forest)] hover:bg-black/[0.04] rounded transition-colors"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Link
                      href="/batch-care"
                      className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--forest)] hover:bg-[var(--moss)] rounded transition-colors"
                    >
                      Batch Care
                    </Link>
                  </div>
                </div>
              </div>
            </nav>

            {/* Main Content - no top padding on mobile */}
            <main className="pb-16 sm:pt-12 sm:pb-0">{children}</main>

            {/* Mobile Bottom Navigation - compact */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/[0.08]">
              <div className="grid grid-cols-5 h-14">
                <Link href="/dashboard" className="flex flex-col items-center justify-center text-[var(--clay)] active:text-[var(--forest)]">
                  <Home className="w-5 h-5" />
                  <span className="text-[10px] mt-0.5">Home</span>
                </Link>
                <Link href="/plants" className="flex flex-col items-center justify-center text-[var(--clay)] active:text-[var(--forest)]">
                  <Trees className="w-5 h-5" />
                  <span className="text-[10px] mt-0.5">Plants</span>
                </Link>
                <Link href="/batch-care" className="flex flex-col items-center justify-center text-[var(--clay)] active:text-[var(--forest)]">
                  <Droplets className="w-5 h-5" />
                  <span className="text-[10px] mt-0.5">Care</span>
                </Link>
                <Link href="/locations" className="flex flex-col items-center justify-center text-[var(--clay)] active:text-[var(--forest)]">
                  <MapPin className="w-5 h-5" />
                  <span className="text-[10px] mt-0.5">Locations</span>
                </Link>
                <Link href="/genetics" className="flex flex-col items-center justify-center text-[var(--clay)] active:text-[var(--forest)]">
                  <Dna className="w-5 h-5" />
                  <span className="text-[10px] mt-0.5">Genetics</span>
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
