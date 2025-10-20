'use client'

import { useState, useCallback } from 'react'
import { showToast } from '@/components/toast'

export interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  retries?: number
  retryDelay?: number
  showErrorToast?: boolean
  showSuccessToast?: boolean
  successMessage?: string
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    onSuccess,
    onError,
    retries = 3,
    retryDelay = 1000,
    showErrorToast = true,
    showSuccessToast = false,
    successMessage = 'Operation completed successfully'
  } = options

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setLoading(true)
      setError(null)
      let lastError: Error | null = null

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const result = await apiFunction(...args)
          setData(result)
          setLoading(false)

          if (showSuccessToast) {
            showToast({
              type: 'success',
              title: 'Success',
              message: successMessage
            })
          }

          onSuccess?.(result)
          return result
        } catch (err) {
          lastError = err as Error

          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
          }
        }
      }

      setError(lastError)
      setLoading(false)

      if (showErrorToast && lastError) {
        showToast({
          type: 'error',
          title: 'Error',
          message: lastError.message || 'An error occurred'
        })
      }

      onError?.(lastError!)
      return null
    },
    [apiFunction, onSuccess, onError, retries, retryDelay, showErrorToast, showSuccessToast, successMessage]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    error,
    loading,
    execute,
    reset
  }
}

export function useApiMutation<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
) {
  return useApi(apiFunction, { showSuccessToast: true, ...options })
}