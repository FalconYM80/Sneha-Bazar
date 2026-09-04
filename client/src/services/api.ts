const API_BASE_URL = 'http://localhost:5000/api'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

interface ApiError {
  success: false
  message: string
  error?: string
}

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('customerToken')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      const data: ApiResponse<T> | ApiError = await response.json()

      if (!response.ok) {
        throw new Error(
          (data as ApiError).message || 
          (data as ApiError).error || 
          `Request failed with status ${response.status}`
        )
      }

      if (!(data as ApiResponse<T>).success) {
        throw new Error((data as ApiError).message || 'Request failed')
      }

      return (data as ApiResponse<T>).data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred')
    }
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    })
  }
}

export const apiService = new ApiService()