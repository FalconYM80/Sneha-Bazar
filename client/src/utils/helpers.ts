import type { Screen } from '../types/app'

export const calculatePickupMinutes = (totalItems: number): number => {
  if (totalItems <= 6) return 15
  if (totalItems <= 10) return 25
  if (totalItems <= 15) return 35
  if (totalItems <= 20) return 45
  if (totalItems <= 30) return 60
  if (totalItems <= 40) return 75
  if (totalItems <= 50) return 90
  if (totalItems <= 75) return 105
  if (totalItems <= 100) return 120
  return 150
}

export const calculatePickupTime = (totalQuantity: number): string => {
  return `${calculatePickupMinutes(totalQuantity)} minutes`
}

export const isValidScreen = (value: string): value is string => {
  const validScreens = [
    'splash', 'login', 'register', 'forgot-password', 'reset-password',
    'home', 'product-list', 'product-detail', 'cart', 'checkout',
    'order-confirm', 'order-tracking', 'orders', 'profile'
  ]
  return validScreens.includes(value)
}

/**
 * Maps an internal Screen state to an authoritative SPA URL path
 */
export const screenToPath = (screen: Screen, productId?: string): string => {
  switch (screen) {
    case 'home':
      return '/'
    case 'product-list':
      return '/browse'
    case 'product-detail':
      return productId ? `/product/${productId}` : '/browse'
    case 'cart':
      return '/cart'
    case 'checkout':
      return '/checkout'
    case 'orders':
      return '/orders'
    case 'order-tracking':
      return '/orders/track'
    case 'order-confirm':
      return '/order-confirm'
    case 'profile':
      return '/profile'
    case 'login':
      return '/login'
    case 'register':
      return '/register'
    case 'forgot-password':
      return '/forgot-password'
    case 'reset-password':
      return '/reset-password'
    default:
      return '/'
  }
}

/**
 * Resolves a browser URL pathname into an internal Screen state and optional product ID
 */
export const pathToScreen = (pathname: string): { screen: Screen; productId?: string } => {
  const cleanPath = pathname.replace(/\/+$/, '') || '/'

  if (cleanPath === '/' || cleanPath === '/home') {
    return { screen: 'home' }
  }
  if (cleanPath === '/browse' || cleanPath === '/products' || cleanPath === '/categories') {
    return { screen: 'product-list' }
  }
  if (cleanPath.startsWith('/product/')) {
    const id = cleanPath.replace('/product/', '').split('/')[0]
    return { screen: 'product-detail', productId: id }
  }
  if (cleanPath === '/product' || cleanPath === '/product-detail') {
    return { screen: 'product-detail' }
  }
  if (cleanPath === '/cart') {
    return { screen: 'cart' }
  }
  if (cleanPath === '/checkout') {
    return { screen: 'checkout' }
  }
  if (cleanPath === '/orders') {
    return { screen: 'orders' }
  }
  if (cleanPath === '/orders/track' || cleanPath === '/order-tracking') {
    return { screen: 'order-tracking' }
  }
  if (cleanPath === '/order-confirm') {
    return { screen: 'order-confirm' }
  }
  if (cleanPath === '/profile') {
    return { screen: 'profile' }
  }
  if (cleanPath === '/login') {
    return { screen: 'login' }
  }
  if (cleanPath === '/register') {
    return { screen: 'register' }
  }
  if (cleanPath === '/forgot-password') {
    return { screen: 'forgot-password' }
  }
  if (cleanPath.startsWith('/reset-password')) {
    return { screen: 'reset-password' }
  }

  return { screen: 'home' }
}


/**
 * Fisher-Yates shuffle algorithm for unbiased array randomization
 * @param items - Array to shuffle
 * @returns New shuffled array (original array is not mutated)
 */
export const shuffleArray = <T>(items: T[]): T[] => {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Shuffle array with image prioritization
 * Products with valid images come first, then products without images
 * Both groups are shuffled independently
 * @param items - Array of items with optional image property
 * @param getImage - Function to extract image URL from item
 * @returns New shuffled array with image-bearing items first
 */
export const shuffleWithImagePriority = <T>(
  items: T[],
  getImage: (item: T) => string | undefined
): T[] => {
  const withImage: T[] = []
  const withoutImage: T[] = []

  for (const item of items) {
    const image = getImage(item)
    if (image && image.trim() !== '' && !isPlaceholderImage(image)) {
      withImage.push(item)
    } else {
      withoutImage.push(item)
    }
  }

  return [...shuffleArray(withImage), ...shuffleArray(withoutImage)]
}

/**
 * Check if an image URL is a placeholder
 */
const isPlaceholderImage = (image: string): boolean => {
  if (!image || image.trim() === '') return true
  const lowerImage = image.toLowerCase().trim()
  return lowerImage.includes('placeholder') || 
         lowerImage.includes('default-product') ||
         lowerImage === '/placeholder-product.svg' ||
         lowerImage === '/placeholder-product.png'
}
