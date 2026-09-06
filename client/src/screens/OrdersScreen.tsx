import type { FrontendOrder } from '../types/order'
import type { PlacedOrder } from '../types/app'
import { NavBottom } from '../components/NavBottom'
import { orderService } from '../services/orderService'
import { formatOrderStatus, getStatusColorClass } from '../types/order'

interface OrdersScreenProps {
  orders: FrontendOrder[]
  isLoadingOrders: boolean
  ordersError: string
  activeOrderTab: 'active' | 'past'
  setActiveOrderTab: (tab: 'active' | 'past') => void
  navigate: (screen: string) => void
  setPlacedOrder: (order: PlacedOrder) => void
  setOrders: (orders: FrontendOrder[]) => void
  setIsLoadingOrders: (loading: boolean) => void
  setOrdersError: (error: string) => void
  activeBottomTab: 'home' | 'categories' | 'cart' | 'orders' | 'profile'
  onNavigate: (screen: string) => void
  onOpenCategory: (catId: string) => void
  categories: { id: string }[]
}

export const OrdersScreen = ({
  orders,
  isLoadingOrders,
  ordersError,
  activeOrderTab,
  setActiveOrderTab,
  navigate,
  setPlacedOrder,
  setOrders,
  setIsLoadingOrders,
  setOrdersError,
  activeBottomTab,
  onNavigate,
  onOpenCategory,
  categories
}: OrdersScreenProps) => {
  // Separate orders into active and past based on status
  const activeOrders = orders.filter(order => 
    ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)
  )
  const pastOrders = orders.filter(order => 
    ['completed', 'cancelled'].includes(order.status)
  )

  const handleRefreshOrders = async () => {
    setIsLoadingOrders(true)
    setOrdersError('')
    try {
      const backendOrders = await orderService.getMyOrders()
      const { adaptOrder } = await import('../types/order')
      const adaptedOrders = backendOrders.map(adaptOrder)
      setOrders(adaptedOrders)
    } catch (error) {
      setOrdersError(error instanceof Error ? error.message : 'Failed to load orders')
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const getOrderProgressSteps = (status: FrontendOrder['status']) => {
    const steps = [
      { label: 'Placed', done: ['pending', 'confirmed', 'preparing', 'ready', 'completed'].includes(status) },
      { label: 'Confirmed', done: ['confirmed', 'preparing', 'ready', 'completed'].includes(status) },
      { label: 'Preparing', done: ['preparing', 'ready', 'completed'].includes(status) },
      { label: 'Ready', done: ['ready', 'completed'].includes(status) },
    ]
    return steps
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-white px-4 shadow-sm shrink-0">
        <div className="flex items-center justify-between pb-3">
          <h1 className="font-extrabold text-gray-900 text-lg">My Orders</h1>
          {ordersError && (
            <button onClick={handleRefreshOrders} className="text-green-600 text-xs font-semibold">
              Retry
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 px-4 py-3 bg-white border-b border-gray-100 shrink-0">
        {(['active', 'past'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveOrderTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeOrderTab === tab ? 'bg-green-600 text-white shadow-sm shadow-green-200' : 'bg-gray-100 text-gray-500'}`}
          >
            {tab === 'active' ? 'Active Orders' : 'Past Orders'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoadingOrders ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold">Loading orders...</p>
          </div>
        ) : ordersError ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 px-8">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-5 text-4xl">⚠️</div>
            <h3 className="text-gray-800 font-extrabold text-lg mb-1">Error Loading Orders</h3>
            <p className="text-sm text-center text-gray-400 mb-6 leading-relaxed">{ordersError}</p>
            <button onClick={handleRefreshOrders} className="bg-green-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-green-200">
              Retry
            </button>
          </div>
        ) : activeOrderTab === 'active' ? (
          activeOrders.length > 0 ? (
            activeOrders.map(order => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-green-200 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => {
                  // Set placedOrder for tracking screen
                  setPlacedOrder({
                    id: order.orderNumber,
                    orderNumber: order.orderNumber,
                    items: [], // Will be loaded from backend if needed
                    total: order.totalAmount,
                    date: order.formattedDate,
                    status: order.status,
                    preparationMinutes: order.preparationMinutes,
                    estimatedPickupTime: order.estimatedPickupTime,
                  })
                  navigate('order-tracking')
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-extrabold text-gray-900 text-sm">#{order.orderNumber}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{order.formattedDate}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getStatusColorClass(order.status as any)}`}>
                    {formatOrderStatus(order.status as any)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {order.items.slice(0, 3).map(item => (
                    <div key={item.product.id} className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-green-700 font-extrabold text-sm">₹{order.totalAmount}</span>
                  <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl">View Status →</span>
                </div>

                {/* Mini progress */}
                <div className="flex items-center gap-0.5">
                  {getOrderProgressSteps(order.status).map((step, i) => (
                    <div key={step.label} className="flex items-center gap-0.5 flex-1 last:flex-none">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`} />
                      {i < 3 && <div className={`h-0.5 flex-1 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`} />}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl mb-4">📦</div>
              <p className="text-sm font-semibold text-gray-600 mb-1">No active orders</p>
              <p className="text-xs text-gray-400 mb-5">Place an order and track it here</p>
              <button onClick={() => navigate('home')} className="bg-green-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md shadow-green-200">
                Shop Now
              </button>
            </div>
          )
        ) : pastOrders.length > 0 ? (
          pastOrders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2.5">
                <div>
                  <p className="font-extrabold text-gray-900 text-sm">#{order.orderNumber}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{order.formattedDate} • {order.totalItemCount} items</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${getStatusColorClass(order.status as any)}`}>
                  {formatOrderStatus(order.status as any)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-700 font-extrabold text-sm">₹{order.totalAmount}</span>
                <div className="flex gap-2">
                  <button className="border border-gray-200 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-xl">
                    Reorder
                  </button>
                  <button 
                    onClick={() => {
                      setPlacedOrder({
                        id: order.orderNumber,
                        orderNumber: order.orderNumber,
                        items: [],
                        total: order.totalAmount,
                        date: order.formattedDate,
                        status: order.status,
                        preparationMinutes: order.preparationMinutes,
                        estimatedPickupTime: order.estimatedPickupTime,
                      })
                      navigate('order-tracking')
                    }}
                    className="border border-green-200 text-green-600 text-xs font-bold px-3 py-1.5 rounded-xl"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl mb-4">📦</div>
            <p className="text-sm font-semibold text-gray-600 mb-1">No past orders</p>
            <p className="text-xs text-gray-400 mb-5">Your completed orders will appear here</p>
          </div>
        )}
      </div>

      <NavBottom
        activeBottomTab={activeBottomTab}
        cartCount={0}
        onNavigate={onNavigate}
        onOpenCategory={onOpenCategory}
        categories={categories}
      />
    </div>
  )
}
