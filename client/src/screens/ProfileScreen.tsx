import { NavBottom } from '../components/NavBottom'

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
  categories
}: ProfileScreenProps) => (
  <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
    <div style={{ background: 'linear-gradient(135deg, #16a34a 0%, #065f46 100%)' }} className="px-4 pb-7 shrink-0">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-extrabold text-green-600 text-2xl shadow-lg shrink-0">
          {customer?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <h2 className="text-white font-extrabold text-lg">{customer?.name || 'Guest'}</h2>
          <p className="text-green-200 text-sm">+91 {customer?.phone || ''}</p>
          {customer?.email && <p className="text-green-300 text-xs mt-0.5">{customer.email}</p>}
        </div>
        <button className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/30">
          Edit
        </button>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto -mt-4 px-4">
      {/* Stats */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 grid grid-cols-3 gap-2 border border-gray-100">
        {[
          { label: 'Total Orders', value: '24', icon: '📦' },
          { label: 'Savings', value: '₹1,240', icon: '💰' },
          { label: 'Addresses', value: '3', icon: '📍' },
        ].map(stat => (
          <div key={stat.label} className="text-center py-1">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className="font-extrabold text-gray-900 text-sm">{stat.value}</p>
            <p className="text-gray-400 text-[10px] font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Account Section */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-4">
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-4 pt-3.5 pb-2">Account</p>
        {[
          { icon: '👤', label: 'Personal Information', sub: 'Name, email, mobile number' },
          { icon: '📍', label: 'Saved Addresses', sub: '3 addresses saved' },
          { icon: '💳', label: 'Payment Methods', sub: 'UPI, Cards, Wallets' },
        ].map((item, i) => (
          <button key={item.label} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${i > 0 ? 'border-t border-gray-50' : ''}`}>
            <span className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-base shrink-0">{item.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
            </div>
            <span className="text-gray-300 font-bold text-lg">›</span>
          </button>
        ))}
      </div>

      {/* Orders & Support */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-4">
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-4 pt-3.5 pb-2">Orders & Support</p>
        {[
          { icon: '📦', label: 'Order History', sub: '24 orders placed', action: () => navigate('orders') },
          { icon: '🎫', label: 'My Coupons', sub: '2 coupons available', action: () => {} },
          { icon: '💬', label: 'Help & Support', sub: 'Chat, Email, Call us', action: () => {} },
          { icon: '⭐', label: 'Rate Sneha Bazar', sub: "Loved our app? Let us know!", action: () => {} },
        ].map((item, i) => (
          <button key={item.label} onClick={item.action} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${i > 0 ? 'border-t border-gray-50' : ''}`}>
            <span className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-base shrink-0">{item.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
            </div>
            <span className="text-gray-300 font-bold text-lg">›</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => { logout(); setCart([]); clearNavigationState(); navigate('login') }}
        className="w-full bg-red-50 border-2 border-red-100 text-red-500 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mb-3 active:scale-95 transition-transform"
      >
        🚪 Logout
      </button>

      <p className="text-center text-gray-300 text-[10px] pb-4 font-medium">Sneha Bazar v2.4.1 • Made with ❤️ in India</p>
    </div>

    <NavBottom
      activeBottomTab={activeBottomTab}
      cartCount={0}
      onNavigate={onNavigate}
      onOpenCategory={onOpenCategory}
      categories={categories}
    />
  </div>
)
