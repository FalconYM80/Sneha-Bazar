import type { FrontendCartItem } from '../types/cart'
import { IcChevLeft, IcBuilding, IcClock } from '../components/icons'
import { calculatePickupTime } from '../utils/helpers'

interface CheckoutScreenProps {
  cart: FrontendCartItem[]
  cartCount: number
  cartSubtotal: number
  cartTotal: number
  checkoutError: string
  isCheckingOut: boolean
  placeOrder: () => void
  navigate: (screen: string) => void
}

export const CheckoutScreen = ({
  cart,
  cartCount,
  cartSubtotal,
  cartTotal,
  checkoutError,
  isCheckingOut,
  placeOrder,
  navigate
}: CheckoutScreenProps) => (
  <div className="flex-1 flex flex-col bg-[#FCFCFA] overflow-hidden">
    <div className="bg-white px-4 shadow-sm shrink-0 md:px-6">
      <div className="max-w-[1050px] mx-auto w-full flex items-center gap-3 pb-2">
        <button onClick={() => navigate('cart')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
          <IcChevLeft />
        </button>
        <h1 className="font-extrabold text-gray-900 text-lg">Checkout</h1>
      </div>
    </div>

    {checkoutError && (
      <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-sm font-semibold md:mx-6">
        <div className="max-w-[1050px] mx-auto">{checkoutError}</div>
      </div>
    )}

    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-20 md:px-6 md:py-4 md:space-y-3">
      <div className="max-w-[1050px] mx-auto w-full space-y-2 md:space-y-3">
        {/* Pickup Information */}
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <h3 className="font-extrabold text-gray-900 text-sm mb-2">Pickup Information</h3>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 text-blue-600">
              <IcBuilding />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">Store Pickup</p>
              <p className="text-gray-500 text-xs mt-0.5 leading-snug">Sneha Bazar<br />Vamanjoor, Karnataka</p>
              <span className="inline-block mt-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Pickup Only</span>
            </div>
          </div>
        </div>

        {/* Estimated Pickup Time */}
        <div className="bg-white rounded-2xl p-3 flex items-center gap-3 border border-gray-100 shadow-sm">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 text-amber-600">
            <IcClock />
          </div>
          <div className="flex-1">
            <p className="text-gray-500 text-xs font-medium">Estimated Pickup Time</p>
            <p className="text-gray-900 font-extrabold text-lg">{calculatePickupTime(cartCount)}</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <h3 className="font-extrabold text-gray-900 text-sm mb-2">Order Summary</h3>
          {cart.slice(0, 3).map(item => (
            <div key={item.product.id} className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <span className="flex-1 text-xs text-gray-700 font-medium line-clamp-1">{item.product.name}</span>
              <span className="text-xs font-semibold text-gray-500 shrink-0">×{item.qty}</span>
              <span className="text-xs font-bold text-gray-900 shrink-0">₹{item.product.price * item.qty}</span>
            </div>
          ))}
          {cart.length > 3 && <p className="text-xs text-gray-400 mt-1">+{cart.length - 3} more items</p>}
          <div className="border-t border-gray-100 mt-2 pt-2 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-600"><span>Subtotal ({cartCount} items)</span><span>₹{cartSubtotal}</span></div>
            <div className="flex justify-between text-xs text-gray-600"><span>Pickup Fee</span><span className="text-emerald-600 font-semibold">FREE</span></div>
            <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-1.5 border-t border-gray-100">
              <span>Total</span>
              <span className="text-gray-900">₹{cartTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="px-4 py-2.5 bg-white border-t border-gray-100 shrink-0 md:px-6">
      <div className="max-w-[1050px] mx-auto w-full">
        <button
          onClick={placeOrder}
          disabled={isCheckingOut}
          className="w-full bg-gray-900 text-white py-3 rounded-2xl font-bold text-base shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCheckingOut ? 'Placing Order...' : `Place Pickup Order • ₹${cartTotal}`}
        </button>
        <p className="text-center text-gray-400 text-[10px] mt-1.5">Pay at store when you pick up your order</p>
      </div>
    </div>
  </div>
)
