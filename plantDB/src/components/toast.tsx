'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const toastStyles = {
  success: 'from-emerald-500 to-green-600',
  error: 'from-red-500 to-rose-600',
  warning: 'from-amber-500 to-orange-600',
  info: 'from-blue-500 to-cyan-600',
}

export function ToastItem({ toast, onClose }: ToastProps) {
  const Icon = toastIcons[toast.type]

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onClose(toast.id)
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast, onClose])

  return (
    <div className="glass rounded-2xl p-4 min-w-[300px] max-w-md animate-slide-in">
      <div className="flex gap-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${toastStyles[toast.type]} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{toast.title}</h3>
          {toast.message && (
            <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handleToast = (event: CustomEvent<Toast>) => {
      setToasts(prev => [...prev, event.detail])
    }

    window.addEventListener('toast' as any, handleToast)
    return () => window.removeEventListener('toast' as any, handleToast)
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  )
}

export function showToast(options: Omit<Toast, 'id'>) {
  const toast: Toast = {
    ...options,
    id: Math.random().toString(36).substr(2, 9),
    duration: options.duration ?? 5000,
  }

  window.dispatchEvent(new CustomEvent('toast', { detail: toast }))
}