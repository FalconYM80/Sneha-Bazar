// Backend types (exact structure from backend)
export interface BackendCategory {
  _id: string
  name: string
  description?: string
  image?: string
  thumbnail?: string
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
  image?: string // Actual category image from backend
  thumbnail?: string // Product image derived as thumbnail
  accentColor?: string
  fallbackColor?: string
  description?: string
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

// Adapter functions to map backend data to frontend format
export const adaptCategory = (backendCategory: BackendCategory): FrontendCategory => {
  return {
    id: backendCategory._id,
    name: backendCategory.name,
    image: backendCategory.image, // Use actual category image from backend
    thumbnail: backendCategory.thumbnail, // Use product image as thumbnail
    accentColor: undefined, // Will be set dynamically
    fallbackColor: undefined, // Will be set dynamically
    description: backendCategory.description,
  }
}



// Function to get category accent color based on category name
export const getCategoryAccentColor = (categoryName: string): string => {
  const lowerName = categoryName.toLowerCase()
  
  const colorMap: Record<string, string> = {
    'dairy': '#E3F2FD',
    'milk': '#E3F2FD',
    'curd': '#E3F2FD',
    'beverages': '#E0F7FA',
    'drink': '#E0F7FA',
    'juice': '#E0F7FA',
    'biscuit': '#FFF8E1',
    'bakery': '#FFF8E1',
    'bread': '#FFF8E1',
    'chocolate': '#FCE4EC',
    'confectionery': '#FCE4EC',
    'candy': '#FCE4EC',
    'cleaning': '#F3E5F5',
    'laundry': '#F3E5F5',
    'household': '#F3E5F5',
    'personal': '#FCE4EC',
    'care': '#FCE4EC',
    'beauty': '#FCE4EC',
    'baby': '#E8F5E9',
    'pet': '#E8F5E9',
    'staples': '#FFF3E0',
    'rice': '#FFF3E0',
    'atta': '#FFF3E0',
    'dal': '#E8F5E9',
    'pulse': '#E8F5E9',
    'lentil': '#E8F5E9',
    'dry fruit': '#FFF8E1',
    'nut': '#FFF8E1',
    'almond': '#FFF8E1',
    'kitchen': '#FFCCBC',
    'utensil': '#FFCCBC',
    'cook': '#FFCCBC',
    'oil': '#FFE0B2',
    'ghee': '#FFE0B2',
    'electronic': '#ECEFF1',
    'gadget': '#ECEFF1',
    'ice cream': '#F8BBD0',
    'frozen': '#F8BBD0',
    'pooja': '#FFF9C4',
    'religious': '#FFF9C4',
    'spiritual': '#FFF9C4',
    'fruits': '#E8F5E9',
    'fruit': '#E8F5E9',
    'vegetables': '#E8F5E9',
    'vegetable': '#E8F5E9',
    'snacks': '#F3E5F5',
    'oral': '#E1F5FE',
    'tooth': '#E1F5FE',
    'dental': '#E1F5FE',
  }
  
  for (const key of Object.keys(colorMap)) {
    if (lowerName.includes(key)) {
      return colorMap[key]
    }
  }
  
  return '#F5F5F5' // Default neutral gray
}

// Function to get category fallback color
export const getCategoryFallbackColor = (categoryName: string): string => {
  const accentColor = getCategoryAccentColor(categoryName)
  // Return a slightly lighter version of the accent color
  return accentColor + '20' // Add transparency for lighter version
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