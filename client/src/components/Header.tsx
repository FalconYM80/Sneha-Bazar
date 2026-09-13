import React from 'react'
import { IcMapPin, IcBell, IcSearch, IcChevLeft, IcCart, IcUser } from './icons'

interface HeaderProps {
  searchQuery: string
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSearchFocus: () => void
  handleSearchBlur: () => void
  executeSearch: () => void
  cartCount: number
  onNavigate: (screen: string) => void
  isMobile?: boolean
  title?: string
  showBackButton?: boolean
  onBack?: () => void
  children?: React.ReactNode
}

export const Header = ({
  searchQuery,
  handleSearch,
  handleSearchFocus,
  handleSearchBlur,
  executeSearch,
  cartCount,
  onNavigate,
  isMobile = true,
  title,
  showBackButton,
  onBack,
  children
}: HeaderProps) => {
  // Mobile header
  if (isMobile) {
    return (
      <div className="bg-[#1F2937] px-4 pt-3 pb-4 border-b border-[rgba(255,255,255,0.1)] shrink-0 sticky top-0 z-50">
        {showBackButton && onBack ? (
          <div className="flex items-center gap-3 mb-3">
            <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 hover:bg-white/20 transition-all border border-white/20">
              <IcChevLeft />
            </button>
            <h1 className="font-extrabold text-white text-lg flex-1">{title}</h1>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Pickup at</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-white"><IcMapPin /></span>
                <span className="font-bold text-white text-sm">Sneha Bazar</span>
              </div>
            </div>
            <button className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white relative hover:bg-white/20 transition-all border border-white/20">
              <IcBell />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F59E0B] rounded-full" />
            </button>
          </div>
        )}
        <div className="relative">
          <div className="flex items-center bg-[#F5F6F4] rounded-xl px-3 py-2.5 gap-2 border border-white/20">
            <span className="text-[#64748B]"><IcSearch /></span>
            <input 
              className="text-[#1F2937] text-sm flex-1 bg-transparent outline-none placeholder-[#64748B]"
              placeholder="Search products, brands and categories..."
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
          {children}
        </div>
      </div>
    )
  }

  // Desktop header
  return (
    <div className="bg-[#1F2937] border-b border-[rgba(255,255,255,0.1)] shrink-0 sticky top-0 z-50">
      {/* Branding Row */}
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center gap-8">
          {/* Left: Branding */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shadow-sm border border-white/20">
                <span className="text-white text-2xl font-bold">S</span>
              </div>
              <div>
                <h1 className="font-extrabold text-white text-xl leading-tight">Sneha Bazar</h1>
                <p className="text-xs text-white/70 font-medium">Everything you need, in one place</p>
              </div>
            </div>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-2xl relative">
            <div className="flex items-center bg-[#F5F6F4] rounded-xl px-4 py-3 gap-3 border border-white/20 shadow-sm">
              <span className="text-[#64748B]"><IcSearch /></span>
              <input 
                className="text-[#1F2937] text-base flex-1 bg-transparent outline-none placeholder-[#64748B]"
                placeholder="Search products, brands and categories..."
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
            {children}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white relative hover:bg-white/20 transition-all border border-white/20">
              <IcBell />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F59E0B] rounded-full" />
            </button>
            <button
              onClick={() => onNavigate('cart')}
              className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white relative hover:bg-white/20 transition-all border border-white/20"
            >
              <IcCart />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F59E0B] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => onNavigate('profile')}
              className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20"
            >
              <IcUser />
            </button>
          </div>
        </div>
      </div>

      {/* Store Information Row - Shopping Context */}
      <div className="border-t border-[rgba(255,255,255,0.05)] bg-[#EEF1EE]">
        <div className="max-w-[1400px] mx-auto px-6 py-2">
          <div className="flex items-center gap-2 text-sm text-[#4B5563]">
            <span className="text-[#4B5563]"><IcMapPin /></span>
            <span className="font-medium">Pickup at:</span>
            <span className="font-semibold text-[#1F2937]">Sneha Bazar</span>
          </div>
        </div>
      </div>
    </div>
  )
}
