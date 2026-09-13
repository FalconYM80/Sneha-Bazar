import { useState, useEffect } from 'react'
import type { PlacedOrder } from '../types/app'
import type { BackendOrder } from '../types/order'
import { IcChevLeft, IcMapPin, IcClock, IcPackage, IcPackageSmall, IcCheckTiny, IcBag, IcBagSmall } from '../components/icons'
import { orderService } from '../services/orderService'
import { formatPickupTime } from '../types/order'
import { calculatePickupTime } from '../utils/helpers'

interface OrderTrackingScreenProps {
  placedOrder: PlacedOrder | null
  isAuthenticated: boolean
  navigate: (screen: string) => void
}

export const OrderTrackingScreen = ({ placedOrder, isAuthenticated, navigate }: OrderTrackingScreenProps) => {
  const [orderDetails, setOrderDetails] = useState<BackendOrder | null>(null)
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)
  const [orderError, setOrderError] = useState('')

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!placedOrder || !isAuthenticated) {
        return
      }

      setIsLoadingOrder(true)
      setOrderError('')
      try {
        const backendOrders = await orderService.getMyOrders()
        const matchingOrder = backendOrders.find(o => o.orderNumber === placedOrder.orderNumber)
        
        if (matchingOrder) {
          setOrderDetails(matchingOrder)
        } else {
          setOrderError('Order details not found')
        }
      } catch (error) {
        console.error('Error fetching order details:', error)
        setOrderError(error instanceof Error ? error.message : 'Failed to load order details')
      } finally {
        setIsLoadingOrder(false)
      }
    }

    fetchOrderDetails()
  }, [placedOrder, isAuthenticated])

  const currentOrder = orderDetails
  const totalQuantity = currentOrder?.totalItemCount || placedOrder?.items.reduce((sum, item) => sum + item.qty, 0) || 0
  const pickupTime = currentOrder?.preparationMinutes 
    ? formatPickupTime(currentOrder.preparationMinutes) 
    : placedOrder?.preparationMinutes 
      ? formatPickupTime(placedOrder.preparationMinutes)
      : calculatePickupTime(totalQuantity)
  
  const status = currentOrder?.status || (placedOrder?.status as any) || 'pending'
  
  const steps = [
    { label: 'Order Placed', sub: 'We received your order', done: ['pending', 'confirmed', 'preparing', 'ready', 'completed'].includes(status), active: status === 'pending', icon: <IcCheckTiny /> },
    { label: 'Confirmed', sub: 'Order confirmed by store', done: ['confirmed', 'preparing', 'ready', 'completed'].includes(status), active: status === 'confirmed', icon: <IcCheckTiny /> },
    { label: 'Preparing', sub: 'Items are being prepared', done: ['preparing', 'ready', 'completed'].includes(status), active: status === 'preparing', icon: <IcPackageSmall /> },
    { label: 'Ready for Pickup', sub: 'Order ready at store', done: ['ready', 'completed'].includes(status), active: status === 'ready', icon: <IcBagSmall /> },
  ]

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
      <div className="bg-white px-4 shadow-sm shrink-0">
        <div className="max-w-[1050px] mx-auto w-full flex items-center gap-3 pb-3">
          <button onClick={() => navigate('orders')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
            <IcChevLeft />
          </button>
          <h1 className="font-extrabold text-gray-900 text-lg flex-1">Order Status</h1>
          <span className="text-gray-400 text-xs font-semibold">#{placedOrder.orderNumber}</span>
        </div>
      </div>

      {isLoadingOrder ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold">Loading order details...</p>
        </div>
      ) : orderError ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center md:px-6">
          <div className="max-w-[1050px] mx-auto w-full">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-5">
              <IcCheck />
            </div>
            <h3 className="text-gray-800 font-extrabold text-lg mb-1">Error Loading Order</h3>
            <p className="text-sm text-gray-400 mb-6">{orderError}</p>
            <button onClick={() => navigate('orders')} className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-800 transition-colors">
              Back to Orders
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 md:px-6">
          <div className="max-w-[1050px] mx-auto w-full space-y-3">
            {/* Pickup Time Card */}
            <div className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 shadow-sm">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 text-amber-600">
                <IcClock />
              </div>
              <div className="flex-1">
                <p className="text-gray-500 text-xs font-medium">Estimated Pickup Time</p>
                <p className="text-gray-900 font-extrabold text-lg">{pickupTime}</p>
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-sm mb-4">Order Progress</h3>
              <div className="max-w-[650px] mx-auto">
                {steps.map((step, i) => (
                  <div key={step.label} className="flex gap-4" style={{ paddingBottom: i < steps.length - 1 ? '20px' : '0' }}>
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        step.done
                          ? 'bg-gray-900 text-white'
                          : step.active
                            ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                            : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.done ? <IcCheckTiny /> : step.icon}
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`w-0.5 flex-1 mt-1 min-h-[16px] ${step.done ? 'bg-gray-900' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="pt-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${step.done || step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        {step.active && (
                          <span className="bg-amber-100 text-amber-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Current</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{step.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pickup Location */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-sm mb-3">Pickup Location</h3>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                  <IcMapPin />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">Store Address</p>
                  <p className="text-xs text-gray-500 mt-0.5">Sneha Bazar<br />Vamanjoor, Karnataka</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
        <div className="max-w-[1050px] mx-auto w-full">
          <button onClick={() => navigate('orders')} className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-2xl font-bold text-sm hover:bg-[#F8F9FA] transition-colors">
            View All Orders
          </button>
        </div>
      </div>
    </div>
  )
}
