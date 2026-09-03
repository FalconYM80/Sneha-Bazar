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

export interface CustomerInfo {
  name: string;
  phone: string;
}

export interface Order {
  _id: string;

  orderNumber: string;

  customer: CustomerInfo | string;

  items: OrderItem[];

  totalAmount: number;
  totalItemCount: number;

  preparationMinutes: number;
  estimatedPickupTime: string;

  status: OrderStatus;

  createdAt: string;
  updatedAt: string;
}

// ==================== API RESPONSE ====================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}