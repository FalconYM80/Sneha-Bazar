import React from 'react'
import { IcHome, IcGrid, IcCart, IcPackage, IcUser } from './icons'
import type { BottomTab } from '../types/app'

interface NavigationProps {
  activeTab: BottomTab
  onNavigate: (screen: string) => void
  isMobile?: boolean
}

export const Navigation = ({ activeTab, onNavigate, isMobile = false }: NavigationProps) => {
  const navItems: Array<{ id: BottomTab; label: string; icon: () => React.ReactNode; screen: string }> = [
    { id: 'home', label: 'Home', icon: IcHome, screen: 'home' },
    { id: 'categories', label: 'Browse', icon: IcGrid, screen: 'product-list' },
    { id: 'cart', label: 'Cart', icon: IcCart, screen: 'cart' },
    { id: 'orders', label: 'Orders', icon: IcPackage, screen: 'orders' },
    { id: 'profile', label: 'Profile', icon: IcUser, screen: 'profile' },
  ]

  // Desktop navigation
  if (!isMobile) {
    return (
      <div className="bg-white border-b border-[#E5E7EB] shrink-0">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex gap-1 py-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.screen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#E7F0E9] text-[#166534]'
                      : 'text-[#64748B] hover:bg-[#F8F9FA] hover:text-[#1E293B]'
                  }`}
                >
                  <Icon />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Mobile navigation is handled by NavBottom component
  return null
}
