// Backend types (exact structure from backend)
export interface BackendOrderItem {
  product: {
    _id: string
    name: string
    itemCode?: string
    company?: string
  }
  productName: string
  quantity: number
  price: number
  subtotal: number
}

export interface BackendOrder {
  _id: string
  orderNumber: string
  customer: {
    _id: string
    name: string
    phone: string
    email?: string
  }
  customerName: string
  customerPhone: string
  items: BackendOrderItem[]
  totalAmount: number
  totalItemCount: number
  preparationMinutes: number
  estimatedPickupTime: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

// Frontend-compatible types (what the UI expects)
export interface FrontendOrderItem {
  product: {
    id: string
    name: string
    image: string
  }
  quantity: number
  price: number
  subtotal: number
}

export interface FrontendOrder {
  id: string
  orderNumber: string
  items: FrontendOrderItem[]
  totalAmount: number
  totalItemCount: number
  preparationMinutes: number
  estimatedPickupTime: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  createdAt: string
  formattedDate: string
}

// Adapter function to map backend order to frontend format
export const adaptOrder = (backendOrder: BackendOrder): FrontendOrder => {
  return {
    id: backendOrder._id,
    orderNumber: backendOrder.orderNumber,
    items: backendOrder.items.map(item => ({
      product: {
        id: item.product._id,
        name: item.productName,
        image: '/placeholder-product.svg', // Backend doesn't provide image in order items
      },
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
    totalAmount: backendOrder.totalAmount,
    totalItemCount: backendOrder.totalItemCount,
    preparationMinutes: backendOrder.preparationMinutes,
    estimatedPickupTime: backendOrder.estimatedPickupTime,
    status: backendOrder.status,
    createdAt: backendOrder.createdAt,
    formattedDate: new Date(backendOrder.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  }
}

// Helper function to format pickup time from preparation minutes
export const formatPickupTime = (minutes: number): string => {
  if (minutes <= 0) return 'Ready soon'
  return `${minutes} minutes`
}

// Helper function to format order status for display
export const formatOrderStatus = (status: BackendOrder['status']): string => {
  const statusMap: Record<BackendOrder['status'], string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return statusMap[status] || status
}

// Helper function to get status color class
export const getStatusColorClass = (status: BackendOrder['status']): string => {
  const colorMap: Record<BackendOrder['status'], string> = {
    pending: 'bg-gray-100 text-gray-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-yellow-100 text-yellow-700',
    ready: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-700'
}
