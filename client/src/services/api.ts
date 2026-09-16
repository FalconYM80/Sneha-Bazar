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

      return (data as ApiResponse<T>).data !== undefined 
        ? (data as ApiResponse<T>).data 
        : (data as unknown as T)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred')
    }
  }

  private async requestWithPagination<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean } }> {
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
      const data: any = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 
          data.error || 
          `Request failed with status ${response.status}`
        )
      }

      if (!data.success) {
        throw new Error(data.message || 'Request failed')
      }

      return {
        data: data.data,
        pagination: data.pagination || {
          page: 1,
          limit: Array.isArray(data.data) ? data.data.length : 0,
          total: Array.isArray(data.data) ? data.data.length : 0,
          totalPages: 1,
          hasMore: false
        }
      }
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

  async getWithPagination<T>(endpoint: string): Promise<{ data: T; pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean } }> {
    return this.requestWithPagination<T>(endpoint, {
      method: 'GET',
    })
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }
}

export const apiService = new ApiService()