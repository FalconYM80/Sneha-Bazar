import type { Order, Product, Purchase } from "./types";

export const PRODUCTS: Product[] = [
  { id: "P001", name: "Aashirvaad Atta (10kg)", category: "Staples", price: 340, unit: "bag", stock: 42, stockUnit: "bags", status: "In Stock", emoji: "🌾" },
  { id: "P002", name: "Tata Salt (1kg)", category: "Essentials", price: 22, unit: "pack", stock: 4, stockUnit: "packs", status: "Low Stock", emoji: "🧂" },
  { id: "P003", name: "Sunflower Oil (1L)", category: "Oils", price: 135, unit: "bottle", stock: 5, stockUnit: "bottles", status: "Low Stock", emoji: "🫙" },
  { id: "P004", name: "Toor Dal (1kg)", category: "Pulses", price: 148, unit: "kg", stock: 28, stockUnit: "kg", status: "In Stock", emoji: "🫘" },
  { id: "P005", name: "Amul Butter (500g)", category: "Dairy", price: 260, unit: "pack", stock: 7, stockUnit: "packs", status: "Low Stock", emoji: "🧈" },
  { id: "P006", name: "Basmati Rice (5kg)", category: "Staples", price: 420, unit: "bag", stock: 0, stockUnit: "bags", status: "Out of Stock", emoji: "🍚" },
  { id: "P007", name: "Red Chilli Powder (200g)", category: "Spices", price: 62, unit: "pack", stock: 31, stockUnit: "packs", status: "In Stock", emoji: "🌶️" },
  { id: "P008", name: "Moong Dal (500g)", category: "Pulses", price: 74, unit: "pack", stock: 19, stockUnit: "packs", status: "In Stock", emoji: "🫘" },
  { id: "P009", name: "Parle-G Biscuit (800g)", category: "Snacks", price: 50, unit: "pack", stock: 3, stockUnit: "packs", status: "Low Stock", emoji: "🍪" },
  { id: "P010", name: "Amul Full Cream Milk (1L)", category: "Dairy", price: 66, unit: "packet", stock: 24, stockUnit: "packets", status: "In Stock", emoji: "🥛" },
  { id: "P011", name: "Colgate Toothpaste (200g)", category: "Personal Care", price: 115, unit: "tube", stock: 18, stockUnit: "tubes", status: "In Stock", emoji: "🪥" },
  { id: "P012", name: "Dettol Soap (125g)", category: "Personal Care", price: 60, unit: "bar", stock: 6, stockUnit: "bars", status: "Low Stock", emoji: "🧼" },
];

export const ORDERS: Order[] = [
  {
    id: "#SB-1082", customer: "Priya Sharma", phone: "98765 43210",
    items: [
      { name: "Aashirvaad Atta (10kg)", qty: 1, unit: "bag", price: 340 },
      { name: "Toor Dal (1kg)", qty: 2, unit: "kg", price: 296 },
      { name: "Sunflower Oil (1L)", qty: 2, unit: "bottles", price: 270 },
      { name: "Tata Salt (1kg)", qty: 2, unit: "packs", price: 44 },
      { name: "Amul Full Cream Milk (1L)", qty: 4, unit: "packets", price: 264 },
    ],
    orderTime: "09:15 AM", pickupTime: "11:30 AM", status: "Ready for Pickup",
  },
  {
    id: "#SB-1081", customer: "Rajesh Kumar", phone: "87654 32109",
    items: [
      { name: "Basmati Rice (5kg)", qty: 1, unit: "bag", price: 420 },
      { name: "Red Chilli Powder (200g)", qty: 2, unit: "packs", price: 124 },
      { name: "Moong Dal (500g)", qty: 1, unit: "pack", price: 74 },
    ],
    orderTime: "09:42 AM", pickupTime: "11:00 AM", status: "Preparing",
  },
  {
    id: "#SB-1080", customer: "Ananya Patel", phone: "76543 21098",
    items: [
      { name: "Aashirvaad Atta (10kg)", qty: 2, unit: "bags", price: 680 },
      { name: "Toor Dal (1kg)", qty: 5, unit: "kg", price: 740 },
      { name: "Sunflower Oil (1L)", qty: 3, unit: "bottles", price: 405 },
      { name: "Amul Butter (500g)", qty: 1, unit: "pack", price: 260 },
      { name: "Tata Salt (1kg)", qty: 2, unit: "packs", price: 44 },
      { name: "Amul Full Cream Milk (1L)", qty: 6, unit: "packets", price: 396 },
    ],
    orderTime: "08:55 AM", pickupTime: "10:30 AM", status: "Picked Up",
  },
  {
    id: "#SB-1079", customer: "Suresh Nair", phone: "65432 10987",
    items: [
      { name: "Red Chilli Powder (200g)", qty: 1, unit: "pack", price: 62 },
      { name: "Moong Dal (500g)", qty: 2, unit: "packs", price: 148 },
    ],
    orderTime: "10:02 AM", pickupTime: "12:00 PM", status: "Pending",
  },
  {
    id: "#SB-1078", customer: "Deepa Menon", phone: "54321 09876",
    items: [
      { name: "Aashirvaad Atta (10kg)", qty: 1, unit: "bag", price: 340 },
      { name: "Sunflower Oil (1L)", qty: 2, unit: "bottles", price: 270 },
      { name: "Toor Dal (1kg)", qty: 1, unit: "kg", price: 148 },
      { name: "Tata Salt (1kg)", qty: 2, unit: "packs", price: 44 },
      { name: "Parle-G Biscuit (800g)", qty: 1, unit: "pack", price: 50 },
    ],
    orderTime: "10:28 AM", pickupTime: "01:00 PM", status: "Pending",
  },
  {
    id: "#SB-1077", customer: "Karthik Iyer", phone: "43210 98765",
    items: [
      { name: "Basmati Rice (5kg)", qty: 2, unit: "bags", price: 840 },
      { name: "Amul Full Cream Milk (1L)", qty: 6, unit: "packets", price: 396 },
    ],
    orderTime: "08:10 AM", pickupTime: "09:30 AM", status: "Picked Up",
  },
  {
    id: "#SB-1076", customer: "Meena Krishnan", phone: "32109 87654",
    items: [
      { name: "Toor Dal (1kg)", qty: 3, unit: "kg", price: 444 },
      { name: "Red Chilli Powder (200g)", qty: 2, unit: "packs", price: 124 },
      { name: "Amul Butter (500g)", qty: 2, unit: "packs", price: 520 },
    ],
    orderTime: "07:45 AM", pickupTime: "09:00 AM", status: "Picked Up",
  },
];

export const PURCHASES: Purchase[] = [
  { id: "PO-0047", date: "02 Sep 2026", product: "Aashirvaad Atta (10kg)", qty: 20, unit: "bags", supplier: "Ravi Wholesale", cost: 5800 },
  { id: "PO-0046", date: "01 Sep 2026", product: "Toor Dal (1kg)", qty: 50, unit: "kg", supplier: "Mohan Distributors", cost: 6200 },
  { id: "PO-0045", date: "01 Sep 2026", product: "Sunflower Oil (1L)", qty: 30, unit: "bottles", supplier: "Lakshmi Traders", cost: 3450 },
  { id: "PO-0044", date: "31 Aug 2026", product: "Amul Full Cream Milk (1L)", qty: 100, unit: "packets", supplier: "Amul Depot", cost: 5800 },
  { id: "PO-0043", date: "30 Aug 2026", product: "Tata Salt (1kg)", qty: 80, unit: "packs", supplier: "Ravi Wholesale", cost: 1440 },
  { id: "PO-0042", date: "29 Aug 2026", product: "Basmati Rice (5kg)", qty: 15, unit: "bags", supplier: "Mohan Distributors", cost: 4500 },
  { id: "PO-0041", date: "28 Aug 2026", product: "Red Chilli Powder (200g)", qty: 40, unit: "packs", supplier: "Spice Hub", cost: 2000 },
];

export const WEEKLY_SALES = [
  { day: "Mon", revenue: 8240, orders: 14 },
  { day: "Tue", revenue: 11580, orders: 19 },
  { day: "Wed", revenue: 9720, orders: 16 },
  { day: "Thu", revenue: 14350, orders: 23 },
  { day: "Fri", revenue: 16900, orders: 28 },
  { day: "Sat", revenue: 19450, orders: 32 },
  { day: "Sun", revenue: 12450, orders: 24 },
];
