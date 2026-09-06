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
    <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 mt-2 z-50 max-h-96 overflow-y-auto">
      {isSearching ? (
        <div className="p-4 text-center text-gray-400 text-sm">
          Searching...
        </div>
      ) : searchSuggestions.length > 0 ? (
        searchSuggestions.map(product => (
          <button
            key={product.id}
            onClick={() => handleSuggestionClick(product)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-product.svg'
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-green-700">₹{product.price}</p>
              <p className="text-xs text-gray-400">{product.unit || ''}</p>
            </div>
          </button>
        ))
      ) : (
        <div className="p-4 text-center text-gray-400 text-sm">
          {searchQuery.trim() ? 'No products found' : 'No recommendations available'}
        </div>
      )}
    </div>
  )
}
