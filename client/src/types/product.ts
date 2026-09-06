// Backend types (exact structure from backend)
export interface BackendCategory {
  _id: string
  name: string
  description?: string
  image?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BackendProduct {
  _id: string
  itemCode?: string
  name: string
  company?: string
  category: BackendCategory
  sellingPrice: number
  mrp?: number
  stockQuantity: number
  unit?: string
  image?: string
  imagePublicId?: string
  isAvailable: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Frontend-compatible types (what the UI expects)
export interface FrontendCategory {
  id: string
  name: string
  emoji?: string
  bg?: string
}

export interface FrontendProduct {
  id: string
  name: string
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

// Category color mapping for UI (emoji and background colors)
const CATEGORY_EMOJIS: Record<string, string> = {
  'fruits': '🥦',
  'vegetables': '🥦',
  'fruit': '🍎',
  'vegetable': '🥬',
  'dairy': '🥛',
  'milk': '🥛',
  'snacks': '🍿',
  'beverages': '🧃',
  'household': '🧹',
  'staples': '🌾',
  'rice': '🌾',
  ' atta': '🌾',
  'default': '🛒',
}

const CATEGORY_COLORS: Record<string, string> = {
  'fruits': '#dcfce7',
  'vegetables': '#dcfce7',
  'fruit': '#dcfce7',
  'vegetable': '#dcfce7',
  'dairy': '#fef9c3',
  'milk': '#fef9c3',
  'snacks': '#fce7f3',
  'beverages': '#dbeafe',
  'household': '#ede9fe',
  'staples': '#ffedd5',
  'rice': '#ffedd5',
  'atta': '#ffedd5',
  'default': '#f3f4f6',
}

// Adapter functions to map backend data to frontend format
export const adaptCategory = (backendCategory: BackendCategory): FrontendCategory => {
  const lowerName = backendCategory.name.toLowerCase()
  
  // Find matching emoji
  let emoji = CATEGORY_EMOJIS.default
  for (const key of Object.keys(CATEGORY_EMOJIS)) {
    if (lowerName.includes(key)) {
      emoji = CATEGORY_EMOJIS[key]
      break
    }
  }
  
  // Find matching background color
  let bg = CATEGORY_COLORS.default
  for (const key of Object.keys(CATEGORY_COLORS)) {
    if (lowerName.includes(key)) {
      bg = CATEGORY_COLORS[key]
      break
    }
  }
  
  return {
    id: backendCategory._id,
    name: backendCategory.name,
    emoji,
    bg,
  }
}

export const adaptProduct = (backendProduct: BackendProduct): FrontendProduct => {
  return {
    id: backendProduct._id,
    name: backendProduct.name,
    price: backendProduct.sellingPrice,
    originalPrice: backendProduct.mrp && backendProduct.mrp > backendProduct.sellingPrice 
      ? backendProduct.mrp 
      : undefined,
    unit: backendProduct.unit,
    category: typeof backendProduct.category === 'object' && backendProduct.category
      ? backendProduct.category._id
      : backendProduct.category || '',
    image: backendProduct.image || '/placeholder-product.svg',
    description: backendProduct.company ? `${backendProduct.company} - ${backendProduct.name}` : backendProduct.name,
    rating: 4.5, // UI-only fallback
    reviews: 100, // UI-only fallback
    stockQuantity: backendProduct.stockQuantity,
    isAvailable: backendProduct.isAvailable,
  }
}

export const getDiscountPercentage = (backendProduct: BackendProduct): number => {
  if (!backendProduct.mrp || backendProduct.mrp <= backendProduct.sellingPrice) {
    return 0
  }
  return Math.round((1 - backendProduct.sellingPrice / backendProduct.mrp) * 100)
}