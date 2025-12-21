export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiResponse<T = any> {
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  success: boolean
}

export function handleApiError(error: any): ApiResponse {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
    }
  }

  if (error.response) {
    return {
      success: false,
      error: {
        message: error.response.data?.message || 'Server error occurred',
        code: error.response.status?.toString(),
        details: error.response.data,
      },
    }
  }

  if (error.request) {
    return {
      success: false,
      error: {
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
      },
    }
  }

  return {
    success: false,
    error: {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    },
  }
}

export async function apiCall<T>(
  fn: () => Promise<T>,
  options?: {
    retries?: number
    retryDelay?: number
    onRetry?: (attempt: number, error: any) => void
  }
): Promise<ApiResponse<T>> {
  const { retries = 3, retryDelay = 1000, onRetry } = options || {}

  let lastError: any

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const data = await fn()
      return { success: true, data }
    } catch (error) {
      lastError = error

      if (attempt < retries) {
        onRetry?.(attempt, error)
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
      }
    }
  }

  return handleApiError(lastError)
}