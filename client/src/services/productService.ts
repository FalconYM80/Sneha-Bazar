import { apiService } from './api'
import type { BackendProduct } from '../types/product'

export interface PaginatedProductsResponse {
  data: BackendProduct[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export const productService = {
  async getProducts(
    categoryId?: string,
    search?: string,
    page: number = 1,
    limit: number = 12
  ): Promise<BackendProduct[]> {
    const params = new URLSearchParams()
    const cleanSearch = search?.trim()
    if (cleanSearch) {
      params.append('search', cleanSearch)
    } else if (categoryId) {
      params.append('category', categoryId)
    }
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    const endpoint = `/products?${params.toString()}`

    const response = await apiService.get<PaginatedProductsResponse | BackendProduct[]>(endpoint)

    // Handle both paginated and legacy responses
    if (Array.isArray(response)) {
      return response
    }

    // It's a paginated response
    return response.data
  },

  async getProductsPaginated(
    categoryId?: string,
    search?: string,
    page: number = 1,
    limit: number = 12
  ): Promise<PaginatedProductsResponse> {
    const params = new URLSearchParams()
    const cleanSearch = search?.trim()
    if (cleanSearch) {
      params.append('search', cleanSearch)
    } else if (categoryId) {
      params.append('category', categoryId)
    }
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    const endpoint = `/products?${params.toString()}`

    const response = await apiService.getWithPagination<BackendProduct[]>(endpoint)

    // Handle both paginated and legacy responses
    if (Array.isArray(response)) {
      // Legacy response - convert to paginated format
      return {
        data: response,
        pagination: {
          page: 1,
          limit: response.length,
          total: response.length,
          totalPages: 1,
          hasMore: false,
        },
      }
    }

    // Response is from getWithPagination with pagination metadata
    return {
      data: response.data,
      pagination: response.pagination
    }
  },

  async getProductById(id: string): Promise<BackendProduct> {
    return apiService.get<BackendProduct>(`/products/${id}`)
  },
}