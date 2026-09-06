import React from 'react'
import { IcHome, IcGrid, IcCart, IcPackage, IcUser } from './icons'
import type { BottomTab } from '../types/app'

interface NavBottomProps {
  activeBottomTab: BottomTab
  cartCount: number
  onNavigate: (screen: string) => void
  onOpenCategory: (categoryId: string) => void
  categories: { id: string }[]
}

export const NavBottom = ({ activeBottomTab, cartCount, onNavigate, onOpenCategory, categories }: NavBottomProps) => {
  const tabs: Array<{ id: BottomTab; label: string; Icon: () => React.ReactNode; badge?: number; action: () => void }> = [
    { id: 'home', label: 'Home', Icon: IcHome, action: () => onNavigate('home') },
    { id: 'categories', label: 'Browse', Icon: IcGrid, action: () => onOpenCategory(categories[0]?.id || '') },
    { id: 'cart', label: 'Cart', Icon: IcCart, badge: cartCount, action: () => onNavigate('cart') },
    { id: 'orders', label: 'Orders', Icon: IcPackage, action: () => onNavigate('orders') },
    { id: 'profile', label: 'Profile', Icon: IcUser, action: () => onNavigate('profile') },
  ]
  
  return (
    <div className="bg-white border-t border-gray-100 px-1 py-1.5 flex justify-around shrink-0">
      {tabs.map(tab => (
        <button key={tab.id} onClick={tab.action} className="flex flex-col items-center gap-0.5 px-3 py-1 relative min-w-[52px]">
          <span className={activeBottomTab === tab.id ? 'text-green-600' : 'text-gray-400'}>
            <tab.Icon />
          </span>
          {tab.badge && tab.badge > 0 ? (
            <span className="absolute top-0.5 right-1.5 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {tab.badge > 9 ? '9+' : tab.badge}
            </span>
          ) : null}
          <span className={`text-[10px] font-semibold ${activeBottomTab === tab.id ? 'text-green-600' : 'text-gray-400'}`}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
