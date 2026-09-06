import { apiService } from './api'
import type { BackendOrder } from '../types/order'

export const orderService = {
  /**
   * Checkout - creates an order from the customer's cart
   * Backend validates products, calculates totals, creates order, and clears cart
   */
  async checkout(): Promise<BackendOrder> {
    return apiService.post<BackendOrder>('/orders/checkout', {})
  },

  /**
   * Get all orders for the current authenticated customer
   * Returns orders sorted by creation date (newest first)
   */
  async getMyOrders(): Promise<BackendOrder[]> {
    return apiService.get<BackendOrder[]>('/orders/my-orders')
  },

  /**
   * Get a single order by ID
   * Useful for order tracking screen
   */
  async getOrderById(id: string): Promise<BackendOrder> {
    return apiService.get<BackendOrder>(`/orders/${id}`)
  },
}
