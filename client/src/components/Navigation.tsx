import { IcHome, IcGrid, IcCart, IcPackage, IcUser } from './icons'

interface NavigationProps {
  activeTab: 'home' | 'categories' | 'cart' | 'orders' | 'profile'
  onNavigate: (screen: string) => void
  isMobile?: boolean
}

export const Navigation = ({ activeTab, onNavigate, isMobile = false }: NavigationProps) => {
  const navItems = [
    { id: 'home' as const, label: 'Home', icon: IcHome, screen: 'home' },
    { id: 'categories' as const, label: 'Browse', icon: IcGrid, screen: 'product-list' },
    { id: 'cart' as const, label: 'Cart', icon: IcCart, screen: 'cart' },
    { id: 'orders' as const, label: 'Orders', icon: IcPackage, screen: 'orders' },
    { id: 'profile' as const, label: 'Profile', icon: IcUser, screen: 'profile' },
  ]

  // Desktop navigation
  if (!isMobile) {
    return (
      <div className="bg-[#FAFAF8] border-b border-[rgba(30,41,59,0.06)] shrink-0">
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
