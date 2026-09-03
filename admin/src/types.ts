export type Page =
  | "dashboard"
  | "inventory"
  | "orders"
  | "purchases"
  | "settings";

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

// ==================== UI TYPES ====================

export interface UIProduct {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  price: number;
  unit: string;
  stock: number;
  stockUnit: string;
  status: StockStatus;
  emoji: string;
}

// ==================== API TYPES ====================

export interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  itemCode: string;
  name: string;
  company?: string;

  category: Category | string;

  sellingPrice: number;
  mrp?: number;

  stockQuantity: number;
  unit: string;

  image?: string;

  isAvailable: boolean;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  _id: string;

  product: Product | string;

  purchaseAmount: number;
  mrp?: number;

  purchaseDate: string;

  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export interface OrderItem {
  product: Product | string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  _id: string;

  orderNumber: string;

  customerName: string;
  customerPhone: string;

  items: OrderItem[];

  totalAmount: number;
  totalItemCount: number;

  preparationMinutes: number;
  estimatedPickupTime: string;

  status: OrderStatus;

  createdAt: string;
  updatedAt: string;
}

// UI-specific order type for frontend display
export interface UIOrder {
  id: string;          // MongoDB _id - used for API calls
  orderNumber: string; // Human-readable order number (e.g. SB-1) - used for display
  customer: string;
  phone: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
  orderTime: string;
  pickupTime: string;
  status: "Pending" | "Preparing" | "Ready for Pickup" | "Picked Up" | "Cancelled";
}

// Backend order status to UI status mapping
export const mapOrderStatus = (status: OrderStatus): UIOrder["status"] => {
  const statusMap: Record<OrderStatus, UIOrder["status"]> = {
    "pending": "Pending",
    "confirmed": "Pending", // Treat confirmed as pending for UI flow
    "preparing": "Preparing",
    "ready": "Ready for Pickup",
    "completed": "Picked Up",
    "cancelled": "Cancelled",
  };
  return statusMap[status] || "Pending";
};

// UI status to backend status mapping
export const mapUIOrderStatus = (status: UIOrder["status"]): OrderStatus => {
  const statusMap: Record<UIOrder["status"], OrderStatus> = {
    "Pending": "pending",
    "Preparing": "preparing",
    "Ready for Pickup": "ready",
    "Picked Up": "completed",
    "Cancelled": "cancelled",
  };
  return statusMap[status] || "pending";
};

// Helper function to format dates/times
const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch {
    return dateString;
  }
};

// Map backend Order to UIOrder
export const mapOrder = (order: Order): UIOrder => {
  return {
    id: order._id,
    orderNumber: order.orderNumber,
    customer: order.customerName,
    phone: order.customerPhone,
    items: order.items.map(item => ({
      name: item.productName,
      qty: item.quantity,
      price: item.price,
    })),
    orderTime: formatTime(order.createdAt),
    pickupTime: formatTime(order.estimatedPickupTime),
    status: mapOrderStatus(order.status),
  };
};

// ==================== API RESPONSE ====================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}