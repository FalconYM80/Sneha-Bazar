import { useState, useEffect, useRef } from 'react'
import type { Product } from '../types/app'
import type { FrontendCartItem } from '../types/cart'
import { IcChevLeft, IcCart, IcMapPin, IcPackageEmpty } from '../components/icons'
import { ProductCard } from '../components/ProductCard'
import { productService } from '../services/productService'
import { adaptProduct } from '../types/product'
import { shopConfig } from '../config/shopConfig'

interface ProductDetailScreenProps {
  selectedProduct: Product | null
  productQty: number
  setProductQty: (qty: number) => void
  cart: FrontendCartItem[]
  cartCount: number
  products: Product[]
  addToCart: (product: Product, qty?: number) => void
  updateQuantity?: (productId: string, delta: number) => void
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
  updateQuantity,
  navigate,
  closeProduct,
  onProductLoaded,
}: ProductDetailScreenProps) => {
  const [product, setProduct] = useState<Product | null>(selectedProduct)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [isLoadingRelated, setIsLoadingRelated] = useState(false)
  const [isAddedFeedback, setIsAddedFeedback] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load product from API on mount if not provided via navigation state
  useEffect(() => {
    if (selectedProduct) {
      setProduct(selectedProduct)
      setImageError(false)
      return
    }

    let productId = ''
    try {
      if (window.location.pathname.startsWith('/product/')) {
        productId = window.location.pathname.replace('/product/', '').split('/')[0] || ''
      }
      if (!productId) {
        productId = sessionStorage.getItem('selectedProductId') || ''
      }
    } catch (err) {
      console.error('Error reading productId:', err)
    }

    if (!productId) {
      setError('Product not found')
      return
    }

    // Try to find product in current products array first (optimization)
    const foundInArray = products.find(p => p.id === productId)
    if (foundInArray) {
      setProduct(foundInArray)
      setImageError(false)
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
        setImageError(false)
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

  // Fetch same-category recommendations whenever the active product changes
  useEffect(() => {
    if (!product?.category) {
      setRelatedProducts([])
      return
    }

    let isMounted = true

    const fetchCategoryRecommendations = async () => {
      setIsLoadingRelated(true)
      try {
        // Fetch candidates from the same category (limit 8 to obtain up to 4 valid with images)
        const backendProducts = await productService.getProducts(product.category, undefined, 1, 8)
        const adapted = backendProducts.map(adaptProduct)

        if (isMounted) {
          // Filter: same category, exclude current product, only valid non-placeholder images
          const valid = adapted.filter(
            rp =>
              rp.id !== product.id &&
              Boolean(
                rp.image &&
                rp.image.trim() !== '' &&
                !rp.image.includes('placeholder') &&
                !rp.image.includes('default')
              )
          ).slice(0, 4)

          setRelatedProducts(valid)
        }
      } catch (err) {
        console.error('Error fetching category recommendations:', err)
        if (isMounted) {
          // Fallback to local products array if available
          const localValid = (products || []).filter(
            rp =>
              rp.category === product.category &&
              rp.id !== product.id &&
              Boolean(
                rp.image &&
                rp.image.trim() !== '' &&
                !rp.image.includes('placeholder') &&
                !rp.image.includes('default')
              )
          ).slice(0, 4)
          setRelatedProducts(localValid)
        }
      } finally {
        if (isMounted) {
          setIsLoadingRelated(false)
        }
      }
    }

    fetchCategoryRecommendations()

    return () => {
      isMounted = false
    }
  }, [product?.id, product?.category, products])

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-[#F7F6F2] overflow-y-auto">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-stone-300 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-sm font-medium text-stone-600">Loading product details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex-1 flex flex-col bg-[#F7F6F2] overflow-y-auto">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-sm w-full shadow-sm">
            <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
              <IcPackageEmpty />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Product Not Found</h2>
            <p className="text-sm text-gray-500 mb-6">
              {error || 'The product you are looking for could not be found.'}
            </p>
            <button
              type="button"
              onClick={() => {
                closeProduct()
                navigate('product-list')
              }}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors"
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
  const discount = p.originalPrice && p.originalPrice > p.price
    ? Math.round((1 - p.price / p.originalPrice) * 100)
    : 0
  const isOutOfStock = !p.isAvailable || p.stockQuantity <= 0

  // Meaningful description check
  const hasDescription = Boolean(
    p.description &&
    p.description.trim().length > 0 &&
    p.description.trim().toLowerCase() !== p.name.trim().toLowerCase() &&
    p.description.trim() !== 'Fresh quality product' &&
    (p.company ? p.description.trim().toLowerCase() !== `${p.company} - ${p.name}`.toLowerCase() : true)
  )

  const handleQtyChange = (newQty: number) => {
    if (newQty >= 1) {
      if (p.stockQuantity > 0 && newQty > p.stockQuantity) return
      setProductQty(newQty)
    }
  }

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart(p, productQty)
      setIsAddedFeedback(true)
      setTimeout(() => {
        setIsAddedFeedback(false)
      }, 1200)
    }
  }

  const handleSelectRelated = (rp: Product) => {
    setProductQty(1)
    setImageError(false)
    try {
      sessionStorage.setItem('selectedProductId', rp.id)
    } catch (err) {
      console.error('Error storing product ID:', err)
    }
    setProduct(rp)
    if (onProductLoaded) {
      onProductLoaded(rp)
    }
    // Smoothly scroll to top of product details container
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-[#F7F6F2] overflow-y-auto">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              closeProduct()
              navigate(-1 as any)
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors py-1.5 px-2 -ml-2 rounded-lg hover:bg-stone-100 active:scale-95"
          >
            <IcChevLeft />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('cart')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-gray-700 hover:bg-stone-50 hover:border-stone-300 active:scale-95 transition-all relative"
            aria-label="View shopping cart"
          >
            <IcCart />
            <span className="text-xs font-bold text-gray-800 hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-success-pop">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-12 space-y-8">
        {/* Product Grid: Left Image, Right Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Contained Image Box */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 flex items-center justify-center relative min-h-[300px] sm:min-h-[380px] lg:min-h-[440px] shadow-sm animate-card-in">
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                {discount}% OFF
              </span>
            )}
            {isOutOfStock && (
              <span className="absolute top-4 right-4 bg-stone-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                Out of Stock
              </span>
            )}

            {imageError || !p.image ? (
              <div className="flex flex-col items-center justify-center text-stone-400 py-12">
                <IcPackageEmpty />
                <span className="text-xs text-stone-400 mt-2 font-medium">Image unavailable</span>
              </div>
            ) : (
              <img
                src={p.image}
                alt={p.name}
                className="max-h-[260px] sm:max-h-[340px] lg:max-h-[380px] w-auto max-w-full object-contain select-none transition-transform duration-300 hover:scale-[1.02]"
                loading="eager"
                onError={() => setImageError(true)}
              />
            )}
          </div>

          {/* Right Column: Product Information */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm flex flex-col gap-4 animate-page-in">
            {/* Brand */}
            {p.company && (
              <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md self-start">
                {p.company}
              </div>
            )}

            {/* Product Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                {p.name}
              </h1>
              {p.unit && (
                <p className="text-sm font-medium text-gray-500 mt-1">
                  {p.unit}
                </p>
              )}
            </div>

            {/* Price section */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                ₹{p.price}
              </span>
              {p.originalPrice && p.originalPrice > p.price && (
                <>
                  <span className="text-gray-400 line-through text-lg font-medium">
                    ₹{p.originalPrice}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Save ₹{p.originalPrice - p.price}
                  </span>
                </>
              )}
            </div>

            {/* Real Availability */}
            <div className="flex items-center gap-2 pt-0.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOutOfStock ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              />
              <span
                className={`text-sm font-semibold ${
                  isOutOfStock ? 'text-red-700' : 'text-emerald-700'
                }`}
              >
                {isOutOfStock ? 'Out of stock' : 'In stock'}
              </span>
            </div>

            <hr className="border-stone-100 my-1" />

            {/* Quantity Selector & Add to Cart on Desktop/Tablet */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <div className="flex items-center justify-between sm:justify-start gap-3 bg-stone-50 rounded-xl p-1.5 border border-stone-200">
                <span className="text-xs font-bold text-gray-600 px-2 sm:hidden">
                  Quantity
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQtyChange(productQty - 1)}
                    disabled={isOutOfStock || productQty <= 1}
                    aria-label="Decrease quantity"
                    className="w-9 h-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-gray-800 font-bold text-lg hover:bg-stone-100 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-bold text-gray-900 text-base">
                    {productQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQtyChange(productQty + 1)}
                    disabled={isOutOfStock || (p.stockQuantity > 0 && productQty >= p.stockQuantity)}
                    aria-label="Increase quantity"
                    className="w-9 h-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-gray-800 font-bold text-lg hover:bg-stone-100 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-3 px-6 rounded-xl font-bold text-base transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 ${
                  isOutOfStock
                    ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                    : isAddedFeedback
                      ? 'bg-emerald-700 text-white animate-success-pop'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : isAddedFeedback ? 'Added to Cart ✓' : `Add • ₹${p.price * productQty}`}
              </button>
            </div>

            {/* Pickup fulfillment notice */}
            <div className="bg-[#F7F6F2] rounded-xl border border-stone-200 p-3.5 flex items-start gap-3 mt-1">
              <div className="text-emerald-700 shrink-0 mt-0.5">
                <IcMapPin />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Pickup at {shopConfig.shopName}</h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  Order online and collect your order from the {shopConfig.shopName} shop.
                </p>
              </div>
            </div>

            {/* About this product (Only rendered if genuine description is available) */}
            {hasDescription && (
              <div className="pt-3 border-t border-stone-100">
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">
                  About this product
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {p.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* You May Also Like (Only rendered if same-category products with valid images exist) */}
        {!isLoadingRelated && relatedProducts.length > 0 && (
          <section className="pt-2 animate-card-in">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              You may also like
            </h2>
            {/* Horizontal scroll on mobile, 4-col grid on desktop, reusing ProductCard */}
            <div className="flex sm:grid sm:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible pb-3 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
              {relatedProducts.map((rp, index) => (
                <div key={rp.id} className={`w-36 shrink-0 sm:w-auto animate-card-in stagger-${Math.min(index + 1, 4)}`}>
                  <ProductCard
                    product={rp}
                    cart={cart}
                    onAddToCart={addToCart}
                    onUpdateQuantity={updateQuantity || ((_id, _delta) => {})}
                    onProductClick={handleSelectRelated}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Compact Fixed Bottom Action Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-2.5 z-30 shadow-lg">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('cart')}
            className="flex-1 h-11 bg-white border border-stone-300 text-gray-700 rounded-xl font-bold text-xs hover:bg-stone-50 active:scale-95 transition-all flex items-center justify-center"
          >
            {inCart ? `View Cart (${cartCount})` : 'View Cart'}
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex-1 h-11 rounded-xl font-bold text-xs transition-all flex items-center justify-center shadow-sm active:scale-95 ${
              isOutOfStock
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                : isAddedFeedback
                  ? 'bg-emerald-700 text-white animate-success-pop'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isOutOfStock ? 'Out of Stock' : isAddedFeedback ? 'Added to Cart ✓' : `Add • ₹${p.price * productQty}`}
          </button>
        </div>
      </div>
    </div>
  )
}
