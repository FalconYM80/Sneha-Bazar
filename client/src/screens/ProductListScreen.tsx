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
import { CategoryBottomSheet } from '../components/CategoryBottomSheet'
import { IcCategory, IcChevDown, IcChevUp } from '../components/icons'
import { useEffect, useRef, useCallback, useState } from 'react'

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
  totalProducts?: number
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
  onLoadMore,
  totalProducts
}: ProductListScreenProps) => {
  const cat = categories.find(c => c.id === selectedCategory)
  const filtered = products // Already filtered by the useEffect based on selectedCategory and searchQuery
  const totalCount = typeof totalProducts === 'number' ? totalProducts : filtered.length
  
  // Ensure categories have accent colors (fallback if not populated)
  const categoriesWithColors = categories.map(c => ({
    ...c,
    accentColor: c.accentColor || getCategoryAccentColor(c.name),
    fallbackColor: c.fallbackColor || getCategoryFallbackColor(c.name),
  }))

  const cartCount = cart.reduce((s, i) => s + (i.qty || 0), 0)

  // Mobile category bottom sheet state
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false)

  // Floating scroll to top state
  const [showScrollTop, setShowScrollTop] = useState(false)

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

    const { scrollTop, scrollHeight, clientHeight } = container

    // Show button after user scrolls past ~450px
    setShowScrollTop(scrollTop > 450)

    if (isLoadingMoreRef.current) return
    if (!hasMoreRef.current) return
    if (!onLoadMoreRef.current) return

    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    // Load more when user is within 700px of bottom
    if (distanceFromBottom < 700) {
      onLoadMoreRef.current()
    }
  }, [])

  // Smooth scroll to top handler
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Attach scroll listener once
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Reset scroll position to top whenever selectedCategory or searchQuery changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
      if (typeof scrollContainerRef.current.scrollTo === 'function') {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'auto' })
      }
    }
    window.scrollTo({
      top: 0,
      behavior: 'auto',
    })
    setShowScrollTop(false)
  }, [selectedCategory, searchQuery, isLoadingProducts])

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
    <div className="hidden md:block w-64 shrink-0 bg-white border-r border-gray-100 overflow-y-auto custom-scrollbar">
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Categories</h3>
        <div className="space-y-1">
          <button
            onClick={() => setSelectedCategory('')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === ''
                ? 'bg-emerald-50/50 text-emerald-900 border-l-2 border-emerald-600'
                : 'text-gray-600 hover:bg-[#F8F9FA]'
            }`}
          >
            <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-gray-200">
              <span className="text-sm font-bold text-gray-600">A</span>
            </div>
            <span className="text-left line-clamp-2">All Products</span>
          </button>
          {categoriesWithColors.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                c.id === selectedCategory
                  ? 'bg-emerald-50/50 text-emerald-900 border-l-2 border-emerald-600'
                  : 'text-gray-600 hover:bg-[#F8F9FA]'
              }`}
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
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
              <span className="text-left line-clamp-2">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const isSearchActive = Boolean(searchQuery.trim())

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
        title={isSearchActive ? 'All Products' : (selectedCategory === '' ? 'All Products' : (cat?.name || 'Products'))}
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
              {/* Category control row */}
              <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
                <button
                  onClick={() => setIsCategorySheetOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <IcCategory />
                  <span>Categories</span>
                  <IcChevDown />
                </button>
                <span className="text-xs text-gray-500 font-medium">{totalCount} products</span>
              </div>

              {isLoadingProducts ? (
                <div className="grid gap-3.5 grid-cols-2 px-4 py-4">
                  {[...Array(6)].map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : productsError ? (
                <div className="px-4 py-4">
                  <ErrorState message={productsError} />
                </div>
              ) : (
                <>
                  {filtered.length > 0 ? (
                    <>
                      <div className="grid gap-3.5 grid-cols-2 px-4 py-4 pb-24">
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
                    <div className="px-4 py-4">
                      <EmptyState
                        icon={isSearchActive ? "🔍" : "🛒"}
                        title="No products found"
                        subtitle={isSearchActive ? `No products found matching "${searchQuery.trim()}".` : "Try selecting a different category"}
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
                  {isSearchActive
                    ? `Search results for "${searchQuery.trim()}"`
                    : (selectedCategory === '' ? 'All Products' : (cat?.name || 'Products'))
                  }
                </h1>
                <p className="text-sm text-gray-500">
                  {isSearchActive ? 'Showing matching products across all categories' : 'Explore our complete collection'}
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
                    <p className="text-sm text-gray-500">{totalCount} products</p>
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
                      icon={isSearchActive ? "🔍" : "🛒"}
                      title="No products found"
                      subtitle={isSearchActive ? `No products found matching "${searchQuery.trim()}".` : "Try selecting a different category"}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </MainContent>
      </div>

      {/* Floating Scroll to Top Button - Mobile Browse only */}
      {isMobile && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className={`md:hidden fixed right-4 bottom-[72px] z-30 w-11 h-11 bg-white border border-stone-200 text-gray-800 rounded-full shadow-md flex items-center justify-center transition-all duration-300 ease-out active:scale-90 hover:bg-stone-50 ${
            showScrollTop
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
              : 'opacity-0 translate-y-3 scale-75 pointer-events-none'
          }`}
        >
          <IcChevUp />
        </button>
      )}

      {/* Bottom Navigation - only on mobile */}
      {isMobile && (
        <NavBottom
          activeBottomTab={activeBottomTab}
          cartCount={cartCount}
          onNavigate={onNavigate}
          onOpenCategory={(catId) => {
            setSelectedCategory(catId)
            setIsCategorySheetOpen(false)
          }}
          categories={categories}
        />
      )}

      {/* Mobile Category Bottom Sheet */}
      <CategoryBottomSheet
        isOpen={isCategorySheetOpen}
        onClose={() => setIsCategorySheetOpen(false)}
        categories={categoriesWithColors}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
    </div>
  )
}
