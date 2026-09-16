import type { FrontendCartItem } from '../types/cart'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { NavBottom } from '../components/NavBottom'
import { Header } from '../components/Header'
import { Navigation } from '../components/Navigation'
import { MainContent } from '../components/PageContainer'
import { IcEmptyCart, IcTrash } from '../components/icons'

import type { Product } from '../types/app'
import { SearchDropdown } from '../components/SearchDropdown'

interface CartScreenProps {
  cart: FrontendCartItem[]
  isCartLoading: boolean
  cartError: string
  cartCount: number
  cartSubtotal: number
  cartTotal: number
  updateQty: (id: string, delta: number) => void
  removeFromCart: (id: string) => void
  navigate: (screen: string) => void
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

export const CartScreen = ({
  cart,
  isCartLoading,
  cartError,
  cartCount,
  cartSubtotal,
  cartTotal,
  updateQty,
  removeFromCart,
  navigate,
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
}: CartScreenProps) => {
  return (
    <div className="flex-1 flex flex-col bg-[#F7F6F2] overflow-hidden">
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        handleSearch={handleSearch}
        handleSearchFocus={handleSearchFocus}
        handleSearchBlur={handleSearchBlur}
        executeSearch={executeSearch}
        cartCount={cartCount}
        onNavigate={onNavigate}
        isMobile={isMobile}
        title="My Cart"
        showBackButton={true}
        onBack={() => navigate('home')}
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

      {isCartLoading ? (
        <MainContent className="flex-1 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-500">Loading cart...</p>
        </MainContent>
      ) : cartError ? (
        <MainContent className="flex-1">
          <ErrorState message={cartError} onRetry={() => window.location.reload()} />
        </MainContent>
      ) : cart.length === 0 ? (
        <MainContent className="flex-1">
          <EmptyState
            icon={<IcEmptyCart />}
            title="Your cart is waiting"
            subtitle="Add some products and they'll appear here."
            actionLabel="Continue Shopping"
            onAction={() => navigate('home')}
          />
        </MainContent>
      ) : (
        <>
          <MainContent className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cart Items - Left Column (2/3 on desktop) */}
                <div className="lg:col-span-2 space-y-4">
                  {cart.map((item, index) => (
                    <div key={item.product.id} className={`bg-white rounded-xl p-3.5 sm:p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow animate-card-in stagger-${Math.min(index + 1, 6)}`}>
                      <div className="flex gap-3 sm:gap-4 items-start">
                        {/* Product Image */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                          <img 
                            src={item.product.image} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>

                        {/* Product Info & Actions */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch gap-2">
                          <div>
                            <h3 className="text-gray-900 font-semibold text-sm sm:text-base leading-snug break-words">
                              {item.product.name}
                            </h3>
                            {item.product.unit && (
                              <p className="text-gray-500 text-xs mt-0.5">{item.product.unit}</p>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-0.5">
                            <div className="flex flex-col">
                              <span className="text-gray-900 font-bold text-base sm:text-lg leading-tight transition-all">₹{item.product.price * item.qty}</span>
                              {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                                <span className="text-gray-400 text-xs line-through mt-0.5">₹{item.product.originalPrice * item.qty}</span>
                              )}
                            </div>

                            <div className="flex items-center justify-end gap-2 shrink-0">
                              <div className="flex items-center gap-1 bg-emerald-600 rounded-lg px-1.5 py-1 shrink-0 shadow-xs">
                                <button
                                  onClick={() => updateQty(item.product.id, -1)}
                                  aria-label={`Decrease quantity of ${item.product.name}`}
                                  className="w-7 h-7 flex items-center justify-center text-white font-semibold hover:bg-white/20 active:scale-90 rounded transition-all"
                                >
                                  −
                                </button>
                                <span className="text-white font-semibold text-sm min-w-[20px] text-center transition-all">{item.qty}</span>
                                <button
                                  onClick={() => updateQty(item.product.id, 1)}
                                  aria-label={`Increase quantity of ${item.product.name}`}
                                  className="w-7 h-7 flex items-center justify-center text-white font-semibold hover:bg-white/20 active:scale-90 rounded transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                                  disabled={item.qty >= item.product.stockQuantity}
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.product.id)}
                                aria-label={`Remove ${item.product.name} from cart`}
                                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-100 hover:border-red-600 active:scale-90 transition-all shrink-0"
                              >
                                <IcTrash />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary - Right Column (1/3 on desktop, sticky) */}
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-6 bg-white rounded-xl p-5 border border-gray-100 shadow-sm animate-card-in stagger-2">
                    <h3 className="font-bold text-gray-900 mb-4 text-base">Order Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal ({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
                        <span className="font-medium">₹{cartSubtotal}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Delivery</span>
                        <span className="text-emerald-600 font-medium">FREE</span>
                      </div>
                      <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-lg">
                        <span>Total</span>
                        <span className="text-gray-900">₹{cartTotal}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('checkout')}
                      className="w-full mt-5 bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-gray-800 active:scale-[0.99] transition-all shadow-xs"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </MainContent>

          {/* Mobile Checkout Button */}
          {isMobile && (
            <div className="bg-white border-t border-gray-100 shrink-0 p-4 animate-sheet-up">
              <button
                onClick={() => navigate('checkout')}
                className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-gray-800 active:scale-[0.99] transition-all shadow-xs"
              >
                Proceed to Checkout • ₹{cartTotal}
              </button>
            </div>
          )}
        </>
      )}

      {/* Bottom Navigation - only on mobile */}
      {isMobile && (
        <NavBottom
          activeBottomTab={activeBottomTab}
          cartCount={cartCount}
          onNavigate={onNavigate}
          onOpenCategory={onOpenCategory}
          categories={categories}
        />
      )}
    </div>
  )
}
