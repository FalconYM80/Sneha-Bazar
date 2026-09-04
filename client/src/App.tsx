import { useState, useEffect } from 'react'
import React from 'react'
import { useAuth } from './contexts/AuthContext'
import { customerService } from './services/customerService'

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen =
  | 'splash' | 'login' | 'register' | 'home' | 'product-list'
  | 'product-detail' | 'cart' | 'checkout'
  | 'order-confirm' | 'order-tracking' | 'orders' | 'profile'

type BottomTab = 'home' | 'categories' | 'cart' | 'orders' | 'profile'

interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number
  unit: string
  category: string
  image: string
  description: string
  rating: number
  reviews: number
}

interface CartItem {
  product: Product
  qty: number
}

interface PlacedOrder {
  id: string
  items: CartItem[]
  total: number
  date: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'fruits-veg', name: 'Fruits & Veg', emoji: '🥦', bg: '#dcfce7' },
  { id: 'dairy', name: 'Dairy', emoji: '🥛', bg: '#fef9c3' },
  { id: 'snacks', name: 'Snacks', emoji: '🍿', bg: '#fce7f3' },
  { id: 'beverages', name: 'Beverages', emoji: '🧃', bg: '#dbeafe' },
  { id: 'household', name: 'Household', emoji: '🧹', bg: '#ede9fe' },
  { id: 'staples', name: 'Staples', emoji: '🌾', bg: '#ffedd5' },
]

const PRODUCTS: Product[] = [
  {
    id: 1, name: 'Fresh Tomatoes', price: 40, originalPrice: 55, unit: 'per kg', category: 'fruits-veg',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=400&fit=crop&auto=format',
    description: 'Farm-fresh red tomatoes sourced directly from local farms every morning. Naturally ripened with no artificial treatment. Perfect for curries, salads, and chutneys.',
    rating: 4.5, reviews: 234
  },
  {
    id: 2, name: 'Red Onions', price: 35, unit: 'per kg', category: 'fruits-veg',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=400&fit=crop&auto=format',
    description: 'Premium quality red onions with bold pungent flavor. Essential for every Indian kitchen, from tadka to biryani.',
    rating: 4.3, reviews: 189
  },
  {
    id: 3, name: 'Potatoes', price: 30, unit: 'per kg', category: 'fruits-veg',
    image: 'https://images.unsplash.com/photo-1518977676405-d33def7f0f3e?w=400&h=400&fit=crop&auto=format',
    description: 'Starchy and wholesome potatoes. Ideal for aloo sabzi, samosas, fries, and curries. Stays fresh for up to a week.',
    rating: 4.4, reviews: 312
  },
  {
    id: 4, name: 'Bananas', price: 60, originalPrice: 75, unit: 'per dozen', category: 'fruits-veg',
    image: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=400&h=400&fit=crop&auto=format',
    description: 'Sweet and ripe Robusta bananas, packed with potassium and energy. Great for daily snacking or making banana shakes.',
    rating: 4.6, reviews: 421
  },
  {
    id: 5, name: 'Shimla Apples', price: 120, unit: 'per kg', category: 'fruits-veg',
    image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop&auto=format',
    description: 'Crisp and naturally sweet apples from Himachal Pradesh. Rich in dietary fiber and antioxidants. Great for kids and adults alike.',
    rating: 4.7, reviews: 567
  },
  {
    id: 6, name: 'Palak (Spinach)', price: 25, unit: 'per bunch', category: 'fruits-veg',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop&auto=format',
    description: 'Fresh and tender spinach leaves, handpicked daily. Rich in iron, calcium, and essential vitamins.',
    rating: 4.2, reviews: 145
  },
  {
    id: 7, name: 'Full Cream Milk', price: 62, unit: '1 Litre', category: 'dairy',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop&auto=format',
    description: 'Fresh pasteurized full cream milk. Rich in calcium, protein, and essential vitamins A and D. Sourced from local dairies.',
    rating: 4.8, reviews: 892
  },
  {
    id: 8, name: 'Fresh Paneer', price: 85, unit: '200g', category: 'dairy',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=400&fit=crop&auto=format',
    description: 'Soft and fresh cottage cheese made from pure pasteurized cow milk. Perfect for paneer butter masala, tikka, and kadai paneer.',
    rating: 4.5, reviews: 334
  },
  {
    id: 9, name: 'Set Curd (Dahi)', price: 45, unit: '400g', category: 'dairy',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop&auto=format',
    description: 'Thick and creamy fresh set curd, cultured from full cream milk. Ideal for raita, lassi, kadhi, and everyday meals.',
    rating: 4.4, reviews: 267
  },
  {
    id: 10, name: 'Amul Butter', price: 55, unit: '100g', category: 'dairy',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop&auto=format',
    description: 'Rich and creamy salted butter made from fresh cream. Perfect for spreading on toast, making parathas, and cooking.',
    rating: 4.7, reviews: 623
  },
  {
    id: 11, name: 'Basmati Rice', price: 280, originalPrice: 320, unit: '5 kg', category: 'staples',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop&auto=format',
    description: 'Extra long-grain aromatic basmati rice from the foothills of Himalayas. Aged for perfect texture. Ideal for biryani, pulao, and everyday rice.',
    rating: 4.7, reviews: 1023
  },
  {
    id: 12, name: 'Toor Dal', price: 110, unit: '1 kg', category: 'staples',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop&auto=format',
    description: 'Premium quality arhar/toor dal, a high-protein daily staple. Cooks soft and creamy. Rich in dietary fiber and essential minerals.',
    rating: 4.5, reviews: 445
  },
  {
    id: 13, name: 'Whole Wheat Atta', price: 220, originalPrice: 260, unit: '5 kg', category: 'staples',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop&auto=format',
    description: 'Stone-ground 100% whole wheat flour. Makes soft, fluffy, and nutritious rotis and parathas. No maida added.',
    rating: 4.6, reviews: 678
  },
  {
    id: 14, name: 'Refined Sugar', price: 48, unit: '1 kg', category: 'staples',
    image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&h=400&fit=crop&auto=format',
    description: 'Fine-grained white sugar. An everyday essential for tea, sweets, baking, and cooking.',
    rating: 4.3, reviews: 289
  },
  {
    id: 15, name: 'Salted Chips', price: 35, unit: '80g', category: 'snacks',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop&auto=format',
    description: 'Crispy wavy potato chips with just the right amount of sea salt. A beloved teatime snack for the whole family.',
    rating: 4.3, reviews: 234
  },
  {
    id: 16, name: 'Mixed Namkeen', price: 45, unit: '200g', category: 'snacks',
    image: 'https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=400&h=400&fit=crop&auto=format',
    description: 'Spicy and crunchy traditional Indian mixed snack. A delightful blend of sev, peanuts, poha, and spices.',
    rating: 4.5, reviews: 389
  },
  {
    id: 17, name: 'Mixed Fruit Juice', price: 95, unit: '1 Litre', category: 'beverages',
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop&auto=format',
    description: 'Natural mixed fruit juice with no added preservatives or artificial flavors. A refreshing blend of mango, guava, and apple.',
    rating: 4.2, reviews: 167
  },
  {
    id: 18, name: 'Coconut Water', price: 35, unit: '200ml', category: 'beverages',
    image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&h=400&fit=crop&auto=format',
    description: 'Pure and refreshing tender coconut water. Packed with natural electrolytes to keep you hydrated through the day.',
    rating: 4.6, reviews: 298
  },
  {
    id: 19, name: 'Detergent Powder', price: 85, unit: '500g', category: 'household',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format',
    description: 'Advanced stain-fighting detergent powder with fresh fragrance. Works brilliantly in both hand wash and machine wash.',
    rating: 4.4, reviews: 523
  },
  {
    id: 20, name: 'Dish Wash Liquid', price: 65, unit: '500ml', category: 'household',
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop&auto=format',
    description: 'Powerful grease-cutting dish wash liquid with lime freshness. Leaves dishes sparkling clean and odor-free.',
    rating: 4.3, reviews: 412
  },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

const IcHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
)
const IcGrid = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
  </svg>
)
const IcCart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.6 13H18c.75 0 1.41-.41 1.75-1.03L21.7 4.97A1 1 0 0020.81 3H5.21l-.94-2H1v2h2l3.6 7.59L5.25 13H5a2 2 0 000 4h16v-2H5.42c-.14 0-.25-.11-.25-.25z" />
  </svg>
)
const IcPackage = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
  </svg>
)
const IcUser = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
)
const IcChevLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)
const IcSearch = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
)
const IcMapPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
)
const IcStar = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
)
const IcFilter = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
  </svg>
)
const IcChevDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)
const IcBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
)
const IcCheck = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// ─── Pickup Time Calculation ───────────────────────────────────────────────────

const calculatePickupTime = (totalQuantity: number): string => {
  if (totalQuantity <= 5) return '10 minutes'
  if (totalQuantity <= 15) return '20 minutes'
  if (totalQuantity <= 30) return '30 minutes'
  return '45 minutes'
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { isAuthenticated, isLoading, login, logout, customer } = useAuth()
  const [screen, setScreen] = useState<Screen>('splash')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('fruits-veg')
  const [productQty, setProductQty] = useState(1)
  const [activeOrderTab, setActiveOrderTab] = useState<'active' | 'past'>('active')
  const [loginTab, setLoginTab] = useState<'phone' | 'email'>('phone')
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null)
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('home')

  useEffect(() => {
    if (screen === 'splash') {
      const t = setTimeout(() => {
        if (isLoading) return
        if (isAuthenticated) {
          setScreen('home')
        } else {
          setScreen('login')
        }
      }, 2600)
      return () => clearTimeout(t)
    }
  }, [screen, isLoading, isAuthenticated])

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartSubtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const cartTotal = cartSubtotal

  const addToCart = (product: Product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + qty } : i)
      return [...prev, { product, qty }]
    })
  }

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0))
  }

  const navigate = (s: Screen) => {
    setScreen(s)
    const tabMap: Partial<Record<Screen, BottomTab>> = { home: 'home', cart: 'cart', orders: 'orders', profile: 'profile' }
    const tab = tabMap[s]
    if (tab) setActiveBottomTab(tab)
  }

  const openProduct = (product: Product) => {
    setSelectedProduct(product)
    setProductQty(1)
    navigate('product-detail')
  }

  const openCategory = (catId: string) => {
    setSelectedCategory(catId)
    setActiveBottomTab('categories')
    navigate('product-list')
  }

  const placeOrder = () => {
    const order: PlacedOrder = {
      id: 'FM' + String(Math.floor(100000 + Math.random() * 900000)),
      items: [...cart],
      total: cartTotal,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    }
    setPlacedOrder(order)
    setCart([])
    navigate('order-confirm')
  }

  // ── Shared UI Components ───────────────────────────────────────────────────

  const NavBottom = () => {
    const tabs: Array<{ id: BottomTab; label: string; Icon: () => React.ReactNode; badge?: number; action: () => void }> = [
      { id: 'home', label: 'Home', Icon: IcHome, action: () => navigate('home') },
      { id: 'categories', label: 'Browse', Icon: IcGrid, action: () => openCategory('fruits-veg') },
      { id: 'cart', label: 'Cart', Icon: IcCart, badge: cartCount, action: () => navigate('cart') },
      { id: 'orders', label: 'Orders', Icon: IcPackage, action: () => navigate('orders') },
      { id: 'profile', label: 'Profile', Icon: IcUser, action: () => navigate('profile') },
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

  const ProductCard = ({ product }: { product: Product }) => {
    const inCart = cart.some(i => i.product.id === product.id)
    const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0
    return (
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform"
        onClick={() => openProduct(product)}
      >
        <div className="bg-gray-50 h-28 relative overflow-hidden">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
              {discount}% OFF
            </div>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-gray-900 text-xs font-semibold leading-tight line-clamp-2 min-h-[30px]">{product.name}</p>
          <p className="text-gray-400 text-[10px] mt-0.5">{product.unit}</p>
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-green-700 font-bold text-sm">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-gray-400 text-[10px] line-through ml-1">₹{product.originalPrice}</span>
              )}
            </div>
            <button
              onClick={e => { e.stopPropagation(); addToCart(product) }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-base transition-colors ${inCart ? 'bg-green-700' : 'bg-green-600'}`}
            >
              {inCart ? '✓' : '+'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Screen: Splash ─────────────────────────────────────────────────────────

  const SplashScreen = () => (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-8 cursor-pointer relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #15803d 0%, #065f46 100%)' }}
      onClick={() => navigate('login')}
    >
      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white opacity-5" />
      <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-white opacity-5" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-emerald-400 opacity-10 blur-3xl" />

      {/* Logo */}
      <div className="relative">
        <div className="w-28 h-28 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="20" fill="#dcfce7" />
            <path d="M32 12c-5 0-9.5 2.5-12 6.5A14 14 0 0046 32c0-3.5-1.3-6.7-3.4-9.2" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 30h24M24 24l-4 12h24l-4-12" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="26" cy="44" r="3" fill="#16a34a" />
            <circle cx="38" cy="44" r="3" fill="#16a34a" />
            <path d="M29 16c0-4 4-6 7-4.5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-orange-400 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white text-sm font-bold">✦</span>
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-[40px] font-extrabold text-white tracking-tight leading-none">Sneha Bazar</h1>
        <p className="text-emerald-200 text-base mt-2 font-medium">Your Daily Fresh Grocery</p>
        <p className="text-emerald-300/60 text-xs mt-1">Order online, pick up fresh</p>
      </div>

      {/* Loading dots */}
      <div className="absolute bottom-12 flex gap-2">
        <div className="w-8 h-1.5 bg-white rounded-full" />
        <div className="w-2 h-1.5 bg-emerald-400 rounded-full" />
        <div className="w-2 h-1.5 bg-emerald-400 rounded-full" />
      </div>
    </div>
  )

  // ── Screen: Login ──────────────────────────────────────────────────────────

  const LoginScreen = () => {
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const [loginError, setLoginError] = useState('')

    const handleLogin = async () => {
      setLoginError('')
      
      // Validation
      if (loginTab === 'phone' && !phone) {
        setLoginError('Please enter your phone number')
        return
      }
      if (loginTab === 'email' && !email) {
        setLoginError('Please enter your email address')
        return
      }
      if (!password) {
        setLoginError('Please enter your password')
        return
      }

      if (loginTab === 'phone' && phone.length !== 10) {
        setLoginError('Please enter a valid 10-digit phone number')
        return
      }

      setIsLoggingIn(true)
      try {
        const response = await customerService.login({
          phone: loginTab === 'phone' ? phone : '',
          password,
        })
        
        login(response.customer, response.token)
        navigate('home')
      } catch (error) {
        setLoginError(error instanceof Error ? error.message : 'Login failed. Please try again.')
      } finally {
        setIsLoggingIn(false)
      }
    }

    return (
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        <div className="px-6 py-4 flex flex-col flex-1">
          <div className="flex items-center gap-2.5 mb-7">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-md shadow-green-200">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M6 18h12M8 12l-3 6h14l-3-6M12 3c-2 0-4 1.5-4 4h8c0-2.5-2-4-4-4z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="22" r="1.5" fill="white" />
                <circle cx="15" cy="22" r="1.5" fill="white" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-gray-900">Sneha Bazar</span>
          </div>

          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome back!</h2>
          <p className="text-gray-400 text-sm mb-6">Sign in to continue shopping</p>

          {/* Tab toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
            {(['phone', 'email'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setLoginTab(tab); setLoginError('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${loginTab === tab ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
              >
                {tab === 'phone' ? 'Phone Number' : 'Email'}
              </button>
            ))}
          </div>

          <div className="space-y-4 mb-5">
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">
                {loginTab === 'phone' ? 'Mobile Number' : 'Email Address'}
              </label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-green-500 transition-colors bg-gray-50">
                {loginTab === 'phone' ? (
                  <>
                    <span className="text-gray-600 text-sm font-bold shrink-0">🇮🇳 +91</span>
                    <div className="w-px h-5 bg-gray-300 shrink-0" />
                    <input 
                      className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400" 
                      placeholder="98765 43210" 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                    />
                  </>
                ) : (
                  <input 
                    className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400" 
                    placeholder="name@example.com" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                )}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">Password</label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-green-500 transition-colors bg-gray-50">
                <input 
                  className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400" 
                  placeholder="Enter your password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button className="text-green-600 text-sm font-semibold">Forgot Password?</button>
            </div>
          </div>

          {loginError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold">
              {loginError}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-green-200 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? 'Logging in...' : 'Login'}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs font-medium">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button className="w-full border-2 border-gray-200 text-gray-700 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            Continue with Google
          </button>

          <p className="text-center text-gray-400 text-sm mt-6">
            {"New to Sneha Bazar? "}
            <button onClick={() => setScreen('register')} className="text-green-600 font-bold">Create Account</button>
          </p>
        </div>
      </div>
    )
  }

  // ── Screen: Register ────────────────────────────────────────────────────────

  const RegisterScreen = () => {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isRegistering, setIsRegistering] = useState(false)
    const [registerError, setRegisterError] = useState('')

    const handleRegister = async () => {
      setRegisterError('')
      
      // Validation
      if (!name.trim()) {
        setRegisterError('Please enter your name')
        return
      }
      if (!phone) {
        setRegisterError('Please enter your phone number')
        return
      }
      if (phone.length !== 10) {
        setRegisterError('Please enter a valid 10-digit phone number')
        return
      }
      if (!password) {
        setRegisterError('Please enter a password')
        return
      }
      if (password.length < 6) {
        setRegisterError('Password must be at least 6 characters')
        return
      }

      setIsRegistering(true)
      try {
        const response = await customerService.register({
          name: name.trim(),
          phone,
          email: email.trim() || undefined,
          password,
        })
        
        login(response.customer, response.token)
        navigate('home')
      } catch (error) {
        setRegisterError(error instanceof Error ? error.message : 'Registration failed. Please try again.')
      } finally {
        setIsRegistering(false)
      }
    }

    return (
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        <div className="px-6 py-4 flex flex-col flex-1">
          <div className="flex items-center gap-2.5 mb-7">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-md shadow-green-200">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M6 18h12M8 12l-3 6h14l-3-6M12 3c-2 0-4 1.5-4 4h8c0-2.5-2-4-4-4z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="22" r="1.5" fill="white" />
                <circle cx="15" cy="22" r="1.5" fill="white" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-gray-900">Sneha Bazar</span>
          </div>

          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Create Account</h2>
          <p className="text-gray-400 text-sm mb-6">Join us and start shopping fresh</p>

          <div className="space-y-4 mb-5">
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">Full Name</label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-green-500 transition-colors bg-gray-50">
                <input 
                  className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400" 
                  placeholder="John Doe" 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">Mobile Number</label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-green-500 transition-colors bg-gray-50">
                <span className="text-gray-600 text-sm font-bold shrink-0">🇮🇳 +91</span>
                <div className="w-px h-5 bg-gray-300 shrink-0" />
                <input 
                  className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400" 
                  placeholder="98765 43210" 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">Email Address (Optional)</label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-green-500 transition-colors bg-gray-50">
                <input 
                  className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400" 
                  placeholder="name@example.com" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">Password</label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-green-500 transition-colors bg-gray-50">
                <input 
                  className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400" 
                  placeholder="Create a password (min 6 characters)" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {registerError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold">
              {registerError}
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={isRegistering}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-green-200 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegistering ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-center text-gray-400 text-sm mt-6">
            {"Already have an account? "}
            <button onClick={() => setScreen('login')} className="text-green-600 font-bold">Login</button>
          </p>
        </div>
      </div>
    )
  }

  // ── Screen: Home ───────────────────────────────────────────────────────────

  const HomeScreen = () => {
    const featured = [
      ...PRODUCTS.filter(p => p.originalPrice),
      ...PRODUCTS.filter(p => !p.originalPrice).slice(0, 3),
    ].slice(0, 6)

    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-white px-4 pt-2 pb-3 shadow-sm shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Pickup at</p>
              <button className="flex items-center gap-1 mt-0.5">
                <span className="text-green-600"><IcMapPin /></span>
                <span className="font-bold text-gray-900 text-sm">Vamanjoor Store</span>
                <span className="text-gray-500"><IcChevDown /></span>
              </button>
            </div>
            <button className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 relative">
              <IcBell />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
          </div>
          <div className="mt-3 flex items-center bg-gray-100 rounded-xl px-3 py-2.5 gap-2">
            <span className="text-gray-400"><IcSearch /></span>
            <span className="text-gray-400 text-sm flex-1">Search vegetables, fruits, dairy...</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Promo Banner */}
          <div className="mx-4 mt-4 rounded-2xl overflow-hidden h-36 relative bg-orange-500 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1588519722329-51b46166ecbd?w=700&h=300&fit=crop&auto=format"
              alt="Fresh vegetables promotion"
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 flex flex-col justify-center px-5">
              <span className="bg-white/25 backdrop-blur-sm w-fit px-2.5 py-0.5 rounded-full mb-2 text-white text-[10px] font-bold uppercase tracking-widest">
                🔥 Limited Offer
              </span>
              <h3 className="text-white font-extrabold text-xl leading-tight">Fresh Vegetables<br />Up to 30% Off</h3>
              <button
                onClick={() => openCategory('fruits-veg')}
                className="mt-2 bg-white text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full w-fit shadow-md active:scale-95 transition-transform"
              >
                Shop Now →
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="px-4 mt-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-extrabold text-gray-900 text-base">Categories</h2>
              <button className="text-green-600 text-sm font-semibold">See all</button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => openCategory(cat.id)}
                  className="rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                  style={{ backgroundColor: cat.bg }}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-[11px] font-bold text-gray-800 text-center leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Special offer strip */}
          <div className="mx-4 mt-4 bg-green-600 rounded-2xl p-3.5 flex items-center gap-3">
            <span className="text-3xl">🏪</span>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Order Online, Pick Up Fresh</p>
              <p className="text-green-100 text-xs">Ready in as fast as 10 minutes</p>
            </div>
            <div className="bg-white/20 rounded-xl px-3 py-1.5">
              <span className="text-white text-xs font-bold">Today only</span>
            </div>
          </div>

          {/* Popular Products */}
          <div className="mt-5 px-4 pb-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-extrabold text-gray-900 text-base">Popular Products</h2>
              <button onClick={() => openCategory('fruits-veg')} className="text-green-600 text-sm font-semibold">See all</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {featured.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>

        <NavBottom />
      </div>
    )
  }

  // ── Screen: Product List ───────────────────────────────────────────────────

  const ProductListScreen = () => {
    const cat = CATEGORIES.find(c => c.id === selectedCategory)!
    const filtered = PRODUCTS.filter(p => p.category === selectedCategory)
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-white px-4 shadow-sm shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate('home')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
              <IcChevLeft />
            </button>
            <h1 className="font-extrabold text-gray-900 text-lg flex-1">{cat.name}</h1>
            <span className="text-2xl">{cat.emoji}</span>
          </div>
          <div className="flex gap-2 mb-3">
            <div className="flex-1 flex items-center bg-gray-100 rounded-xl px-3 py-2.5 gap-2">
              <span className="text-gray-400 shrink-0"><IcSearch /></span>
              <span className="text-gray-400 text-sm">Search in {cat.name}...</span>
            </div>
            <button className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 shrink-0">
              <IcFilter />
            </button>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 px-4 py-2.5 bg-white border-b border-gray-100 overflow-x-auto shrink-0">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${c.id === selectedCategory ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              <span>{c.emoji}</span> {c.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="text-xs text-gray-400 mb-3 font-semibold">{filtered.length} products found</p>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <span className="text-5xl mb-3">🛒</span>
              <p className="text-sm font-semibold">No products found</p>
            </div>
          )}
        </div>

        <NavBottom />
      </div>
    )
  }

  // ── Screen: Product Detail ─────────────────────────────────────────────────

  const ProductDetailScreen = () => {
    if (!selectedProduct) return null
    const p = selectedProduct
    const inCart = cart.find(i => i.product.id === p.id)
    const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0
    const related = PRODUCTS.filter(pr => pr.category === p.category && pr.id !== p.id).slice(0, 4)
    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className="relative bg-gray-50 h-60 shrink-0">
          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <button
              onClick={() => navigate('product-list')}
              className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-gray-700"
            >
              <IcChevLeft />
            </button>
            <button
              onClick={() => navigate('cart')}
              className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-gray-700 relative"
            >
              <IcCart />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
          {discount > 0 && (
            <div className="absolute bottom-3 left-4 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-xl shadow">
              {discount}% OFF
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4">
            <div className="flex justify-between items-start gap-2 mb-1">
              <h1 className="text-xl font-extrabold text-gray-900 flex-1">{p.name}</h1>
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-xl shrink-0">
                <IcStar />
                <span className="text-xs font-bold text-amber-700">{p.rating}</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">{p.unit} • {p.reviews.toLocaleString()} reviews</p>

            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-3xl font-extrabold text-green-700">₹{p.price}</span>
              {p.originalPrice && (
                <>
                  <span className="text-gray-400 line-through text-base">₹{p.originalPrice}</span>
                  <span className="text-orange-500 text-sm font-bold">Save ₹{p.originalPrice - p.price}</span>
                </>
              )}
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-4 mb-5 bg-gray-50 rounded-2xl p-3">
              <span className="text-sm font-bold text-gray-700 flex-1">Quantity</span>
              <div className="flex items-center gap-3 bg-white rounded-xl px-1 py-1 shadow-sm">
                <button
                  onClick={() => setProductQty(q => Math.max(1, q - 1))}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-700 font-extrabold text-lg"
                >
                  −
                </button>
                <span className="w-6 text-center font-extrabold text-gray-900">{productQty}</span>
                <button
                  onClick={() => setProductQty(q => q + 1)}
                  className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                >
                  +
                </button>
              </div>
              <span className="text-sm font-bold text-gray-900 shrink-0">₹{p.price * productQty}</span>
            </div>

            {/* Tags */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {['Farm Fresh', 'No Preservatives', 'Fresh Daily'].map(tag => (
                <div key={tag} className="bg-green-50 border border-green-100 rounded-xl px-2 py-2 text-center">
                  <p className="text-green-700 text-[10px] font-bold">{tag}</p>
                </div>
              ))}
            </div>

            <div className="mb-5">
              <h3 className="font-extrabold text-gray-900 mb-2 text-sm">About this product</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{p.description}</p>
            </div>

            {related.length > 0 && (
              <div className="mb-2">
                <h3 className="font-extrabold text-gray-900 mb-3 text-sm">You may also like</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {related.map(rp => (
                    <div
                      key={rp.id}
                      onClick={() => { setSelectedProduct(rp); setProductQty(1) }}
                      className="flex-shrink-0 w-28 bg-gray-50 rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform border border-gray-100"
                    >
                      <img src={rp.image} alt={rp.name} className="w-full h-20 object-cover" loading="lazy" />
                      <div className="p-2">
                        <p className="text-[10px] font-semibold text-gray-800 line-clamp-2">{rp.name}</p>
                        <p className="text-green-700 text-xs font-bold mt-1">₹{rp.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0 flex gap-3">
          <button
            onClick={() => navigate('cart')}
            className="flex-1 border-2 border-green-600 text-green-600 py-3.5 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
          >
            {inCart ? `View Cart (${cartCount})` : 'View Cart'}
          </button>
          <button
            onClick={() => { addToCart(p, productQty); navigate('cart') }}
            className="flex-1 bg-green-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-green-200 active:scale-95 transition-transform"
          >
            Add • ₹{p.price * productQty}
          </button>
        </div>
      </div>
    )
  }

  // ── Screen: Cart ───────────────────────────────────────────────────────────

  const CartScreen = () => (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-white px-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3 pb-3">
          <button onClick={() => navigate('home')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
            <IcChevLeft />
          </button>
          <h1 className="font-extrabold text-gray-900 text-lg flex-1">My Cart</h1>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-red-400 text-sm font-semibold">Clear All</button>
          )}
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-8">
          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mb-5 text-5xl">🛒</div>
          <h3 className="text-gray-800 font-extrabold text-lg mb-1">Cart is empty</h3>
          <p className="text-sm text-center text-gray-400 mb-6 leading-relaxed">{"You haven't added anything yet. Browse fresh groceries and start shopping!"}</p>
          <button onClick={() => navigate('home')} className="bg-green-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-green-200">
            Start Shopping
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {cart.map(item => (
              <div key={item.product.id} className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm border border-gray-100">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-semibold text-sm leading-tight">{item.product.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{item.product.unit}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-green-700 font-bold text-sm">₹{item.product.price * item.qty}</span>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-1 py-0.5">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-gray-700 font-bold shadow-sm text-sm"
                      >
                        −
                      </button>
                      <span className="text-xs font-bold w-4 text-center text-gray-900">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Bill Summary */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-extrabold text-gray-900 mb-3 text-sm">Bill Summary</h3>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({cartCount} items)</span>
                  <span>₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Pickup Fee</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
                <div className="border-t border-gray-100 pt-2.5 flex justify-between font-extrabold text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-green-700">₹{cartTotal}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
            <button
              onClick={() => navigate('checkout')}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-green-200 flex items-center justify-between px-5 active:scale-95 transition-transform"
            >
              <span className="text-green-100 text-sm">{cartCount} items • ₹{cartTotal}</span>
              <span>Place Pickup Order →</span>
            </button>
          </div>
        </>
      )}

      <NavBottom />
    </div>
  )

  // ── Screen: Checkout ───────────────────────────────────────────────────────

  const CheckoutScreen = () => (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-white px-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3 pb-3">
          <button onClick={() => navigate('cart')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
            <IcChevLeft />
          </button>
          <h1 className="font-extrabold text-gray-900 text-lg">Checkout</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Pickup Information */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-extrabold text-gray-900 text-sm mb-3">Pickup Information</h3>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-green-600">🏪</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">Store Pickup</p>
              <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">Sneha Bazar Main Store<br />Vamanjoor, Karnataka</p>
              <span className="inline-block mt-2 bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Pickup Only</span>
            </div>
          </div>
        </div>

        {/* Estimated Pickup Time */}
        <div className="bg-green-600 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl shrink-0">⏱️</div>
          <div className="flex-1">
            <p className="text-green-100 text-xs font-medium">Estimated Pickup Time</p>
            <p className="text-white font-extrabold text-xl">{calculatePickupTime(cartCount)}</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-extrabold text-gray-900 text-sm mb-3">Order Summary</h3>
          {cart.slice(0, 3).map(item => (
            <div key={item.product.id} className="flex items-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <span className="flex-1 text-xs text-gray-700 font-medium line-clamp-1">{item.product.name}</span>
              <span className="text-xs font-semibold text-gray-500 shrink-0">×{item.qty}</span>
              <span className="text-xs font-bold text-green-700 shrink-0">₹{item.product.price * item.qty}</span>
            </div>
          ))}
          {cart.length > 3 && <p className="text-xs text-gray-400 mt-1">+{cart.length - 3} more items</p>}
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-2">
            <div className="flex justify-between text-xs text-gray-600"><span>Subtotal ({cartCount} items)</span><span>₹{cartSubtotal}</span></div>
            <div className="flex justify-between text-xs text-gray-600"><span>Pickup Fee</span><span className="text-green-600 font-semibold">FREE</span></div>
            <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-green-700">₹{cartTotal}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
        <button
          onClick={placeOrder}
          className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-green-200 active:scale-95 transition-transform"
        >
          Place Pickup Order • ₹{cartTotal}
        </button>
        <p className="text-center text-gray-400 text-[10px] mt-2">Pay at store when you pick up your order</p>
      </div>
    </div>
  )

  // ── Screen: Order Confirmation ─────────────────────────────────────────────

  const OrderConfirmScreen = () => {
    const totalQuantity = placedOrder?.items.reduce((sum, item) => sum + item.qty, 0) || 0
    const pickupTime = calculatePickupTime(totalQuantity)
    
    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center overflow-y-auto py-6">
          {/* Success animation */}
          <div className="relative mb-8">
            <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-20 h-20 bg-green-200 rounded-full flex items-center justify-center">
                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-300">
                  <IcCheck />
                </div>
              </div>
            </div>
            <div className="absolute -top-1 -right-1 text-2xl">🎉</div>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Order Placed!</h1>
          <p className="text-gray-500 text-sm mb-7 leading-relaxed">
            Your order has been successfully placed.<br />We will start preparing it right away!
          </p>

          <div className="bg-gray-50 rounded-2xl p-5 w-full mb-6 text-left space-y-3.5">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Order ID</span>
              <span className="font-extrabold text-gray-900 text-sm">{placedOrder?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Order Date</span>
              <span className="font-semibold text-gray-700 text-sm">{placedOrder?.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Total Items</span>
              <span className="font-semibold text-gray-700 text-sm">{totalQuantity} items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Total Amount</span>
              <span className="font-extrabold text-green-700 text-sm">₹{placedOrder?.total}</span>
            </div>
            <div className="border-t border-gray-200 pt-3.5 flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl shrink-0">⏱️</div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Estimated Pickup Time</p>
                <p className="font-extrabold text-gray-900 text-sm">{pickupTime}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 w-full mb-6">
            <p className="text-green-800 text-sm font-semibold text-center">
              Please collect your order from the store
            </p>
            <p className="text-green-600 text-xs text-center mt-1">
              Sneha Bazar Main Store, Vamanjoor
            </p>
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={() => navigate('home')}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-green-200 active:scale-95 transition-transform"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Screen: Order Tracking ─────────────────────────────────────────────────

  const OrderTrackingScreen = () => {
    const totalQuantity = placedOrder?.items.reduce((sum, item) => sum + item.qty, 0) || 0
    const pickupTime = calculatePickupTime(totalQuantity)
    
    const steps = [
      { label: 'Order Placed', sub: 'We received your order', done: true, active: false, icon: '📋' },
      { label: 'Confirmed', sub: 'Order confirmed by store', done: true, active: false, icon: '✅' },
      { label: 'Preparing', sub: 'Items are being prepared', done: false, active: true, icon: '📦' },
      { label: 'Ready for Pickup', sub: 'Order ready at store', done: false, active: false, icon: '�' },
    ]
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-white px-4 shadow-sm shrink-0">
          <div className="flex items-center gap-3 pb-3">
            <button onClick={() => navigate('order-confirm')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
              <IcChevLeft />
            </button>
            <h1 className="font-extrabold text-gray-900 text-lg flex-1">Order Status</h1>
            <span className="text-gray-400 text-xs font-semibold">{placedOrder?.id}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Pickup Time Card */}
          <div className="bg-green-600 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl shrink-0">⏱️</div>
            <div className="flex-1">
              <p className="text-green-100 text-xs font-medium">Estimated Pickup Time</p>
              <p className="text-white font-extrabold text-xl">{pickupTime}</p>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-extrabold text-gray-900 text-sm mb-4">Order Progress</h3>
            {steps.map((step, i) => (
              <div key={step.label} className="flex gap-4" style={{ paddingBottom: i < steps.length - 1 ? '20px' : '0' }}>
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 font-bold ${
                    step.done
                      ? 'bg-green-600 text-white'
                      : step.active
                        ? 'bg-orange-500 text-white ring-4 ring-orange-100'
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.done ? '✓' : step.icon}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-0.5 flex-1 mt-1 min-h-[16px] ${step.done ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="pt-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold ${step.done || step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {step.active && (
                      <span className="bg-orange-100 text-orange-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Current</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pickup Location */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-extrabold text-gray-900 text-sm mb-3">Pickup Location</h3>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                <IcMapPin />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700">Store Address</p>
                <p className="text-xs text-gray-500 mt-0.5">Sneha Bazar Main Store<br />Vamanjoor, Karnataka</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
          <button onClick={() => navigate('orders')} className="w-full border-2 border-gray-200 text-gray-700 py-3.5 rounded-2xl font-bold text-sm active:scale-95 transition-transform">
            View All Orders
          </button>
        </div>
      </div>
    )
  }

  // ── Screen: My Orders ──────────────────────────────────────────────────────

  const OrdersScreen = () => {
    const pastOrders = [
      { id: 'FM192341', date: '25 Aug 2026', items: 6, total: 756, status: 'picked-up' as const },
      { id: 'FM187654', date: '18 Aug 2026', items: 3, total: 342, status: 'picked-up' as const },
      { id: 'FM180923', date: '12 Aug 2026', items: 8, total: 1203, status: 'picked-up' as const },
    ]
    const statusColors: Record<string, string> = {
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-yellow-100 text-yellow-700',
      ready: 'bg-orange-100 text-orange-700',
      'picked-up': 'bg-green-100 text-green-700',
    }
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-white px-4 shadow-sm shrink-0">
          <h1 className="font-extrabold text-gray-900 text-lg pb-3">My Orders</h1>
        </div>

        <div className="flex gap-1.5 px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          {(['active', 'past'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveOrderTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeOrderTab === tab ? 'bg-green-600 text-white shadow-sm shadow-green-200' : 'bg-gray-100 text-gray-500'}`}
            >
              {tab === 'active' ? 'Active Orders' : 'Past Orders'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {activeOrderTab === 'active' ? (
            placedOrder ? (
              <div
                className="bg-white rounded-2xl p-4 shadow-sm border border-green-200 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => navigate('order-tracking')}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-extrabold text-gray-900 text-sm">#{placedOrder.id}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{placedOrder.date}</p>
                  </div>
                  <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">Preparing</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {placedOrder.items.slice(0, 3).map(item => (
                    <div key={item.product.id} className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                  {placedOrder.items.length > 3 && (
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200">
                      +{placedOrder.items.length - 3}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-green-700 font-extrabold text-sm">₹{placedOrder.total}</span>
                  <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl">View Status →</span>
                </div>

                {/* Mini progress */}
                <div className="flex items-center gap-0.5">
                  {['Placed', 'Confirmed', 'Preparing', 'Ready'].map((s, i) => (
                    <div key={s} className="flex items-center gap-0.5 flex-1 last:flex-none">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${i < 2 ? 'bg-green-500' : i === 2 ? 'bg-orange-300' : 'bg-gray-200'}`} />
                      {i < 3 && <div className={`h-0.5 flex-1 ${i < 2 ? 'bg-green-500' : 'bg-gray-200'}`} />}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl mb-4">📦</div>
                <p className="text-sm font-semibold text-gray-600 mb-1">No active orders</p>
                <p className="text-xs text-gray-400 mb-5">Place an order and track it here</p>
                <button onClick={() => navigate('home')} className="bg-green-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md shadow-green-200">
                  Shop Now
                </button>
              </div>
            )
          ) : (
            pastOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <p className="font-extrabold text-gray-900 text-sm">#{order.id}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{order.date} • {order.items} items</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${statusColors[order.status]}`}>
                    {order.status.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-700 font-extrabold text-sm">₹{order.total}</span>
                  <div className="flex gap-2">
                    <button className="border border-gray-200 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-xl">
                      Reorder
                    </button>
                    <button className="border border-green-200 text-green-600 text-xs font-bold px-3 py-1.5 rounded-xl">
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <NavBottom />
      </div>
    )
  }

  // ── Screen: Profile ────────────────────────────────────────────────────────

  const ProfileScreen = () => (
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
          onClick={() => { logout(); setCart([]); navigate('login') }}
          className="w-full bg-red-50 border-2 border-red-100 text-red-500 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mb-3 active:scale-95 transition-transform"
        >
          🚪 Logout
        </button>

        <p className="text-center text-gray-300 text-[10px] pb-4 font-medium">Sneha Bazar v2.4.1 • Made with ❤️ in India</p>
      </div>

      <NavBottom />
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center p-0 md:p-6"
      style={{ background: 'linear-gradient(135deg, #14532d 0%, #064e3b 50%, #1e1b4b 100%)' }}
    >
      {/* Phone frame - responsive: full width on mobile, fixed frame on desktop */}
      <div
        className="flex flex-col overflow-hidden relative w-full md:w-[390px] md:h-[844px] md:rounded-[44px] md:border-[11px] md:border-gray-900 bg-white md:shadow-2xl"
        style={{
          height: '100dvh',
          maxHeight: '100dvh',
        }}
      >
        {/* Dynamic island - only on desktop */}
        <div
          className="absolute z-50 hidden md:block"
          style={{
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120px',
            height: '34px',
            background: '#0f172a',
            borderRadius: '17px',
          }}
        />

        {screen === 'splash' && <SplashScreen />}
        {screen === 'login' && <LoginScreen />}
        {screen === 'register' && <RegisterScreen />}
        {screen === 'home' && <HomeScreen />}
        {screen === 'product-list' && <ProductListScreen />}
        {screen === 'product-detail' && <ProductDetailScreen />}
        {screen === 'cart' && <CartScreen />}
        {screen === 'checkout' && <CheckoutScreen />}
        {screen === 'order-confirm' && <OrderConfirmScreen />}
        {screen === 'order-tracking' && <OrderTrackingScreen />}
        {screen === 'orders' && <OrdersScreen />}
        {screen === 'profile' && <ProfileScreen />}
      </div>

      {/* Screen label - only on desktop */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:block">
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
          <p className="text-white/60 text-xs font-medium capitalize">
            {screen.replace(/-/g, ' ')} • Sneha Bazar
          </p>
        </div>
      </div>
    </div>
  )
}
