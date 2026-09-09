
import type { PlacedOrder } from '../types/app'
import { IcCheck } from '../components/icons'
import { formatPickupTime, formatOrderStatus, getStatusColorClass } from '../types/order'
import { calculatePickupTime } from '../utils/helpers'

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
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl mb-4">📦</div>
        <h3 className="text-gray-800 font-extrabold text-lg mb-1">Order Not Found</h3>
        <p className="text-sm text-gray-400 mb-6">Please check your orders page for recent orders</p>
        <button onClick={() => navigate('orders')} className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-800 transition-colors">
          View Orders
        </button>
      </div>
    )
  }
  
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center overflow-y-auto py-6">
        {/* Success animation */}
        <div className="relative mb-8">
          <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center">
            <div className="w-20 h-20 bg-green-200 rounded-full flex items-center justify-center">
              <div className="w-14 h-14 bg-[#16A34A] rounded-full flex items-center justify-center text-white shadow-lg shadow-green-300">
                <IcCheck />
              </div>
            </div>
          </div>
          <div className="absolute -top-1 -right-1 text-2xl">🎉</div>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Order Placed!</h1>
        <p className="text-gray-500 text-sm mb-7 leading-relaxed">
          Your order has been successfully placed.<br />We will start preparing it right away!
        </p>

        <div className="bg-gray-50 rounded-2xl p-5 w-full mb-6 text-left space-y-3.5">
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
          <div className="border-t border-gray-200 pt-3.5 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FEF3C7] rounded-xl flex items-center justify-center text-xl shrink-0">⏱️</div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Estimated Pickup Time</p>
              <p className="font-extrabold text-gray-900 text-sm">{pickupTime}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 w-full mb-6">
          <p className="text-green-800 text-sm font-semibold text-center">
            Please collect your order from the store
          </p>
          <p className="text-green-600 text-xs text-center mt-1">
            Sneha Bazar Main Store, Vamanjoor
          </p>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={() => navigate('orders')}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-colors"
          >
            View Order Status
          </button>
          <button
            onClick={() => navigate('home')}
            className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}
