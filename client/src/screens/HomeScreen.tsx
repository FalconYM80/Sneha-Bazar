import type { Product } from '../types/app'
import type { FrontendCartItem } from '../types/cart'
import type { FrontendCategory } from '../types/product'
import { SearchDropdown } from '../components/SearchDropdown'
import { ProductCard } from '../components/ProductCard'
import { NavBottom } from '../components/NavBottom'
import { IcMapPin, IcBell, IcSearch, IcChevDown } from '../components/icons'

interface HomeScreenProps {
  products: Product[]
  categories: FrontendCategory[]
  isLoadingCategories: boolean
  isLoadingProducts: boolean
  categoriesError: string
  productsError: string
  searchQuery: string
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSearchFocus: () => void
  handleSearchBlur: () => void
  executeSearch: () => void
  openCategory: (catId: string) => void
  showSearchDropdown: boolean
  isSearching: boolean
  searchSuggestions: Product[]
  handleSuggestionClick: (product: Product) => void
  cart: FrontendCartItem[]
  addToCart: (product: Product) => void
  openProduct: (product: Product) => void
  activeBottomTab: 'home' | 'categories' | 'cart' | 'orders' | 'profile'
  onNavigate: (screen: string) => void
}

export const HomeScreen = ({
  products,
  categories,
  isLoadingCategories,
  isLoadingProducts,
  categoriesError,
  productsError,
  searchQuery,
  handleSearch,
  handleSearchFocus,
  handleSearchBlur,
  executeSearch,
  openCategory,
  showSearchDropdown,
  isSearching,
  searchSuggestions,
  handleSuggestionClick,
  cart,
  addToCart,
  openProduct,
  activeBottomTab,
  onNavigate
}: HomeScreenProps) => {
  const featured = [
    ...products.filter(p => p.originalPrice),
    ...products.filter(p => !p.originalPrice).slice(0, 3),
  ].slice(0, 6)

  const cartCount = cart.reduce((s, i) => s + (i.qty || 0), 0)

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 pt-2 pb-3 shadow-sm shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Pickup at</p>
            <button className="flex items-center gap-1 mt-0.5">
              <span className="text-green-600"><IcMapPin /></span>
              <span className="font-bold text-gray-900 text-sm">Vamanjoor Store</span>
              <span className="text-gray-500"><IcChevDown /></span>
            </button>
          </div>
          <button className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 relative">
            <IcBell />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
          </button>
        </div>
        <div className="mt-3 relative">
          <div className="flex items-center bg-gray-100 rounded-xl px-3 py-2.5 gap-2">
            <span className="text-gray-400"><IcSearch /></span>
            <input 
              className="text-gray-900 text-sm flex-1 bg-transparent outline-none placeholder-gray-400"
              placeholder="Search vegetables, fruits, dairy..."
              value={searchQuery}
              onChange={handleSearch}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  executeSearch()
                }
              }}
            />
          </div>
          <SearchDropdown
            showSearchDropdown={showSearchDropdown}
            isSearching={isSearching}
            searchSuggestions={searchSuggestions}
            searchQuery={searchQuery}
            handleSuggestionClick={handleSuggestionClick}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Promo Banner */}
        <div className="mx-4 mt-4 rounded-2xl overflow-hidden h-36 relative bg-orange-500 shrink-0">
          <img
            src="https://images.unsplash.com/photo-1588519722329-51b46166ecbd?w=700&h=300&fit=crop&auto=format"
            alt="Fresh vegetables promotion"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 flex flex-col justify-center px-5">
            <span className="bg-white/25 backdrop-blur-sm w-fit px-2.5 py-0.5 rounded-full mb-2 text-white text-[10px] font-bold uppercase tracking-widest">
              🔥 Limited Offer
            </span>
            <h3 className="text-white font-extrabold text-xl leading-tight">Fresh Vegetables<br />Up to 30% Off</h3>
            <button
              onClick={() => {
                if (categories.length > 0) openCategory(categories[0].id)
              }}
              className="mt-2 bg-white text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full w-fit shadow-md active:scale-95 transition-transform"
            >
              Shop Now →
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 mt-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-extrabold text-gray-900 text-base">Categories</h2>
            <button onClick={() => {
              if (categories.length > 0) openCategory(categories[0].id)
            }} className="text-green-600 text-sm font-semibold">See all</button>
          </div>
          {isLoadingCategories ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : categoriesError ? (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold">
              {categoriesError}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <span className="text-3xl mb-2">📂</span>
              <p className="text-sm font-semibold">No categories available</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => openCategory(cat.id)}
                  className="rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                  style={{ backgroundColor: cat.bg }}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-[11px] font-bold text-gray-800 text-center leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Special offer strip */}
        <div className="mx-4 mt-4 bg-green-600 rounded-2xl p-3.5 flex items-center gap-3">
          <span className="text-3xl">🏪</span>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">Order Online, Pick Up Fresh</p>
            <p className="text-green-100 text-xs">Ready in as fast as 10 minutes</p>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-1.5">
            <span className="text-white text-xs font-bold">Today only</span>
          </div>
        </div>

        {/* Popular Products */}
        <div className="mt-5 px-4 pb-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-extrabold text-gray-900 text-base">Popular Products</h2>
            <button onClick={() => {
              if (categories.length > 0) openCategory(categories[0].id)
            }} className="text-green-600 text-sm font-semibold">See all</button>
          </div>
          {isLoadingProducts ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : productsError ? (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold">
              {productsError}
            </div>
          ) : featured.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <span className="text-3xl mb-2">🛒</span>
              <p className="text-sm font-semibold">No products available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {featured.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  cart={cart}
                  onAddToCart={addToCart}
                  onProductClick={openProduct}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <NavBottom
        activeBottomTab={activeBottomTab}
        cartCount={cartCount}
        onNavigate={onNavigate}
        onOpenCategory={openCategory}
        categories={categories}
      />
    </div>
  )
}
