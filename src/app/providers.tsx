'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,  // 30 seconds - data fresh enough for instant back-nav
        gcTime: 5 * 60 * 1000,  // 5 minutes - cache retained in memory for navigation
        refetchOnWindowFocus: false,  // Don't refetch on window focus (use visibilitychange instead)
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}