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
