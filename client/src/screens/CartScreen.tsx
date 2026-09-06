import type { FrontendCartItem } from '../types/cart'
import { NavBottom } from '../components/NavBottom'
import { IcChevLeft } from '../components/icons'
import { cartService } from '../services/cartService'

interface CartScreenProps {
  cart: FrontendCartItem[]
  isCartLoading: boolean
  cartError: string
  cartCount: number
  cartSubtotal: number
  cartTotal: number
  updateQty: (id: string, delta: number) => void
  navigate: (screen: string) => void
  setCart: (cart: FrontendCartItem[]) => void
  setCartError: (error: string) => void
  activeBottomTab: 'home' | 'categories' | 'cart' | 'orders' | 'profile'
  onNavigate: (screen: string) => void
  onOpenCategory: (catId: string) => void
  categories: { id: string }[]
}

export const CartScreen = ({
  cart,
  isCartLoading,
  cartError,
  cartCount,
  cartSubtotal,
  cartTotal,
  updateQty,
  navigate,
  setCart,
  setCartError,
  activeBottomTab,
  onNavigate,
  onOpenCategory,
  categories
}: CartScreenProps) => {
  const handleClearCart = async () => {
    try {
      await cartService.clearCart()
      setCart([])
    } catch (error) {
      console.error('Error clearing cart:', error)
      setCartError(error instanceof Error ? error.message : 'Failed to clear cart')
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-white px-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3 pb-3">
          <button onClick={() => navigate('home')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
            <IcChevLeft />
          </button>
          <h1 className="font-extrabold text-gray-900 text-lg flex-1">My Cart</h1>
          {cart.length > 0 && (
            <button onClick={handleClearCart} className="text-red-400 text-sm font-semibold">Clear All</button>
          )}
        </div>
      </div>

      {isCartLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-8">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold">Loading cart...</p>
        </div>
      ) : cartError ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-8">
          <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mb-5 text-5xl">⚠️</div>
          <h3 className="text-gray-800 font-extrabold text-lg mb-1">Error Loading Cart</h3>
          <p className="text-sm text-center text-gray-400 mb-6 leading-relaxed">{cartError}</p>
          <button onClick={() => window.location.reload()} className="bg-green-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-green-200">
            Retry
          </button>
        </div>
      ) : cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-8">
          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mb-5 text-5xl">🛒</div>
          <h3 className="text-gray-800 font-extrabold text-lg mb-1">Cart is empty</h3>
          <p className="text-sm text-center text-gray-400 mb-6 leading-relaxed">{"You haven't added anything yet. Browse fresh groceries and start shopping!"}</p>
          <button onClick={() => navigate('home')} className="bg-green-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-green-200">
            Start Shopping
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {cart.map(item => (
              <div key={item.product.id} className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm border border-gray-100">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-semibold text-sm leading-tight">{item.product.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{item.product.unit}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-green-700 font-bold text-sm">₹{item.product.price * item.qty}</span>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-1 py-0.5">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-gray-700 font-bold shadow-sm text-sm"
                      >
                        −
                      </button>
                      <span className="text-xs font-bold w-4 text-center text-gray-900">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Bill Summary */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-extrabold text-gray-900 mb-3 text-sm">Bill Summary</h3>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({cartCount} items)</span>
                  <span>₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Pickup Fee</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
                <div className="border-t border-gray-100 pt-2.5 flex justify-between font-extrabold text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-green-700">₹{cartTotal}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
            <button
              onClick={() => navigate('checkout')}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-green-200 flex items-center justify-between px-5 active:scale-95 transition-transform"
            >
              <span className="text-green-100 text-sm">{cartCount} items • ₹{cartTotal}</span>
              <span>Place Pickup Order →</span>
            </button>
          </div>
        </>
      )}

      <NavBottom
        activeBottomTab={activeBottomTab}
        cartCount={cartCount}
        onNavigate={onNavigate}
        onOpenCategory={onOpenCategory}
        categories={categories}
      />
    </div>
  )
}
