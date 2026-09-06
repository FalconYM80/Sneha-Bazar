import type { Product } from '../types/app'
import type { FrontendCartItem } from '../types/cart'
import type { FrontendCategory } from '../types/product'
import { SearchDropdown } from '../components/SearchDropdown'
import { ProductCard } from '../components/ProductCard'
import { NavBottom } from '../components/NavBottom'
import { IcChevLeft, IcSearch, IcFilter } from '../components/icons'

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
  openProduct: (product: Product) => void
  activeBottomTab: 'home' | 'categories' | 'cart' | 'orders' | 'profile'
  onNavigate: (screen: string) => void
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
  openProduct,
  activeBottomTab,
  onNavigate
}: ProductListScreenProps) => {
  const cat = categories.find(c => c.id === selectedCategory)
  const filtered = products // Already filtered by the useEffect based on selectedCategory and searchQuery

  const cartCount = cart.reduce((s, i) => s + (i.qty || 0), 0)

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-white px-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('home')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
            <IcChevLeft />
          </button>
          <h1 className="font-extrabold text-gray-900 text-lg flex-1">{cat?.name || 'Products'}</h1>
          <span className="text-2xl">{cat?.emoji || '🛒'}</span>
        </div>
        <div className="flex gap-2 mb-3 relative">
          <div className="flex-1 flex items-center bg-gray-100 rounded-xl px-3 py-2.5 gap-2">
            <span className="text-gray-400 shrink-0"><IcSearch /></span>
            <input
              className="text-gray-900 text-sm flex-1 bg-transparent outline-none placeholder-gray-400"
              placeholder={`Search in ${cat?.name || 'products'}...`}
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
          <button
            onClick={executeSearch}
            className="w-11 h-11 bg-green-600 rounded-xl flex items-center justify-center text-white shrink-0 hover:bg-green-700 transition-colors"
          >
            <IcSearch />
          </button>
          <button className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 shrink-0">
            <IcFilter />
          </button>
          <SearchDropdown
            showSearchDropdown={showSearchDropdown}
            isSearching={isSearching}
            searchSuggestions={searchSuggestions}
            searchQuery={searchQuery}
            handleSuggestionClick={handleSuggestionClick}
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 px-4 py-2.5 bg-white border-b border-gray-100 overflow-x-auto shrink-0">
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${c.id === selectedCategory ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <span>{c.emoji}</span> {c.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoadingProducts ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : productsError ? (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold">
            {productsError}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3 font-semibold">{filtered.length} products found</p>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    cart={cart}
                    onAddToCart={addToCart}
                    onProductClick={openProduct}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <span className="text-5xl mb-3">🛒</span>
                <p className="text-sm font-semibold">No products found</p>
              </div>
            )}
          </>
        )}
      </div>

      <NavBottom
        activeBottomTab={activeBottomTab}
        cartCount={cartCount}
        onNavigate={onNavigate}
        onOpenCategory={(catId) => setSelectedCategory(catId)}
        categories={categories}
      />
    </div>
  )
}
