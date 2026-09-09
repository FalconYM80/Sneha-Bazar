import type { Product } from '../types/app'
import type { FrontendCartItem } from '../types/cart'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
  cart: FrontendCartItem[]
  onAddToCart: (product: Product) => void
  onUpdateQuantity: (productId: string, delta: number) => void
  onProductClick: (product: Product) => void
}

export const ProductCard = ({ product, cart, onAddToCart, onUpdateQuantity, onProductClick }: ProductCardProps) => {
  const [imageError, setImageError] = useState(false)
  const cartItem = cart.find(i => i.product.id === product.id)
  const quantity = cartItem?.qty || 0
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0
  const isOutOfStock = !product.isAvailable || product.stockQuantity <= 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOutOfStock) {
      onAddToCart(product)
    }
  }

  const handleQuantityChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation()
    onUpdateQuantity(product.id, delta)
  }

  const getFallbackImage = () => {
    const categoryLower = product.category?.toLowerCase() || ''
    const fallbackColors: Record<string, string> = {
      'fruit': '#EEF2FF',
      'vegetable': '#EEF2FF',
      'dairy': '#FEF3C7',
      'snack': '#FCE7F3',
      'beverage': '#DBEAFE',
      'cleaning': '#EDE9FE',
      'rice': '#FFEDD5',
      'personal': '#FDF2F8',
      'baby': '#FEF3C7',
      'electronic': '#E0F2FE',
      'kitchen': '#EEF2FF',
      'default': '#F8FAFC'
    }

    let bgColor = fallbackColors.default
    for (const [key, color] of Object.entries(fallbackColors)) {
      if (categoryLower.includes(key)) {
        bgColor = color
        break
      }
    }

    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
    )
  }

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden border border-gray-100 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${isOutOfStock ? 'opacity-60' : ''}`}
      onClick={() => !isOutOfStock && onProductClick(product)}
    >
      <div className="relative h-40 overflow-hidden bg-gray-50">
        {imageError || !product.image ? (
          getFallbackImage()
        ) : (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        )}

        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
            {discount}% OFF
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-sm font-semibold px-3 py-1.5 bg-black/70 rounded-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-gray-900 text-sm font-medium leading-snug line-clamp-2 min-h-[36px] mb-1">
          {product.name}
        </h3>
        
        {product.unit && (
          <p className="text-gray-500 text-xs mb-2">{product.unit}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col">
            <span className="text-gray-900 font-bold text-base">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-gray-400 text-xs line-through">₹{product.originalPrice}</span>
            )}
          </div>

          {quantity > 0 ? (
            <div
              className="flex items-center gap-1 bg-emerald-600 rounded-lg px-1.5 py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => handleQuantityChange(e, -1)}
                className="w-6 h-6 flex items-center justify-center text-white font-semibold hover:bg-white/20 rounded transition-colors"
              >
                −
              </button>
              <span className="text-white font-semibold text-sm w-4 text-center">
                {quantity}
              </span>
              <button
                onClick={(e) => handleQuantityChange(e, 1)}
                className="w-6 h-6 flex items-center justify-center text-white font-semibold hover:bg-white/20 rounded transition-colors"
                disabled={quantity >= product.stockQuantity}
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isOutOfStock
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
              }`}
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
