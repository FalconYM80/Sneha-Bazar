import { useState, useEffect, useCallback, useRef } from 'react'
import React from 'react'
import { useAuth } from './contexts/AuthContext'
import { productService } from './services/productService'
import { categoryService } from './services/categoryService'
import { cartService } from './services/cartService'
import { orderService } from './services/orderService'
import type { FrontendCategory } from './types/product'
import { adaptProduct, adaptCategory } from './types/product'
import { adaptCartItem } from './types/cart'
import type { FrontendOrder } from './types/order'
import { adaptOrder } from './types/order'
import type { Screen, BottomTab, Product, PlacedOrder } from './types/app'
import type { FrontendCartItem } from './types/cart'
import { isValidScreen, shuffleWithImagePriority } from './utils/helpers'

// ─── Imported Screens ──────────────────────────────────────────────────────────
import { SplashScreen } from './screens/SplashScreen'
import { LoginScreen } from './screens/LoginScreen'
import { RegisterScreen } from './screens/RegisterScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ProductListScreen } from './screens/ProductListScreen'
import { ProductDetailScreen } from './screens/ProductDetailScreen'
import { CartScreen } from './screens/CartScreen'
import { CheckoutScreen } from './screens/CheckoutScreen'
import { OrderConfirmScreen } from './screens/OrderConfirmScreen'
import { OrderTrackingScreen } from './screens/OrderTrackingScreen'
import { OrdersScreen } from './screens/OrdersScreen'
import { ProfileScreen } from './screens/ProfileScreen'

export default function App() {
  const { isAuthenticated, isLoading, logout, customer } = useAuth()
  const [isMobile, setIsMobile] = useState(true)
  
  const [screen, setScreen] = useState<Screen>(() => {
    try {
      const savedScreen = sessionStorage.getItem('customerCurrentScreen')
      if (savedScreen && isValidScreen(savedScreen)) {
        return savedScreen as Screen
      }
    } catch (error) {
      console.error('Error loading screen from sessionStorage:', error)
    }
    return 'splash'
  })

  // Detect mobile/desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  const [cart, setCart] = useState<FrontendCartItem[]>([])
  const [isCartLoading, setIsCartLoading] = useState(false)
  const [cartError, setCartError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    try {
      const savedCategory = sessionStorage.getItem('customerSelectedCategory')
      if (savedCategory) {
        return savedCategory
      }
    } catch (error) {
      console.error('Error loading category from sessionStorage:', error)
    }
    return ''
  })
  const [productQty, setProductQty] = useState(1)
  const [activeOrderTab, setActiveOrderTab] = useState<'active' | 'past'>('active')
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [orders, setOrders] = useState<FrontendOrder[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  
  // Real data states
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<FrontendCategory[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [categoriesError, setCategoriesError] = useState('')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Refs to avoid dependency issues in callbacks
  const productsRef = useRef(products)
  const searchQueryRef = useRef(searchQuery)
  const currentPageRef = useRef(currentPage)
  const hasMoreRef = useRef(hasMore)
  const isLoadingMoreRef = useRef(isLoadingMore)
  const isFetchingRef = useRef(false) // Request lock to prevent simultaneous requests
  
  // Update refs when values change
  useEffect(() => {
    productsRef.current = products
  }, [products])

  useEffect(() => {
    searchQueryRef.current = searchQuery
  }, [searchQuery])

  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore
  }, [isLoadingMore])

  // Stable search handler to prevent input remounting on every keystroke
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  // Handle search input focus - show dropdown with recommendations
  const handleSearchFocus = useCallback(() => {
    setShowSearchDropdown(true)
    // Show top products as recommendations when search is empty
    if (!searchQueryRef.current) {
      const recommendations = productsRef.current.slice(0, 8)
      setSearchSuggestions(recommendations)
    }
  }, [])

  // Handle search input blur - close dropdown (with delay to allow click on suggestions)
  const handleSearchBlur = useCallback(() => {
    setTimeout(() => {
      setShowSearchDropdown(false)
    }, 200)
  }, [])

  // Update search suggestions when query changes (with debouncing)
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQueryRef.current.trim()) {
        setIsSearching(true)
        try {
          // Search across all products using backend API
          const backendProducts = await productService.getProducts(undefined, searchQueryRef.current.trim())
          const adaptedProducts = backendProducts.map(adaptProduct).slice(0, 8) // Limit to 8 suggestions
          setSearchSuggestions(adaptedProducts)
        } catch (error) {
          console.error('Error fetching search suggestions:', error)
          setSearchSuggestions([])
        } finally {
          setIsSearching(false)
        }
      } else {
        // Show recommendations when search is empty
        const recommendations = productsRef.current.slice(0, 8)
        setSearchSuggestions(recommendations)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(searchTimeout)
  }, [searchQuery])

  // Load cart from backend when authenticated
  useEffect(() => {
    const loadCart = async () => {
      if (!isAuthenticated) {
        setCart([])
        return
      }

      setIsCartLoading(true)
      setCartError('')
      try {
        const backendCart = await cartService.getCart()
        // Convert backend cart to frontend format with safe filtering
        const validItems = backendCart.items
          .map(item => adaptCartItem(item))
          .filter((item): item is { product: Product; quantity: number } => item !== null)
          .map(item => ({ product: item.product, qty: item.quantity })) as FrontendCartItem[]
        setCart(validItems)
      } catch (error) {
        console.error('Error loading cart:', error)
        setCartError(error instanceof Error ? error.message : 'Failed to load cart')
        // Don't set empty cart on error, keep existing state
      } finally {
        setIsCartLoading(false)
      }
    }

    loadCart()
  }, [isAuthenticated])

  // Sync screen changes to sessionStorage (only for authenticated screens)
  useEffect(() => {
    // Don't save temporary/auth screens
    const temporaryScreens: Screen[] = ['splash', 'login', 'register']
    if (temporaryScreens.includes(screen)) {
      return
    }
    
    try {
      sessionStorage.setItem('customerCurrentScreen', screen)
    } catch (error) {
      console.error('Error saving screen to sessionStorage:', error)
    }
  }, [screen])

  // Sync selected category changes to sessionStorage
  useEffect(() => {
    try {
      if (selectedCategory) {
        sessionStorage.setItem('customerSelectedCategory', selectedCategory)
      }
    } catch (error) {
      console.error('Error saving category to sessionStorage:', error)
    }
  }, [selectedCategory])

  useEffect(() => {
    if (screen === 'splash') {
      const t = setTimeout(() => {
        if (isLoading) return
        
        if (isAuthenticated) {
          // Try to restore the saved screen
          const savedScreen = sessionStorage.getItem('customerCurrentScreen')
          if (savedScreen && isValidScreen(savedScreen) && savedScreen !== 'splash' && savedScreen !== 'login' && savedScreen !== 'register') {
            // Don't restore screens that require context we can't easily restore
            if (savedScreen === 'product-detail' || savedScreen === 'checkout' || savedScreen === 'order-confirm' || savedScreen === 'order-tracking') {
              setScreen('home')
            } else {
              setScreen(savedScreen as Screen)
            }
          } else {
            setScreen('home')
          }
        } else {
          setScreen('login')
        }
      }, isAuthenticated ? 500 : 2600) // Faster splash for authenticated users
      return () => clearTimeout(t)
    }
  }, [screen, isLoading, isAuthenticated])

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true)
      setCategoriesError('')
      try {
        const backendCategories = await categoryService.getCategoriesWithThumbnails()
        const adaptedCategories = backendCategories
          .filter(cat => cat.isActive)
          .map(adaptCategory)
        setCategories(adaptedCategories)

        // Don't auto-select a category - let user choose "All Products" by default
        // Only restore from sessionStorage if explicitly saved
        if (!selectedCategory) {
          setSelectedCategory('') // Default to "All Products"
        }
      } catch (error) {
        setCategoriesError(error instanceof Error ? error.message : 'Failed to load categories')
        console.error('Error fetching categories:', error)
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  // Fetch products on mount and when search/category changes
  useEffect(() => {
    const fetchProducts = async () => {
      // Reset pagination state
      setCurrentPage(1)
      setHasMore(true)
      isFetchingRef.current = false

      setIsLoadingProducts(true)
      setProductsError('')
      try {
        const response = await productService.getProductsPaginated(
          selectedCategory || undefined,
          searchQuery || undefined,
          1,
          12
        )
        const adaptedProducts = response.data.map(adaptProduct)

        console.log('[PAGINATION]', {
          category: selectedCategory || 'All Products',
          page: response.pagination.page,
          received: adaptedProducts.length,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
          hasMore: response.pagination.hasMore
        })

        // Shuffle products with image priority for the current page
        const shuffledProducts = shuffleWithImagePriority(adaptedProducts, (p) => p.image)

        setProducts(shuffledProducts)
        setHasMore(response.pagination.hasMore)
      } catch (error) {
        setProductsError(error instanceof Error ? error.message : 'Failed to load products')
        console.error('Error fetching products:', error)
      } finally {
        setIsLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [selectedCategory, searchQuery])

  // Load more products (pagination)
  const loadMoreProducts = async () => {
    if (isFetchingRef.current) {
      return
    }

    if (isLoadingMoreRef.current || !hasMoreRef.current) {
      return
    }

    isFetchingRef.current = true
    setIsLoadingMore(true)

    try {
      const nextPage = currentPageRef.current + 1
      const response = await productService.getProductsPaginated(
        selectedCategory || undefined,
        searchQuery || undefined,
        nextPage,
        12
      )

      const adaptedProducts = response.data.map(adaptProduct)

      console.log('[PAGINATION]', {
        category: selectedCategory || 'All Products',
        page: response.pagination.page,
        received: adaptedProducts.length,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.hasMore
      })

      // Shuffle new products with image priority
      const shuffledNewProducts = shuffleWithImagePriority(adaptedProducts, (p) => p.image)

      setProducts(prev => {
        const existingIds = new Set(prev.map(p => p.id))
        const uniqueNewProducts = shuffledNewProducts.filter(p => !existingIds.has(p.id))
        return [...prev, ...uniqueNewProducts]
      })

      setCurrentPage(nextPage)
      setHasMore(response.pagination.hasMore)
    } catch (error) {
      console.error('Error loading more products:', error)
    } finally {
      setIsLoadingMore(false)
      isFetchingRef.current = false
    }
  }

  // Fetch orders when orders screen is accessed
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated || screen !== 'orders') {
        return
      }

      setIsLoadingOrders(true)
      setOrdersError('')
      try {
        const backendOrders = await orderService.getMyOrders()
        const adaptedOrders = backendOrders.map(adaptOrder)
        setOrders(adaptedOrders)
      } catch (error) {
        setOrdersError(error instanceof Error ? error.message : 'Failed to load orders')
        console.error('Error fetching orders:', error)
      } finally {
        setIsLoadingOrders(false)
      }
    }

    fetchOrders()
  }, [isAuthenticated, screen])

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartSubtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const cartTotal = cartSubtotal

  // Derive active tab from current screen
  const activeBottomTab: BottomTab = React.useMemo(() => {
    const tabMap: Partial<Record<Screen, BottomTab>> = { 
      home: 'home', 
      'product-list': 'categories', 
      cart: 'cart', 
      orders: 'orders', 
      profile: 'profile' 
    }
    return tabMap[screen] || 'home'
  }, [screen])

  const addToCart = async (product: Product, qty = 1) => {
    // Check stock availability
    if (product.stockQuantity <= 0 || !product.isAvailable) {
      return
    }
    
    // Check if adding qty would exceed stock
    const existing = cart.find(i => i.product.id === product.id)
    const currentQty = existing ? existing.qty : 0
    const newQty = currentQty + qty
    
    if (newQty > product.stockQuantity) {
      return
    }

    try {
      const backendCart = await cartService.addToCart(product.id, qty)
      // Convert backend cart to frontend format with safe filtering
      const validItems = backendCart.items
        .map(item => adaptCartItem(item))
        .filter((item): item is { product: Product; quantity: number } => item !== null)
        .map(item => ({ product: item.product, qty: item.quantity })) as FrontendCartItem[]
      setCart(validItems)
    } catch (error) {
      console.error('Error adding to cart:', error)
      // Revert to previous state on error
      setCartError(error instanceof Error ? error.message : 'Failed to add to cart')
    }
  }

  const updateQty = async (id: string, delta: number) => {
    const item = cart.find(i => i.product.id === id)
    if (!item) return

    const newQty = item.qty + delta

    // Check if new quantity would exceed stock
    if (newQty > item.product.stockQuantity) {
      return
    }

    // If quantity becomes 0, remove the item
    if (newQty <= 0) {
      try {
        const backendCart = await cartService.removeFromCart(id)
        // Convert backend cart to frontend format with safe filtering
        const validItems = backendCart.items
          .map(item => adaptCartItem(item))
          .filter((item): item is { product: Product; quantity: number } => item !== null)
          .map(item => ({ product: item.product, qty: item.quantity })) as FrontendCartItem[]
        setCart(validItems)
      } catch (error) {
        console.error('Error removing from cart:', error)
        setCartError(error instanceof Error ? error.message : 'Failed to remove from cart')
      }
      return
    }

    // Otherwise update the quantity
    try {
      const backendCart = await cartService.updateCartItem(id, newQty)
      // Convert backend cart to frontend format with safe filtering
      const validItems = backendCart.items
        .map(item => adaptCartItem(item))
        .filter((item): item is { product: Product; quantity: number } => item !== null)
        .map(item => ({ product: item.product, qty: item.quantity })) as FrontendCartItem[]
      setCart(validItems)
    } catch (error) {
      console.error('Error updating cart quantity:', error)
      setCartError(error instanceof Error ? error.message : 'Failed to update quantity')
    }
  }

  const navigate = useCallback((s: Screen) => {
    setScreen(s)
  }, [])

  const clearNavigationState = () => {
    try {
      sessionStorage.removeItem('customerCurrentScreen')
      sessionStorage.removeItem('customerSelectedCategory')
    } catch (error) {
      console.error('Error clearing navigation state:', error)
    }
  }

  const openProduct = useCallback((product: Product) => {
    setSelectedProduct(product)
    setProductQty(1)
    // Store product ID for refresh support
    try {
      sessionStorage.setItem('selectedProductId', product.id)
    } catch (error) {
      console.error('Error storing product ID:', error)
    }
    navigate('product-detail')
  }, [navigate])

  const closeProduct = () => {
    setSelectedProduct(null)
    setProductQty(1)
    // Clear stored product ID
    try {
      sessionStorage.removeItem('selectedProductId')
    } catch (error) {
      console.error('Error clearing product ID:', error)
    }
  }

  const openCategory = useCallback((catId: string) => {
    setSelectedCategory(catId)
    setSearchQuery('') // Clear search when switching categories
    navigate('product-list')
  }, [navigate])

  // Execute full search (Enter key or search button)
  const executeSearch = useCallback(() => {
    setShowSearchDropdown(false)
    if (searchQueryRef.current.trim()) {
      // Navigate to product list with search query
      navigate('product-list')
    }
  }, [navigate])

  // Handle suggestion click
  const handleSuggestionClick = useCallback((product: Product) => {
    setShowSearchDropdown(false)
    setSearchQuery('') // Clear search after selection
    openProduct(product)
  }, [openProduct])

  const placeOrder = async () => {
    if (!isAuthenticated) {
      setCheckoutError('Please login to place an order')
      return
    }

    if (cart.length === 0) {
      setCheckoutError('Your cart is empty')
      return
    }

    setIsCheckingOut(true)
    setCheckoutError('')

    try {
      // Call backend checkout API
      // Backend validates products, calculates totals, creates order, and clears cart
      const backendOrder = await orderService.checkout()

      // Adapt backend order to frontend format
      const frontendOrder = adaptOrder(backendOrder)

      // Create placed order with existing cart items for display
      const order: PlacedOrder = {
        id: frontendOrder.orderNumber,
        orderNumber: frontendOrder.orderNumber,
        items: [...cart], // Keep current cart items for display
        total: frontendOrder.totalAmount,
        date: frontendOrder.formattedDate,
        status: frontendOrder.status,
        preparationMinutes: frontendOrder.preparationMinutes,
        estimatedPickupTime: frontendOrder.estimatedPickupTime,
      }

      setPlacedOrder(order)
      setCart([]) // Clear frontend cart (backend already cleared it)
      navigate('order-confirm')
    } catch (error) {
      console.error('Checkout error:', error)
      setCheckoutError(error instanceof Error ? error.message : 'Failed to place order. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  // Navigation handlers for screens
  const handleNavigate = useCallback((s: string) => {
    navigate(s as Screen)
  }, [navigate])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Responsive container - full width on mobile, centered max-width on desktop */}
      <div
        className="flex flex-col overflow-hidden relative w-full mx-auto bg-white"
        style={{
          height: '100dvh',
          maxHeight: '100dvh',
        }}
      >

        {screen === 'splash' && <SplashScreen onNavigate={handleNavigate} />}
        {screen === 'login' && <LoginScreen onNavigate={handleNavigate} onSetScreen={setScreen} />}
        {screen === 'register' && <RegisterScreen onNavigate={handleNavigate} onSetScreen={setScreen} />}
        {screen === 'home' && (
          <HomeScreen
            products={products}
            categories={categories}
            isLoadingCategories={isLoadingCategories}
            isLoadingProducts={isLoadingProducts}
            categoriesError={categoriesError}
            productsError={productsError}
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            handleSearchFocus={handleSearchFocus}
            handleSearchBlur={handleSearchBlur}
            executeSearch={executeSearch}
            openCategory={openCategory}
            showSearchDropdown={showSearchDropdown}
            isSearching={isSearching}
            searchSuggestions={searchSuggestions}
            handleSuggestionClick={handleSuggestionClick}
            cart={cart}
            addToCart={addToCart}
            updateQuantity={updateQty}
            openProduct={openProduct}
            activeBottomTab={activeBottomTab}
            onNavigate={handleNavigate}
            onNavigateToAllProducts={() => {
              setSelectedCategory('')
              navigate('product-list')
            }}
            isMobile={isMobile}
          />
        )}
        {screen === 'product-list' && (
          <ProductListScreen
            products={products}
            categories={categories}
            selectedCategory={selectedCategory}
            isLoadingProducts={isLoadingProducts}
            productsError={productsError}
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            handleSearchFocus={handleSearchFocus}
            handleSearchBlur={handleSearchBlur}
            executeSearch={executeSearch}
            setSelectedCategory={setSelectedCategory}
            navigate={handleNavigate}
            showSearchDropdown={showSearchDropdown}
            isSearching={isSearching}
            searchSuggestions={searchSuggestions}
            handleSuggestionClick={handleSuggestionClick}
            cart={cart}
            addToCart={addToCart}
            updateQuantity={updateQty}
            openProduct={openProduct}
            activeBottomTab={activeBottomTab}
            onNavigate={handleNavigate}
            isMobile={isMobile}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMoreProducts}
          />
        )}
        {screen === 'product-detail' && (
          <ProductDetailScreen
            selectedProduct={selectedProduct}
            productQty={productQty}
            setProductQty={setProductQty}
            cart={cart}
            cartCount={cartCount}
            products={products}
            addToCart={addToCart}
            navigate={handleNavigate}
            closeProduct={closeProduct}
            onProductLoaded={setSelectedProduct}
          />
        )}
        {screen === 'cart' && (
          <CartScreen
            cart={cart}
            isCartLoading={isCartLoading}
            cartError={cartError}
            cartCount={cartCount}
            cartSubtotal={cartSubtotal}
            cartTotal={cartTotal}
            updateQty={updateQty}
            navigate={handleNavigate}
            activeBottomTab={activeBottomTab}
            onNavigate={handleNavigate}
            onOpenCategory={openCategory}
            categories={categories}
            isMobile={isMobile}
          />
        )}
        {screen === 'checkout' && (
          <CheckoutScreen
            cart={cart}
            cartCount={cartCount}
            cartSubtotal={cartSubtotal}
            cartTotal={cartTotal}
            checkoutError={checkoutError}
            isCheckingOut={isCheckingOut}
            placeOrder={placeOrder}
            navigate={handleNavigate}
          />
        )}
        {screen === 'order-confirm' && (
          <OrderConfirmScreen
            placedOrder={placedOrder}
            navigate={handleNavigate}
          />
        )}
        {screen === 'order-tracking' && (
          <OrderTrackingScreen
            placedOrder={placedOrder}
            isAuthenticated={isAuthenticated}
            navigate={handleNavigate}
          />
        )}
        {screen === 'orders' && (
          <OrdersScreen
            orders={orders}
            isLoadingOrders={isLoadingOrders}
            ordersError={ordersError}
            activeOrderTab={activeOrderTab}
            setActiveOrderTab={setActiveOrderTab}
            navigate={handleNavigate}
            setPlacedOrder={setPlacedOrder}
            setOrders={setOrders}
            setIsLoadingOrders={setIsLoadingOrders}
            setOrdersError={setOrdersError}
            activeBottomTab={activeBottomTab}
            onNavigate={handleNavigate}
            onOpenCategory={openCategory}
            categories={categories}
            isMobile={isMobile}
          />
        )}
        {screen === 'profile' && (
          <ProfileScreen
            customer={customer}
            navigate={handleNavigate}
            logout={logout}
            clearNavigationState={clearNavigationState}
            setCart={setCart}
            activeBottomTab={activeBottomTab}
            onNavigate={handleNavigate}
            onOpenCategory={openCategory}
            categories={categories}
            isMobile={isMobile}
          />
        )}
      </div>
    </div>
  )
}
