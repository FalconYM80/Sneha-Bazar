import { apiService } from './api'
import type { BackendCategory } from '../types/product'

export interface BackendCategoryWithThumbnail extends BackendCategory {
  thumbnail?: string
}

export const categoryService = {
  async getCategories(): Promise<BackendCategory[]> {
    return apiService.get<BackendCategory[]>('/categories')
  },

  async getCategoriesWithThumbnails(): Promise<BackendCategoryWithThumbnail[]> {
    return apiService.get<BackendCategoryWithThumbnail[]>('/categories/with-thumbnails')
  },

  async getCategoryById(id: string): Promise<BackendCategory> {
    return apiService.get<BackendCategory>(`/categories/${id}`)
  },
}