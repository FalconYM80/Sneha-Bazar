import { useState } from 'react'
import type { FrontendCategory } from '../types/product'
import { IcClose, IcSearchSmall } from './icons'

interface CategoryBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  categories: FrontendCategory[]
  selectedCategory: string
  onSelectCategory: (categoryId: string) => void
}

export const CategoryBottomSheet = ({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory
}: CategoryBottomSheetProps) => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl animate-sheet-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <IcClose />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <IcSearchSmall />
            </div>
            <input
              type="text"
              placeholder="Search categories"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* All Products - Full width */}
          <button
            onClick={() => {
              onSelectCategory('')
              onClose()
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-3 transition-colors ${
              selectedCategory === ''
                ? 'bg-emerald-50/60 text-emerald-900 border-2 border-emerald-600'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-gray-200">
              <span className="text-base font-bold text-gray-600">A</span>
            </div>
            <span className="text-sm font-medium flex-1 text-left">All Products</span>
            {selectedCategory === '' && (
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 gap-3">
            {filteredCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id)
                  onClose()
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${
                  cat.id === selectedCategory
                    ? 'bg-emerald-50/60 text-emerald-900 border-2 border-emerald-600'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ backgroundColor: cat.accentColor || cat.fallbackColor || '#F5F5F5' }}
                >
                  {cat.thumbnail ? (
                    <img
                      src={cat.thumbnail}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-500">
                      {cat.name.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-center line-clamp-2 leading-tight">{cat.name}</span>
                {cat.id === selectedCategory && (
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No categories found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
