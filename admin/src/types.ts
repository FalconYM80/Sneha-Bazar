export type Page = "dashboard" | "inventory" | "orders" | "purchases" | "settings";
export type OrderStatus = "Pending" | "Preparing" | "Ready for Pickup" | "Picked Up";
export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

export interface OrderItem {
  name: string;
  qty: number;
  unit: string;
  price: number;
}

export interface Order {
  id: string;
  customer: string;
  phone: string;
  items: OrderItem[];
  orderTime: string;
  pickupTime: string;
  status: OrderStatus;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  stockUnit: string;
  status: StockStatus;
  emoji: string;
}

export interface Purchase {
  id: string;
  date: string;
  product: string;
  qty: number;
  unit: string;
  supplier: string;
  cost: number;
  notes?: string;
}
