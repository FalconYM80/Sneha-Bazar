import { NavBottom } from '../components/NavBottom'
import { Header } from '../components/Header'
import { Navigation } from '../components/Navigation'
import { MainContent } from '../components/PageContainer'

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
  <div className="flex-1 flex flex-col bg-[#FCFCFA] overflow-hidden">
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

    <MainContent className="flex-1 overflow-y-auto lg:max-w-4xl">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
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

      {/* Stats with multi-accent design */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm mb-4 grid grid-cols-3 gap-3 border border-gray-100">
        {[
          { label: 'Total Orders', value: '24', icon: '📦', bg: '#EFF6FF', text: '#1D4ED8' },
          { label: 'Savings', value: '₹1,240', icon: '💰', bg: '#FEF3C7', text: '#D97706' },
          { label: 'Addresses', value: '3', icon: '📍', bg: '#FCE7F3', text: '#DB2777' },
        ].map(stat => (
          <div key={stat.label} className="text-center py-2 rounded-xl" style={{ backgroundColor: stat.bg }}>
            <div className="text-2xl md:text-3xl mb-1">{stat.icon}</div>
            <p className="font-extrabold text-sm md:text-base" style={{ color: stat.text }}>{stat.value}</p>
            <p className="text-gray-600 text-[10px] md:text-xs font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Account Section */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-4">
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-4 pt-3.5 pb-2 md:px-6 md:pt-4 md:pb-3">Account</p>
        {[
          { icon: '👤', label: 'Personal Information', sub: 'Name, email, mobile number', bg: '#F0FDF4', iconColor: '#16A34A' },
          { icon: '📍', label: 'Saved Addresses', sub: '3 addresses saved', bg: '#FEF3C7', iconColor: '#D97706' },
          { icon: '💳', label: 'Payment Methods', sub: 'UPI, Cards, Wallets', bg: '#DBEAFE', iconColor: '#2563EB' },
        ].map((item, i) => (
          <button key={item.label} className={`w-full flex items-center gap-3 px-4 py-3.5 md:px-6 md:py-4 text-left hover:bg-[#F8F9FA] transition-colors ${i > 0 ? 'border-t border-gray-50' : ''}`}>
            <span className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-base md:text-lg shrink-0" style={{ backgroundColor: item.bg, color: item.iconColor }}>{item.icon}</span>
            <div className="flex-1">
              <p className="text-sm md:text-base font-semibold text-gray-900">{item.label}</p>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">{item.sub}</p>
            </div>
            <span className="text-gray-300 font-bold text-lg">›</span>
          </button>
        ))}
      </div>

      {/* Orders & Support */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-4">
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-4 pt-3.5 pb-2 md:px-6 md:pt-4 md:pb-3">Orders & Support</p>
        {[
          { icon: '📦', label: 'Order History', sub: '24 orders placed', action: () => navigate('orders'), bg: '#EFF6FF', iconColor: '#3B82F6' },
          { icon: '🎫', label: 'My Coupons', sub: '2 coupons available', action: () => {}, bg: '#FEF3C7', iconColor: '#F59E0B' },
          { icon: '💬', label: 'Help & Support', sub: 'Chat, Email, Call us', action: () => {}, bg: '#FCE7F3', iconColor: '#EC4899' },
          { icon: '⭐', label: 'Rate Sneha Bazar', sub: "Loved our app? Let us know!", action: () => {}, bg: '#FEF9C3', iconColor: '#EAB308' },
        ].map((item, i) => (
          <button key={item.label} onClick={item.action} className={`w-full flex items-center gap-3 px-4 py-3.5 md:px-6 md:py-4 text-left hover:bg-[#F8F9FA] transition-colors ${i > 0 ? 'border-t border-gray-50' : ''}`}>
            <span className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-base md:text-lg shrink-0" style={{ backgroundColor: item.bg, color: item.iconColor }}>{item.icon}</span>
            <div className="flex-1">
              <p className="text-sm md:text-base font-semibold text-gray-900">{item.label}</p>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">{item.sub}</p>
            </div>
            <span className="text-gray-300 font-bold text-lg">›</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => { logout(); setCart([]); clearNavigationState(); navigate('login') }}
        className="w-full bg-white border-2 border-red-200 text-red-600 py-4 md:py-5 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-2 mb-3 hover:bg-red-50 transition-colors"
      >
        🚪 Logout
      </button>

      <p className="text-center text-gray-300 text-[10px] md:text-xs pb-4 font-medium">Sneha Bazar v2.4.1 • Made with ❤️ in India</p>
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
