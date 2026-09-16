import type { FrontendOrder } from '../types/order'
import type { PlacedOrder } from '../types/app'
import { NavBottom } from '../components/NavBottom'
import { Header } from '../components/Header'
import { Navigation } from '../components/Navigation'
import { MainContent } from '../components/PageContainer'
import { IcLocation, IcPackageEmpty, IcHistory } from '../components/icons'
import { orderService } from '../services/orderService'
import { formatOrderStatus, getStatusColorClass, adaptOrder } from '../types/order'
import { shopConfig } from '../config/shopConfig'

import type { Product } from '../types/app'
import { SearchDropdown } from '../components/SearchDropdown'

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
  isMobile?: boolean
  searchQuery?: string
  handleSearch?: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSearchFocus?: () => void
  handleSearchBlur?: () => void
  executeSearch?: () => void
  showSearchDropdown?: boolean
  isSearching?: boolean
  searchSuggestions?: Product[]
  handleSuggestionClick?: (product: Product) => void
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
  categories,
  isMobile = true,
  searchQuery = '',
  handleSearch = () => {},
  handleSearchFocus = () => {},
  handleSearchBlur = () => {},
  executeSearch = () => {},
  showSearchDropdown = false,
  isSearching = false,
  searchSuggestions = [],
  handleSuggestionClick = () => {},
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
      { label: 'Order Placed', done: ['pending', 'confirmed', 'preparing', 'ready', 'completed'].includes(status) },
      { label: 'Preparing', done: ['confirmed', 'preparing', 'ready', 'completed'].includes(status) },
      { label: 'Ready for Pickup', done: ['ready', 'completed'].includes(status) },
      { label: 'Collected', done: ['completed'].includes(status) },
    ]
    return steps
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F7F6F2] overflow-hidden">
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        handleSearch={handleSearch}
        handleSearchFocus={handleSearchFocus}
        handleSearchBlur={handleSearchBlur}
        executeSearch={executeSearch}
        cartCount={0}
        onNavigate={onNavigate}
        isMobile={isMobile}
        title="My Orders"
      >
        <SearchDropdown
          showSearchDropdown={showSearchDropdown}
          isSearching={isSearching}
          searchSuggestions={searchSuggestions}
          searchQuery={searchQuery}
          handleSuggestionClick={handleSuggestionClick}
        />
      </Header>

      {/* Desktop Navigation - hidden on mobile */}
      {!isMobile && (
        <Navigation 
          activeTab={activeBottomTab} 
          onNavigate={onNavigate} 
          isMobile={false} 
        />
      )}

      <div className="bg-white border-b border-gray-100 shrink-0">
        <div className="w-full mx-auto px-4 py-3 md:px-6 md:py-4 lg:max-w-7xl lg:px-6 lg:py-4">
          <div className="flex gap-1.5 max-w-md">
            {(['active', 'past'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveOrderTab(tab)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors relative ${activeOrderTab === tab ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}
              >
                {tab === 'active' ? 'Active Orders' : 'Past Orders'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <MainContent className="flex-1 overflow-y-auto">
        <div className="w-full mx-auto max-w-5xl px-4 py-4 md:px-6 md:py-6">
          {isLoadingOrders ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-semibold">Loading orders...</p>
            </div>
          ) : ordersError ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-gray-800 font-extrabold text-lg mb-1">Error Loading Orders</h3>
              <p className="text-sm text-center text-gray-400 mb-6 leading-relaxed">{ordersError}</p>
              <button onClick={handleRefreshOrders} className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-[#F8F9FA] transition-colors">
                Retry
              </button>
            </div>
          ) : activeOrderTab === 'active' ? (
            activeOrders.length > 0 ? (
              <div className="space-y-4">
                {activeOrders.map(order => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => {
                      setPlacedOrder({
                        id: order.orderNumber,
                        orderNumber: order.orderNumber,
                        items: order.items.map(i => ({
                          product: {
                            id: i.product.id,
                            name: i.product.name,
                            price: i.price,
                            image: i.product.image,
                          },
                          qty: i.quantity,
                        })),
                        total: order.totalAmount,
                        date: order.formattedDate,
                        status: order.status,
                        preparationMinutes: order.preparationMinutes,
                        estimatedPickupTime: order.estimatedPickupTime,
                      })
                      navigate('order-tracking')
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-extrabold text-gray-900 text-base">#{order.orderNumber}</p>
                        <p className="text-gray-400 text-sm mt-0.5">{order.formattedDate}</p>
                      </div>
                      <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${getStatusColorClass(order.status as any)}`}>
                        {formatOrderStatus(order.status as any)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      {order.items.slice(0, 4).map((item, idx) => (
                        <div key={item.product.id || `${item.product.name}-${idx}`} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center p-0.5">
                          {item.product.image ? (
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              className="w-full h-full object-contain" 
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-no-image')
                                if (fallback) {
                                  (fallback as HTMLElement).style.display = 'flex'
                                }
                              }}
                            />
                          ) : null}
                          <div 
                            className={`fallback-no-image w-full h-full items-center justify-center text-gray-400 text-[10px] sm:text-xs font-medium text-center bg-gray-50 ${item.product.image ? 'hidden' : 'flex'}`}
                          >
                            No Image
                          </div>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200 shrink-0">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                      <div>
                        <p className="text-gray-500 text-xs font-medium mb-0.5">{order.items.length} items</p>
                        <p className="text-gray-900 font-extrabold text-lg">₹{order.totalAmount}</p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <IcLocation />
                        <span>Pickup at {shopConfig.shopName}</span>
                      </div>
                    </div>

                    {/* Progress timeline */}
                    <div className="mb-4">
                      <div className="flex items-center gap-1">
                        {getOrderProgressSteps(order.status).map((step, i) => (
                          <div key={step.label} className="flex items-center gap-1 flex-1 last:flex-none">
                            <div className={`w-3 h-3 rounded-full shrink-0 ${step.done ? 'bg-emerald-600' : 'bg-gray-200'}`} />
                            {i < 3 && <div className={`h-0.5 flex-1 ${step.done ? 'bg-emerald-600' : 'bg-gray-200'}`} />}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] sm:text-xs">
                        {getOrderProgressSteps(order.status).map((step, _i) => (
                          <span key={step.label} className={`font-medium ${step.done ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {step.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <span className="bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-xl">View Status →</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-5">
                  <IcPackageEmpty />
                </div>
                <p className="text-sm font-semibold text-gray-600 mb-1">No active orders</p>
                <p className="text-xs text-gray-400 mb-5">Place an order and track it here</p>
                <button onClick={() => navigate('home')} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-sm hover:bg-gray-800 transition-colors">
                  Shop Now
                </button>
              </div>
            )
          ) : pastOrders.length > 0 ? (
            <div className="space-y-4">
              {pastOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                    <div>
                      <p className="font-extrabold text-gray-900 text-base">#{order.orderNumber}</p>
                      <p className="text-gray-400 text-sm mt-0.5">{order.formattedDate} • {order.totalItemCount} items</p>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1.5 rounded-lg capitalize ${getStatusColorClass(order.status as any)}`}>
                      {formatOrderStatus(order.status as any)}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div>
                      <p className="text-gray-500 text-xs font-medium mb-0.5">Order total</p>
                      <p className="text-gray-900 font-extrabold text-lg">₹{order.totalAmount}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-white border border-gray-300 text-gray-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#F8F9FA] transition-colors">
                        Reorder
                      </button>
                      <button
                        onClick={() => {
                          setPlacedOrder({
                            id: order.orderNumber,
                            orderNumber: order.orderNumber,
                            items: order.items.map(i => ({
                              product: {
                                id: i.product.id,
                                name: i.product.name,
                                price: i.price,
                                image: i.product.image,
                              },
                              qty: i.quantity,
                            })),
                            total: order.totalAmount,
                            date: order.formattedDate,
                            status: order.status,
                            preparationMinutes: order.preparationMinutes,
                            estimatedPickupTime: order.estimatedPickupTime,
                          })
                          navigate('order-tracking')
                        }}
                        className="bg-white border border-gray-300 text-gray-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#F8F9FA] transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-5">
                <IcHistory />
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-1">No past orders</p>
              <p className="text-xs text-gray-400 mb-5">Your completed orders will appear here</p>
            </div>
          )}
        </div>
      </MainContent>

      {/* Bottom Navigation - only on mobile */}
      {isMobile && (
        <NavBottom
          activeBottomTab={activeBottomTab}
          cartCount={0}
          onNavigate={onNavigate}
          onOpenCategory={onOpenCategory}
          categories={categories}
        />
      )}
    </div>
  )
}
