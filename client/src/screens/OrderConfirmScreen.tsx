
import type { PlacedOrder } from '../types/app'
import { IcCheck, IcClock, IcPackage, IcLocation, IcExternalLink } from '../components/icons'
import { formatPickupTime, formatOrderStatus, getStatusColorClass } from '../types/order'
import { calculatePickupTime } from '../utils/helpers'
import { shopConfig } from '../config/shopConfig'

interface OrderConfirmScreenProps {
  placedOrder: PlacedOrder | null
  navigate: (screen: string) => void
}

export const OrderConfirmScreen = ({ placedOrder, navigate }: OrderConfirmScreenProps) => {
  const totalQuantity = placedOrder?.items.reduce((sum, item) => sum + item.qty, 0) || 0
  const pickupTime = placedOrder?.preparationMinutes
    ? formatPickupTime(placedOrder.preparationMinutes)
    : calculatePickupTime(totalQuantity)
  
  if (!placedOrder) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center bg-[#FCFCFA] md:px-6">
        <div className="max-w-[1050px] mx-auto w-full">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
            <IcPackage />
          </div>
          <h3 className="text-gray-800 font-extrabold text-lg mb-1">Order Not Found</h3>
          <p className="text-sm text-gray-400 mb-6">Please check your orders page for recent orders</p>
          <button onClick={() => navigate('orders')} className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-800 transition-colors">
            View Orders
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex-1 flex flex-col bg-[#FCFCFA] overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center overflow-y-auto py-6 md:px-6">
        <div className="max-w-[1050px] mx-auto w-full">
          {/* Success animation */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-success-pop">
              <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 bg-[#16A34A] rounded-full flex items-center justify-center text-white shadow-lg shadow-green-300">
                  <IcCheck />
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-2 animate-page-in">Order Placed!</h1>
          <p className="text-gray-500 text-sm mb-5 leading-relaxed animate-page-in">
            Your order has been successfully placed.<br />We will start preparing it right away!
          </p>

          <div className="bg-white rounded-2xl p-4 mb-4 text-left space-y-3 shadow-xs border border-gray-100 animate-card-in stagger-1">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Order Number</span>
              <span className="font-extrabold text-gray-900 text-sm">{placedOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Order Date</span>
              <span className="font-semibold text-gray-700 text-sm">{placedOrder.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Status</span>
              <span className={`font-semibold text-sm px-2.5 py-1 rounded-lg ${getStatusColorClass(placedOrder.status as any)}`}>
                {formatOrderStatus(placedOrder.status as any)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Total Items</span>
              <span className="font-semibold text-gray-700 text-sm">{totalQuantity} items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Total Amount</span>
              <span className="font-extrabold text-gray-900 text-sm">₹{placedOrder.total}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 text-amber-600">
                <IcClock />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Estimated Pickup Time</p>
                <p className="font-extrabold text-gray-900 text-sm">{pickupTime}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 mb-4 text-left shadow-xs border border-gray-100 animate-card-in stagger-2">
            <h3 className="font-extrabold text-gray-900 text-sm mb-2">Pickup Location</h3>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 text-blue-600 mt-0.5">
                <IcLocation />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{shopConfig.shopName}</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{shopConfig.address.fullAddress}</p>
                <a
                  href={shopConfig.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold mt-2 hover:underline"
                >
                  View on Google Maps <IcExternalLink />
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-3 animate-card-in stagger-3">
            <button
              onClick={() => navigate('orders')}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-2xl font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              View Order Status
            </button>
            <button
              onClick={() => navigate('home')}
              className="w-full bg-gray-900 text-white py-3 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-800 active:scale-95 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
