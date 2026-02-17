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

  }, [])

  return null
}