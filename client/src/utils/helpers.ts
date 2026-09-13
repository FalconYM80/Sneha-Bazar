export const calculatePickupTime = (totalQuantity: number): string => {
  if (totalQuantity <= 5) return '10 minutes'
  if (totalQuantity <= 15) return '20 minutes'
  if (totalQuantity <= 30) return '30 minutes'
  return '45 minutes'
}

export const isValidScreen = (value: string): value is string => {
  const validScreens = [
    'splash', 'login', 'register', 'home', 'product-list',
    'product-detail', 'cart', 'checkout', 'order-confirm',
    'order-tracking', 'orders', 'profile'
  ]
  return validScreens.includes(value)
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
