export interface Product {
  id: string
  name: string
  company?: string
  price: number
  originalPrice?: number
  unit?: string
  category: string
  image: string
  description?: string
  rating?: number
  reviews?: number
  stockQuantity: number
  isAvailable: boolean
}

export interface PlacedOrder {
  id: string
  orderNumber: string
  items: any[] // Using any to avoid circular dependency with CartItem
  total: number
  date: string
  createdAt?: string
  status: string
  preparationMinutes: number
  estimatedPickupTime: string
}

export type Screen =
  | 'splash' | 'login' | 'register' | 'forgot-password' | 'reset-password'
  | 'home' | 'product-list' | 'product-detail' | 'cart' | 'checkout'
  | 'order-confirm' | 'order-tracking' | 'orders' | 'profile'

export type BottomTab = 'home' | 'categories' | 'cart' | 'orders' | 'profile'
