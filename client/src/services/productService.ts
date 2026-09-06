import { apiService } from './api'
import type { BackendProduct } from '../types/product'

export const productService = {
  async getProducts(categoryId?: string, search?: string): Promise<BackendProduct[]> {
    const params = new URLSearchParams()
    if (categoryId) params.append('category', categoryId)
    if (search) params.append('search', search)
    
    const queryString = params.toString()
    const endpoint = queryString ? `/products?${queryString}` : '/products'
    
    return apiService.get<BackendProduct[]>(endpoint)
  },

  async getProductById(id: string): Promise<BackendProduct> {
    return apiService.get<BackendProduct>(`/products/${id}`)
  },
}