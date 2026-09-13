import { NavBottom } from '../components/NavBottom'
import { Header } from '../components/Header'
import { Navigation } from '../components/Navigation'
import { MainContent } from '../components/PageContainer'
import { IcUser, IcLocation, IcHelp, IcExternalLink } from '../components/icons'
import { shopConfig } from '../config/shopConfig'

interface ProfileScreenProps {
  customer: { name?: string; phone?: string; email?: string } | null
  navigate: (screen: string) => void
  logout: () => void
  clearNavigationState: () => void
  setCart: (cart: any[]) => void
  activeBottomTab: 'home' | 'categories' | 'cart' | 'orders' | 'profile'
  onNavigate: (screen: string) => void
  onOpenCategory: (catId: string) => void
  categories: { id: string }[]
  isMobile?: boolean
}

export const ProfileScreen = ({
  customer,
  navigate,
  logout,
  clearNavigationState,
  setCart,
  activeBottomTab,
  onNavigate,
  onOpenCategory,
  categories,
  isMobile = true
}: ProfileScreenProps) => (
  <div className="flex-1 flex flex-col bg-[#F7F6F2] overflow-hidden">
    {/* Header */}
    <Header
      searchQuery=""
      handleSearch={() => {}}
      handleSearchFocus={() => {}}
      handleSearchBlur={() => {}}
      executeSearch={() => {}}
      cartCount={0}
      onNavigate={onNavigate}
      isMobile={isMobile}
      title="Profile"
    />

    {/* Desktop Navigation - hidden on mobile */}
    {!isMobile && (
      <Navigation 
        activeTab={activeBottomTab} 
        onNavigate={onNavigate} 
        isMobile={false} 
      />
    )}

    <MainContent className="flex-1 overflow-y-auto lg:max-w-[1100px]">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB] mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center font-extrabold text-gray-600 text-2xl md:text-3xl shadow-sm border border-gray-200 shrink-0">
            {customer?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-gray-900 font-extrabold text-lg md:text-xl lg:text-2xl">{customer?.name || 'Guest'}</h2>
            <p className="text-gray-500 text-sm md:text-base">+91 {customer?.phone || ''}</p>
            {customer?.email && <p className="text-gray-400 text-xs mt-0.5">{customer.email}</p>}
          </div>
          <button className="bg-white text-gray-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-300 hover:bg-[#F8F9FA] transition-colors">
            Edit
          </button>
        </div>
      </div>

      {/* Account Section */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E5E7EB] mb-4">
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-4 pt-3.5 pb-2 md:px-6 md:pt-4 md:pb-3">Account</p>
        
        {/* Personal Information */}
        <button className="w-full flex items-center gap-3 px-4 py-3.5 md:px-6 md:py-4 text-left hover:bg-[#F8F9FA] transition-colors">
          <span className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-gray-600 shrink-0 bg-gray-50">
            <IcUser />
          </span>
          <div className="flex-1">
            <p className="text-sm md:text-base font-semibold text-gray-900">Personal Information</p>
            <p className="text-xs md:text-sm text-gray-400 mt-0.5">Name, email, mobile number</p>
          </div>
          <span className="text-gray-300 font-bold text-lg">›</span>
        </button>

        {/* Pickup Location */}
        <div className="border-t border-[#E5E7EB]">
          <div className="px-4 py-3 md:px-6 md:py-3">
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-gray-600 shrink-0 bg-gray-50 mt-0.5">
                <IcLocation />
              </span>
              <div className="flex-1">
                <p className="text-sm md:text-base font-semibold text-gray-900 mb-1">Pickup Location</p>
                <p className="text-sm text-gray-600 font-medium">{shopConfig.shopName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{shopConfig.address.line1}</p>
                <p className="text-xs text-gray-500">{shopConfig.address.line2}</p>
                <p className="text-xs text-gray-500">{shopConfig.address.area}, {shopConfig.address.city} – {shopConfig.address.pincode}</p>
                <a 
                  href={shopConfig.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#2563EB] font-semibold mt-1.5 hover:underline"
                >
                  View on Google Maps <IcExternalLink />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Need Help */}
        <button className="w-full flex items-center gap-3 px-4 py-3.5 md:px-6 md:py-4 text-left hover:bg-[#F8F9FA] transition-colors border-t border-[#E5E7EB]">
          <span className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-gray-600 shrink-0 bg-gray-50">
            <IcHelp />
          </span>
          <div className="flex-1">
            <p className="text-sm md:text-base font-semibold text-gray-900">Need Help</p>
            <p className="text-xs md:text-sm text-gray-400 mt-0.5">We're here to help</p>
          </div>
          <span className="text-gray-300 font-bold text-lg">›</span>
        </button>
      </div>

      <div className="flex justify-center mt-4 mb-4">
        <button
          onClick={() => { logout(); setCart([]); clearNavigationState(); navigate('login') }}
          className="w-[120px] h-[44px] bg-[#DC2626] text-white font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
        >
          Logout
        </button>
      </div>

      <p className="text-center text-gray-300 text-[10px] md:text-xs pb-4 font-medium">Sneha Bazar v2.4.1</p>
    </MainContent>

    {/* Bottom Navigation - only on mobile */}
    {isMobile && (
      <NavBottom
        activeBottomTab={activeBottomTab}
        cartCount={0}
        onNavigate={onNavigate}
        onOpenCategory={onOpenCategory}
        categories={categories}
      />
    )}
  </div>
)
