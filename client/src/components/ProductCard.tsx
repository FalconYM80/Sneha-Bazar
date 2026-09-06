import type { Product } from '../types/app'
import type { FrontendCartItem } from '../types/cart'

interface ProductCardProps {
  product: Product
  cart: FrontendCartItem[]
  onAddToCart: (product: Product) => void
  onProductClick: (product: Product) => void
}

export const ProductCard = ({ product, cart, onAddToCart, onProductClick }: ProductCardProps) => {
  const inCart = cart.some(i => i.product.id === product.id)
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0
  const isOutOfStock = !product.isAvailable || product.stockQuantity <= 0
  
  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform ${isOutOfStock ? 'opacity-60' : ''}`}
      onClick={() => !isOutOfStock && onProductClick(product)}
    >
      <div className="bg-gray-50 h-28 relative overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover" 
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-product.svg'
          }}
        />
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
            {discount}% OFF
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-bold px-2 py-1 bg-black/60 rounded">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-gray-900 text-xs font-semibold leading-tight line-clamp-2 min-h-[30px]">{product.name}</p>
        <p className="text-gray-400 text-[10px] mt-0.5">{product.unit || ''}</p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-green-700 font-bold text-sm">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-gray-400 text-[10px] line-through ml-1">₹{product.originalPrice}</span>
            )}
          </div>
          <button
            onClick={e => { 
              e.stopPropagation(); 
              if (!isOutOfStock) onAddToCart(product) 
            }}
            disabled={isOutOfStock}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-base transition-colors ${isOutOfStock ? 'bg-gray-400 cursor-not-allowed' : inCart ? 'bg-green-700' : 'bg-green-600'}`}
          >
            {isOutOfStock ? '×' : inCart ? '✓' : '+'}
          </button>
        </div>
      </div>
    </div>
  )
}
