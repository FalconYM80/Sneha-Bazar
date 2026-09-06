import type { BackendProduct, FrontendProduct } from './product'
import { adaptProduct } from './product'
import type { Product } from './app'

// Backend cart item structure
export interface CartItem {
  product: BackendProduct | null
  quantity: number
  _id?: string
}

// Frontend-friendly cart item structure for UI components
export interface FrontendCartItem {
  product: Product
  qty: number
}

export interface Cart {
  _id?: string
  customer: string
  items: CartItem[]
  createdAt?: string
  updatedAt?: string
}

// Helper function to safely adapt backend cart items to frontend format
export const adaptCartItem = (
  item: CartItem
): { product: FrontendProduct; quantity: number } | null => {
  if (!item?.product || typeof item.product !== 'object') {
    console.warn('Invalid cart item - missing product:', item)
    return null
  }

  try {
    return {
      product: adaptProduct(item.product),
      quantity: item.quantity,
    }
  } catch (error) {
    console.warn('Failed to adapt cart product:', item.product, error)
    return null
  }
}
