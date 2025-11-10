'use client'

import { useEffect } from 'react'

export default function ServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('Service Worker registered:', registration)

            // Check for updates every hour
            setInterval(() => {
              registration.update()
            }, 1000 * 60 * 60)
          },
          (error) => {
            console.log('Service Worker registration failed:', error)
          }
        )
      })
    }

    // Add iOS install prompt
    if ('standalone' in navigator && !(navigator as any).standalone) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      if (isIOS) {
        const hasPrompted = localStorage.getItem('iosInstallPrompted')
        if (!hasPrompted) {
          setTimeout(() => {
            const install = confirm('Add Cladari to your home screen for quick access while caring for plants')
            if (install) {
              localStorage.setItem('iosInstallPrompted', 'true')
            }
          }, 30000) // Show after 30 seconds
        }
      }
    }
  }, [])

  return null
}