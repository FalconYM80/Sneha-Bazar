import type { Product } from '../types/app'

interface SearchDropdownProps {
  showSearchDropdown: boolean
  isSearching: boolean
  searchSuggestions: Product[]
  searchQuery: string
  handleSuggestionClick: (product: Product) => void
}

export const SearchDropdown = ({
  showSearchDropdown,
  isSearching,
  searchSuggestions,
  searchQuery,
  handleSuggestionClick
}: SearchDropdownProps) => {
  if (!showSearchDropdown) return null

  return (
    <div className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-100 mt-2 z-50 max-h-96 overflow-y-auto">
      {isSearching ? (
        <div className="p-6 text-center">
          <div className="w-6 h-6 border-3 border-[#0B8F3C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Searching...</p>
        </div>
      ) : searchSuggestions.length > 0 ? (
        <>
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Products</p>
          </div>
          {searchSuggestions.map(product => (
            <button
              key={product.id}
              onClick={() => handleSuggestionClick(product)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors border-b border-gray-50 last:border-0"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                {product.unit && (
                  <p className="text-xs text-gray-500 mt-0.5">{product.unit}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">₹{product.price}</p>
                {product.originalPrice && product.originalPrice > product.price && (
                  <p className="text-xs text-gray-400 line-through">₹{product.originalPrice}</p>
                )}
              </div>
            </button>
          ))}
        </>
      ) : (
        <div className="p-6 text-center">
          <span className="text-3xl mb-2 block">🔍</span>
          <p className="text-sm font-medium text-gray-500">
            {searchQuery.trim() ? 'No products found' : 'Start typing to search'}
          </p>
          {searchQuery.trim() && (
            <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
          )}
        </div>
      )}
    </div>
  )
}
