import { apiService } from './api'
import type { BackendCategory } from '../types/product'

export const categoryService = {
  async getCategories(): Promise<BackendCategory[]> {
    return apiService.get<BackendCategory[]>('/categories')
  },

  async getCategoryById(id: string): Promise<BackendCategory> {
    return apiService.get<BackendCategory>(`/categories/${id}`)
  },
}