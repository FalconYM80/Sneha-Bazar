import type { Product } from '../types/app'
import type { FrontendCartItem } from '../types/cart'
import { IcChevLeft, IcCart, IcStar } from '../components/icons'
import { productService } from '../services/productService'
import { adaptProduct } from '../types/product'
import { useState, useEffect } from 'react'

interface ProductDetailScreenProps {
  selectedProduct: Product | null
  productQty: number
  setProductQty: (qty: number) => void
  cart: FrontendCartItem[]
  cartCount: number
  products: Product[]
  addToCart: (product: Product, qty?: number) => void
  navigate: (screen: string) => void
  closeProduct: () => void
  onProductLoaded?: (product: Product) => void
}

export const ProductDetailScreen = ({
  selectedProduct,
  productQty,
  setProductQty,
  cart,
  cartCount,
  products,
  addToCart,
  navigate,
  closeProduct,
  onProductLoaded
}: ProductDetailScreenProps) => {
  const [product, setProduct] = useState<Product | null>(selectedProduct)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Load product from API on mount if not provided via navigation state
  useEffect(() => {
    if (selectedProduct) {
      setProduct(selectedProduct)
      return
    }

    // Try to load product ID from sessionStorage
    let productId = ''
    try {
      productId = sessionStorage.getItem('selectedProductId') || ''
    } catch (err) {
      console.error('Error reading from sessionStorage:', err)
    }

    if (!productId) {
      setError('Product not found')
      return
    }

    // Try to find product in current products array first (optimization)
    const foundInArray = products.find(p => p.id === productId)
    if (foundInArray) {
      setProduct(foundInArray)
      return
    }

    // Fetch from API if not found in array
    const fetchProduct = async () => {
      setIsLoading(true)
      setError('')
      try {
        const backendProduct = await productService.getProductById(productId)
        const adaptedProduct = adaptProduct(backendProduct)
        setProduct(adaptedProduct)
        // Notify parent component about loaded product
        if (onProductLoaded) {
          onProductLoaded(adaptedProduct)
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [selectedProduct, products, onProductLoaded])

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading product details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🔍</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Product Not Found</h2>
              <p className="text-sm text-gray-500 mb-4">
                {error || 'The product you are looking for could not be found.'}
              </p>
            </div>
            <button
              onClick={() => { closeProduct(); navigate('product-list') }}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    )
  }

  const p = product
  const inCart = cart.find(i => i.product.id === p.id)
  const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0
  const related = products.filter(pr => pr.category === p.category && pr.id !== p.id).slice(0, 4)
  const isOutOfStock = !p.isAvailable || p.stockQuantity <= 0

  const handleQtyChange = (newQty: number) => {
    if (newQty >= 1 && newQty <= p.stockQuantity) {
      setProductQty(newQty)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="relative bg-[#F8F9FA] h-60 shrink-0">
        <img 
          src={p.image} 
          alt={p.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-product.svg'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button
            onClick={() => { closeProduct(); navigate('product-list') }}
            className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-gray-700"
          >
            <IcChevLeft />
          </button>
          <button
            onClick={() => navigate('cart')}
            className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-gray-700 relative"
          >
            <IcCart />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
        {discount > 0 && (
          <div className="absolute bottom-3 left-4 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-xl shadow">
            {discount}% OFF
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute bottom-3 right-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-xl shadow">
            Out of Stock
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h1 className="text-xl font-extrabold text-gray-900 flex-1">{p.name}</h1>
            {p.rating && (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-xl shrink-0">
                <IcStar />
                <span className="text-xs font-bold text-amber-700">{p.rating}</span>
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm mb-4">{p.unit || ''} {p.reviews ? `• ${p.reviews.toLocaleString()} reviews` : ''}</p>

          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-3xl font-extrabold text-gray-900">₹{p.price}</span>
            {p.originalPrice && (
              <>
                <span className="text-gray-400 line-through text-base">₹{p.originalPrice}</span>
                <span className="text-orange-500 text-sm font-bold">Save ₹{p.originalPrice - p.price}</span>
              </>
            )}
          </div>

          {/* Stock info */}
          <div className="mb-5">
            <p className={`text-sm font-semibold ${isOutOfStock ? 'text-red-600' : 'text-emerald-600'}`}>
              {isOutOfStock ? 'Out of Stock' : `${p.stockQuantity} items available`}
            </p>
          </div>

          {/* Quantity selector */}
          <div className={`flex items-center gap-4 mb-5 bg-[#F8F9FA] rounded-2xl p-3 ${isOutOfStock ? 'opacity-50' : ''}`}>
            <span className="text-sm font-bold text-gray-700 flex-1">Quantity</span>
            <div className="flex items-center gap-3 bg-white rounded-xl px-1 py-1 shadow-sm">
              <button
                onClick={() => handleQtyChange(productQty - 1)}
                disabled={isOutOfStock}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-700 font-extrabold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
              >
                −
              </button>
              <span className="w-6 text-center font-extrabold text-gray-900">{productQty}</span>
              <button
                onClick={() => handleQtyChange(productQty + 1)}
                disabled={isOutOfStock || productQty >= p.stockQuantity}
                className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                +
              </button>
            </div>
            <span className="text-sm font-bold text-gray-900 shrink-0">₹{p.price * productQty}</span>
          </div>

          {/* Tags */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: 'Farm Fresh', bg: '#D1FAE5', text: '#047857', border: '#A7F3D0' },
              { label: 'No Preservatives', bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
              { label: 'Fresh Daily', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' }
            ].map(tag => (
              <div key={tag.label} className="rounded-xl px-2 py-2 text-center border" style={{ backgroundColor: tag.bg, borderColor: tag.border }}>
                <p className="text-[10px] font-bold" style={{ color: tag.text }}>{tag.label}</p>
              </div>
            ))}
          </div>

          <div className="mb-5">
            <h3 className="font-extrabold text-gray-900 mb-2 text-sm">About this product</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{p.description || 'Fresh quality product'}</p>
          </div>

          {related.length > 0 && (
            <div className="mb-2">
              <h3 className="font-extrabold text-gray-900 mb-3 text-sm">You may also like</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {related.map(rp => (
                  <div
                    key={rp.id}
                    onClick={() => {
                      setProductQty(1)
                      // Store the related product ID for refresh support
                      try {
                        sessionStorage.setItem('selectedProductId', rp.id)
                      } catch (err) {
                        console.error('Error storing product ID:', err)
                      }
                      setProduct(rp)
                    }}
                    className="flex-shrink-0 w-28 bg-[#F8F9FA] rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform border border-[#E2E5E9]"
                  >
                    <img 
                      src={rp.image} 
                      alt={rp.name} 
                      className="w-full h-20 object-cover" 
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-product.png'
                      }}
                    />
                    <div className="p-2">
                      <p className="text-[10px] font-semibold text-gray-800 line-clamp-2">{rp.name}</p>
                      <p className="text-gray-900 text-xs font-bold mt-1">₹{rp.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0 flex gap-3">
        <button
          onClick={() => navigate('cart')}
          className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3.5 rounded-2xl font-bold text-sm hover:bg-[#F8F9FA] transition-colors"
        >
          {inCart ? `View Cart (${cartCount})` : 'View Cart'}
        </button>
        <button
          onClick={() => {
            if (!isOutOfStock) {
              addToCart(p, productQty);
              navigate('cart')
            }
          }}
          disabled={isOutOfStock}
          className={`flex-1 py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-emerald-700 transition-colors ${isOutOfStock ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-emerald-600 text-white'}`}
        >
          {isOutOfStock ? 'Out of Stock' : `Add • ₹${p.price * productQty}`}
        </button>
      </div>
    </div>
  )
}
