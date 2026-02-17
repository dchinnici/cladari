import Link from 'next/link'
import { Home, Trees, Droplets, MapPin, GitBranch } from 'lucide-react'
import UserMenu, { UserMenuMobile } from '@/components/UserMenu'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Desktop nav - hidden on mobile */}
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
                  { name: 'Breed', href: '/breeding' },
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

            <div className="flex items-center gap-3">
              <Link
                href="/batch-care"
                className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--forest)] hover:bg-[var(--moss)] rounded transition-colors"
              >
                Batch Care
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - no top padding on mobile */}
      <main className="pb-16 sm:pt-12 sm:pb-0">{children}</main>

      {/* Mobile Bottom Navigation - compact with safe area */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/[0.08] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-6 h-14">
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
          <Link href="/breeding" className="flex flex-col items-center justify-center text-[var(--clay)] active:text-[var(--forest)]">
            <GitBranch className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Breed</span>
          </Link>
          <UserMenuMobile />
        </div>
      </nav>
    </>
  )
}
