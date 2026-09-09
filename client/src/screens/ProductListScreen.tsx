import type { Product } from '../types/app'
import type { FrontendCartItem } from '../types/cart'
import type { FrontendCategory } from '../types/product'
import { getCategoryAccentColor, getCategoryFallbackColor } from '../types/product'
import { SearchDropdown } from '../components/SearchDropdown'
import { ProductCard } from '../components/ProductCard'
import { ProductSkeleton } from '../components/ProductSkeleton'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { NavBottom } from '../components/NavBottom'
import { Header } from '../components/Header'
import { Navigation } from '../components/Navigation'
import { MainContent } from '../components/PageContainer'
import { useEffect, useRef, useCallback } from 'react'

interface ProductListScreenProps {
  products: Product[]
  categories: FrontendCategory[]
  selectedCategory: string
  isLoadingProducts: boolean
  productsError: string
  searchQuery: string
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSearchFocus: () => void
  handleSearchBlur: () => void
  executeSearch: () => void
  setSelectedCategory: (catId: string) => void
  navigate: (s: string) => void
  showSearchDropdown: boolean
  isSearching: boolean
  searchSuggestions: Product[]
  handleSuggestionClick: (product: Product) => void
  cart: FrontendCartItem[]
  addToCart: (product: Product) => void
  updateQuantity: (productId: string, delta: number) => void
  openProduct: (product: Product) => void
  activeBottomTab: 'home' | 'categories' | 'cart' | 'orders' | 'profile'
  onNavigate: (screen: string) => void
  isMobile?: boolean
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}

export const ProductListScreen = ({
  products,
  categories,
  selectedCategory,
  isLoadingProducts,
  productsError,
  searchQuery,
  handleSearch,
  handleSearchFocus,
  handleSearchBlur,
  executeSearch,
  setSelectedCategory,
  navigate,
  showSearchDropdown,
  isSearching,
  searchSuggestions,
  handleSuggestionClick,
  cart,
  addToCart,
  updateQuantity,
  openProduct,
  activeBottomTab,
  onNavigate,
  isMobile = true,
  hasMore = true,
  isLoadingMore = false,
  onLoadMore
}: ProductListScreenProps) => {
  const cat = categories.find(c => c.id === selectedCategory)
  const filtered = products // Already filtered by the useEffect based on selectedCategory and searchQuery
  
  // Ensure categories have accent colors (fallback if not populated)
  const categoriesWithColors = categories.map(c => ({
    ...c,
    accentColor: c.accentColor || getCategoryAccentColor(c.name),
    fallbackColor: c.fallbackColor || getCategoryFallbackColor(c.name),
  }))

  const cartCount = cart.reduce((s, i) => s + (i.qty || 0), 0)

  // Scroll-based infinite loading
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Use refs to avoid stale closures in scroll handler
  const hasMoreRef = useRef(hasMore)
  const isLoadingMoreRef = useRef(isLoadingMore)
  const onLoadMoreRef = useRef(onLoadMore)

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore
  }, [isLoadingMore])

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    if (isLoadingMoreRef.current) return
    if (!hasMoreRef.current) return
    if (!onLoadMoreRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    // Load more when user is within 700px of bottom
    if (distanceFromBottom < 700) {
      onLoadMoreRef.current()
    }
  }, [])

  // Attach scroll listener once
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Handle short pages - auto-load if content doesn't fill container
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    if (isLoadingMoreRef.current) return
    if (!hasMoreRef.current) return
    if (!onLoadMoreRef.current) return

    // Check if content is shorter than container height
    if (container.scrollHeight <= container.clientHeight) {
      onLoadMoreRef.current()
    }
  }, [products, hasMore, isLoadingMore])

  const CategorySidebar = () => (
    <div className="w-20 md:w-64 shrink-0 bg-white border-r border-gray-100 overflow-y-auto custom-scrollbar">
      <div className="p-2 md:p-4">
        <h3 className="hidden md:block text-sm font-semibold text-gray-900 mb-3">Categories</h3>
        <div className="space-y-1">
          <button
            onClick={() => setSelectedCategory('')}
            className={`w-full flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 py-2 md:px-3 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
              selectedCategory === ''
                ? 'bg-gray-100 text-gray-900 border-l-2 border-gray-900'
                : 'text-gray-600 hover:bg-[#F8F9FA]'
            }`}
          >
            <div className="w-10 h-10 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 bg-gray-200">
              <span className="text-sm font-bold text-gray-600">A</span>
            </div>
            <span className="text-center md:text-left line-clamp-2">{isMobile ? 'All' : 'All Products'}</span>
          </button>
          {categoriesWithColors.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`w-full flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 py-2 md:px-3 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                c.id === selectedCategory
                  ? 'bg-gray-100 text-gray-900 border-l-2 border-gray-900'
                  : 'text-gray-600 hover:bg-[#F8F9FA]'
              }`}
            >
              <div 
                className="w-10 h-10 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                style={{ backgroundColor: c.accentColor || c.fallbackColor || '#F5F5F5' }}
              >
                {c.thumbnail ? (
                  <img 
                    src={c.thumbnail} 
                    alt={c.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-500">
                    {c.name.charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-center md:text-left line-clamp-2">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-[#FCFCFA] overflow-hidden">
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
        title={selectedCategory === '' ? 'All Products' : (cat?.name || 'Products')}
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

      {/* Unified Layout: Sidebar + Main Content (works for both desktop and mobile) */}
      <div className="flex-1 flex overflow-hidden">
        <CategorySidebar />
        <MainContent className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
          {isMobile ? (
            <>
              {isLoadingProducts ? (
                <div className="grid gap-3 grid-cols-2 px-3 py-3">
                  {[...Array(6)].map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : productsError ? (
                <div className="px-3 py-3">
                  <ErrorState message={productsError} />
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-400 mb-2 font-semibold px-3">{filtered.length} products</p>
                  {filtered.length > 0 ? (
                    <>
                      <div className="grid gap-2.5 grid-cols-2 px-3 pb-3">
                        {filtered.map(product => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            cart={cart}
                            onAddToCart={addToCart}
                            onUpdateQuantity={updateQuantity}
                            onProductClick={openProduct}
                          />
                        ))}
                      </div>

                      {isLoadingMore && (
                        <div className="flex flex-col items-center justify-center py-4 gap-2">
                          <div className="w-5 h-5 border-3 border-gray-300 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-gray-500">Loading more...</span>
                        </div>
                      )}

                      {!hasMore && filtered.length > 0 && (
                        <div className="text-center py-3 text-gray-400 text-xs">
                          You're all caught up 🎉
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="px-3 py-3">
                      <EmptyState 
                        icon="🛒"
                        title="No products found"
                        subtitle="Try selecting a different category"
                      />
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {selectedCategory === '' ? 'All Products' : (cat?.name || 'Products')}
                </h1>
                <p className="text-sm text-gray-500">
                  Explore our complete collection
                </p>
              </div>

              {isLoadingProducts ? (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {[...Array(10)].map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : productsError ? (
                <ErrorState message={productsError} />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">{filtered.length} products</p>
                  </div>
                  
                  {filtered.length > 0 ? (
                    <>
                      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {filtered.map(product => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            cart={cart}
                            onAddToCart={addToCart}
                            onUpdateQuantity={updateQuantity}
                            onProductClick={openProduct}
                          />
                        ))}
                      </div>

                      {isLoadingMore && (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <div className="w-6 h-6 border-3 border-gray-300 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-gray-500">Loading more products...</span>
                        </div>
                      )}

                      {!hasMore && filtered.length > 0 && (
                        <div className="text-center py-6 text-gray-400 text-sm">
                          You're all caught up 🎉
                        </div>
                      )}
                    </>
                  ) : (
                    <EmptyState 
                      icon="🛒"
                      title="No products found"
                      subtitle="Try selecting a different category"
                    />
                  )}
                </>
              )}
            </div>
          )}
        </MainContent>
      </div>

      {/* Bottom Navigation - only on mobile */}
      {isMobile && (
        <NavBottom
          activeBottomTab={activeBottomTab}
          cartCount={cartCount}
          onNavigate={onNavigate}
          onOpenCategory={(catId) => setSelectedCategory(catId)}
          categories={categories}
        />
      )}
    </div>
  )
}
