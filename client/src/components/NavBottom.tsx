import React from 'react'
import { IcHome, IcGrid, IcCart, IcPackage, IcUser } from './icons'
import type { BottomTab } from '../types/app'

interface NavBottomProps {
  activeBottomTab: BottomTab
  cartCount: number
  onNavigate: (screen: string) => void
  onOpenCategory: (categoryId: string) => void
  categories?: { id: string }[]
}

export const NavBottom = ({ activeBottomTab, cartCount, onNavigate, onOpenCategory, categories: _categories }: NavBottomProps) => {
  const tabs: Array<{ id: BottomTab; label: string; Icon: () => React.ReactNode; badge?: number; action: () => void }> = [
    { id: 'home', label: 'Home', Icon: IcHome, action: () => onNavigate('home') },
    { id: 'categories', label: 'Browse', Icon: IcGrid, action: () => onOpenCategory('') },
    { id: 'cart', label: 'Cart', Icon: IcCart, badge: cartCount, action: () => onNavigate('cart') },
    { id: 'orders', label: 'Orders', Icon: IcPackage, action: () => onNavigate('orders') },
    { id: 'profile', label: 'Profile', Icon: IcUser, action: () => onNavigate('profile') },
  ]
  
  return (
    <div className="bg-white border-t border-[#E5E7EB] px-1 py-1.5 flex justify-around shrink-0">
      {tabs.map(tab => (
        <button 
          key={tab.id} 
          onClick={tab.action} 
          className={`flex flex-col items-center gap-0.5 px-3 py-1 relative min-w-[52px] rounded-lg transition-all ${
            activeBottomTab === tab.id ? 'bg-[#E7F0E9]' : 'hover:bg-[#F8F9FA]'
          }`}
        >
          <span className={activeBottomTab === tab.id ? 'text-[#166534]' : 'text-[#64748B]'}>
            <tab.Icon />
          </span>
          {tab.badge && tab.badge > 0 ? (
            <span className="absolute top-0.5 right-1.5 w-4 h-4 bg-[#F59E0B] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {tab.badge > 9 ? '9+' : tab.badge}
            </span>
          ) : null}
          <span className={`text-[10px] font-semibold ${activeBottomTab === tab.id ? 'text-[#166534]' : 'text-[#64748B]'}`}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
