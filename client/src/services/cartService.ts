import { apiService } from './api'
import type { Cart } from '../types/cart'

export const cartService = {
  async getCart(): Promise<Cart> {
    return apiService.get<Cart>('/cart')
  },

  async addToCart(productId: string, quantity: number = 1): Promise<Cart> {
    return apiService.post<Cart>('/cart/items', {
      product: productId,
      quantity,
    })
  },

  async updateCartItem(productId: string, quantity: number): Promise<Cart> {
    return apiService.put<Cart>(`/cart/items/${productId}`, {
      quantity,
    })
  },

  async removeFromCart(productId: string): Promise<Cart> {
    return apiService.delete<Cart>(`/cart/items/${productId}`)
  },

  async clearCart(): Promise<Cart> {
    return apiService.delete<Cart>('/cart')
  },
}
