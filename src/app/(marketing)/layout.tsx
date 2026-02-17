// Prevent static prerendering — the landing page checks auth state client-side
export const dynamic = 'force-dynamic'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
