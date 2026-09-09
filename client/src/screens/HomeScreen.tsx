import type { Product } from '../types/app'
import type { FrontendCartItem } from '../types/cart'
import type { FrontendCategory } from '../types/product'
import { getCategoryAccentColor, getCategoryFallbackColor } from '../types/product'
import { SearchDropdown } from '../components/SearchDropdown'
import { ProductCard } from '../components/ProductCard'
import { ProductSkeleton } from '../components/ProductSkeleton'
import { CategorySkeleton } from '../components/CategorySkeleton'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { NavBottom } from '../components/NavBottom'
import { Header } from '../components/Header'
import { Navigation } from '../components/Navigation'
import { MainContent } from '../components/PageContainer'
import { useState, useEffect, useMemo } from 'react'

interface HomeScreenProps {
  products: Product[]
  categories: FrontendCategory[]
  isLoadingCategories: boolean
  isLoadingProducts: boolean
  categoriesError: string
  productsError: string
  searchQuery: string
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSearchFocus: () => void
  handleSearchBlur: () => void
  executeSearch: () => void
  openCategory: (catId: string) => void
  showSearchDropdown: boolean
  isSearching: boolean
  searchSuggestions: Product[]
  handleSuggestionClick: (product: Product) => void
  cart: FrontendCartItem[]
  addToCart: (product: Product) => void
  updateQuantity: (productId: string, delta: number) => void
  openProduct: (product: Product) => void
  activeBottomTab: 'home' | 'categories' | 'cart' | 'orders' | 'profile'
  onNavigate: (screen: string) => void
  onNavigateToAllProducts?: () => void
  isMobile?: boolean
}

export const HomeScreen = ({
  products,
  categories,
  isLoadingCategories,
  isLoadingProducts,
  categoriesError,
  productsError,
  searchQuery,
  handleSearch,
  handleSearchFocus,
  handleSearchBlur,
  executeSearch,
  openCategory,
  showSearchDropdown,
  isSearching,
  searchSuggestions,
  handleSuggestionClick,
  cart,
  addToCart,
  updateQuantity,
  openProduct,
  activeBottomTab,
  onNavigate,
  onNavigateToAllProducts,
  isMobile = true
}: HomeScreenProps) => {
  const featured = [
    ...products.filter(p => p.originalPrice),
    ...products.filter(p => !p.originalPrice).slice(0, 3),
  ].slice(0, 6)

  // Helper to detect if an image is a placeholder
  const isPlaceholderImage = (image: string | undefined): boolean => {
    if (!image || image.trim() === '') return true
    const lowerImage = image.toLowerCase().trim()
    return lowerImage.includes('placeholder') || 
           lowerImage.includes('default-product') ||
           lowerImage === '/placeholder-product.svg' ||
           lowerImage === '/placeholder-product.png'
  }
  
  // Select ALL products with REAL images (not placeholders) - search through entire available product collection
  const productsWithRealImages = products.filter(p => {
    const image = p.image
    return image && image.trim() !== '' && !isPlaceholderImage(image)
  })
  
  // State to track which images have failed to load
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  
  // Helper to check if an image is valid (without error tracking)
  const isValidImage = (src: string | undefined): boolean => {
    if (!src || src.trim() === '') return false
    if (isPlaceholderImage(src)) return false
    return true
  }
  
  // Helper to check if an image should be rendered (includes error tracking)
  const shouldRenderImage = (src: string | undefined): boolean => {
    if (!isValidImage(src)) return false
    if (src && failedImages.has(src)) return false
    return true
  }
  
  // Handle image error
  const handleImageError = (src: string) => {
    setFailedImages(prev => new Set([...prev, src]))
  }
  
  // Pure function to compute product assignments for all carousel slides
  const computeCarouselProductAssignments = (
    totalSlides: number,
    products: Product[],
    shouldRenderImageFunc: (src: string | undefined) => boolean
  ) => {
    const maxImagesPerSlide = 4 // Desktop max, mobile will use fewer
    
    const assignments: Array<Array<{ productId: string; image: string }>> = []
    const usedProductIds = new Set<string>()
    
    // Initialize empty assignments for each slide
    for (let i = 0; i < totalSlides; i++) {
      assignments.push([])
    }
    
    // Distribute products across slides
    let productIndex = 0
    for (let slideIndex = 0; slideIndex < totalSlides; slideIndex++) {
      for (let imageIndex = 0; imageIndex < maxImagesPerSlide; imageIndex++) {
        // Find next unused product
        let attempts = 0
        let foundProduct = null
        
        while (attempts < products.length) {
          const candidateProduct = products[productIndex % products.length]
          
          if (!usedProductIds.has(candidateProduct.id) && shouldRenderImageFunc(candidateProduct.image)) {
            foundProduct = candidateProduct
            usedProductIds.add(candidateProduct.id)
            break
          }
          
          productIndex++
          attempts++
        }
        
        // If we found a valid product, assign it to this slide
        if (foundProduct) {
          assignments[slideIndex].push({
            productId: foundProduct.id,
            image: foundProduct.image
          })
        }
      }
    }
    
    return assignments
  }
  
  // Dynamically generate product images for a banner based on pre-computed assignments
  const generateProductImages = (
    slideIndex: number,
    isMobileView: boolean,
    assignments: Array<Array<{ productId: string; image: string }>>
  ) => {
    const maxImages = isMobileView ? 2 : 4
    const images: Array<{
      src: string
      position: string
      size: string
      opacity: number
      rotation: number
    }> = []
    
    // Get pre-assigned products for this slide
    const slideAssignments = assignments[slideIndex] || []
    
    // Different starting positions for different slides to create variety
    const positionSets = [
      // Slide 0 positions
      [
        { position: 'top-8 right-8', size: 'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48', rotation: 12 },
        { position: 'bottom-12 right-20', size: 'w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44', rotation: -8 },
        { position: 'top-1/2 right-1/4', size: 'w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40', rotation: 6 },
        { position: 'bottom-1/3 right-1/6', size: 'w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36', rotation: -4 },
      ],
      // Slide 1 positions
      [
        { position: 'top-6 right-6', size: 'w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44', rotation: -4 },
        { position: 'bottom-10 right-16', size: 'w-18 h-18 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40', rotation: 8 },
        { position: 'top-1/3 right-1/3', size: 'w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36', rotation: -6 },
        { position: 'top-2/3 right-1/5', size: 'w-12 h-12 sm:w-18 sm:h-18 md:w-26 md:h-26 lg:w-34 lg:h-34', rotation: 5 },
      ],
      // Slide 2 positions
      [
        { position: 'top-10 right-10', size: 'w-22 h-22 sm:w-30 sm:h-30 md:w-38 md:h-38 lg:w-46 lg:h-46', rotation: 10 },
        { position: 'bottom-8 right-24', size: 'w-16 h-16 sm:w-22 sm:h-22 md:w-30 md:h-30 lg:w-38 lg:h-38', rotation: -5 },
        { position: 'top-2/5 right-1/4', size: 'w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36', rotation: 7 },
        { position: 'bottom-1/4 right-1/3', size: 'w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-32 lg:h-32', rotation: -3 },
      ],
      // Slide 3 positions
      [
        { position: 'top-12 right-12', size: 'w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44', rotation: -3 },
        { position: 'bottom-6 right-20', size: 'w-18 h-18 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40', rotation: 6 },
        { position: 'top-1/2 right-1/5', size: 'w-12 h-12 sm:w-18 sm:h-18 md:w-26 md:h-26 lg:w-34 lg:h-34', rotation: -7 },
        { position: 'top-1/4 right-1/6', size: 'w-10 h-10 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-32 lg:h-32', rotation: 4 },
      ],
      // Slide 4 positions
      [
        { position: 'top-8 right-8', size: 'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48', rotation: 8 },
        { position: 'bottom-10 right-22', size: 'w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44', rotation: -6 },
        { position: 'top-3/5 right-1/3', size: 'w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36', rotation: 5 },
        { position: 'bottom-1/3 right-1/4', size: 'w-12 h-12 sm:w-18 sm:h-18 md:w-26 md:h-26 lg:w-34 lg:h-34', rotation: -4 },
      ],
    ]
    
    const positions = positionSets[slideIndex % positionSets.length]
    
    // Build images array from pre-assigned products
    for (let i = 0; i < Math.min(maxImages, slideAssignments.length); i++) {
      const assignment = slideAssignments[i]
      const pos = positions[i % positions.length]
      
      if (assignment && shouldRenderImage(assignment.image)) {
        images.push({
          src: assignment.image,
          position: pos.position,
          size: pos.size,
          opacity: 0.75 + (Math.random() * 0.20), // Random opacity between 0.75-0.95
          rotation: pos.rotation,
        })
      }
    }
    
    return images
  }

  const cartCount = cart.reduce((s, i) => s + (i.qty || 0), 0)
  
  // Ensure categories have accent colors (fallback if not populated)
  const categoriesWithColors = categories.map(cat => ({
    ...cat,
    accentColor: cat.accentColor || getCategoryAccentColor(cat.name),
    fallbackColor: cat.fallbackColor || getCategoryFallbackColor(cat.name),
  }))

  // Show only first 8 categories on home page
  const homeCategories = categoriesWithColors.slice(0, 8)

  // Carousel functionality
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  
  const banners = [
    {
      id: 1,
      title: 'Everything You Need.',
      subtitle: 'One Simple Store.',
      description: 'From everyday essentials to household favourites — find it all in one place.',
      buttonText: 'Shop Now',
      bgGradient: 'from-[#0F2847] via-[#1A3A5C] to-[#254C71]',
      accentColor: '#F5E6D3',
      secondaryAccent: '#E8B86D',
      textColor: '#FFFFFF',
      productGradient: 'from-[#F5E6D3]/25 to-[#E8B86D]/15',
    },
    {
      id: 2,
      title: 'Stock Up on',
      subtitle: 'Everyday Essentials',
      description: 'Everything your home needs, delivered with convenience.',
      buttonText: 'Explore Products',
      bgGradient: 'from-[#D4B896] via-[#E0C8A8] to-[#ECD8BA]',
      accentColor: '#C87040',
      secondaryAccent: '#A0522D',
      textColor: '#2C3E50',
      productGradient: 'from-[#C87040]/18 to-[#A0522D]/12',
    },
    {
      id: 3,
      title: 'More Products.',
      subtitle: 'Better Value.',
      description: 'Discover great prices across thousands of everyday products.',
      buttonText: 'View Offers',
      bgGradient: 'from-[#3D1F3D] via-[#4D2F4D] to-[#5D3F5D]',
      accentColor: '#F5E1E8',
      secondaryAccent: '#D4A5A5',
      textColor: '#FFFFFF',
      productGradient: 'from-[#F5E1E8]/22 to-[#D4A5A5]/14',
    },
    {
      id: 4,
      title: 'Made for',
      subtitle: 'Everyday Living',
      description: 'Discover products that make everyday life simpler.',
      buttonText: 'Browse Categories',
      bgGradient: 'from-[#2D5A6E] via-[#3D6A7E] to-[#4D7A8E]',
      accentColor: '#F0E8D8',
      secondaryAccent: '#E8C8A8',
      textColor: '#FFFFFF',
      productGradient: 'from-[#F0E8D8]/22 to-[#E8C8A8]/14',
    },
    {
      id: 5,
      title: 'Discover Something',
      subtitle: 'New Today',
      description: 'Explore our latest and most popular collections.',
      buttonText: 'Explore Now',
      bgGradient: 'from-[#1A1A1A] via-[#2A2A2A] to-[#3A3A3A]',
      accentColor: '#E8D8B8',
      secondaryAccent: '#D4C0A0',
      textColor: '#FFFFFF',
      productGradient: 'from-[#E8D8B8]/22 to-[#D4C0A0]/14',
    },
  ]

  // Compute carousel product assignments after banners is declared
  const carouselProductAssignments = useMemo(() => {
    return computeCarouselProductAssignments(
      banners.length,
      productsWithRealImages,
      isValidImage
    )
  }, [banners.length, productsWithRealImages])

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setDirection('next')
        setIsAnimating(true)
        setTimeout(() => {
          setCurrentSlide((prev) => (prev + 1) % banners.length)
          setTimeout(() => setIsAnimating(false), 50)
        }, 300)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isPaused])

  const goToSlide = (index: number) => {
    if (index === currentSlide) return
    setDirection(index > currentSlide ? 'next' : 'prev')
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentSlide(index)
      setTimeout(() => setIsAnimating(false), 50)
    }, 300)
  }

  const goToPrevSlide = () => {
    setDirection('prev')
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
      setTimeout(() => setIsAnimating(false), 50)
    }, 300)
  }

  const goToNextSlide = () => {
    setDirection('next')
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length)
      setTimeout(() => setIsAnimating(false), 50)
    }, 300)
  }

  const currentBanner = banners[currentSlide]

  return (
    <div className="flex-1 flex flex-col bg-[#FCFCFA] overflow-hidden relative">
      {/* Subtle background pattern for texture */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-blue-50/40 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-gradient-to-br from-amber-50/30 to-transparent rounded-full blur-3xl" />
      </div>
      
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        handleSearch={handleSearch}
        handleSearchFocus={handleSearchFocus}
        handleSearchBlur={handleSearchBlur}
        executeSearch={executeSearch}
        cartCount={cartCount}
        onNavigate={onNavigate}
        isMobile={isMobile}
      >
        <SearchDropdown
          showSearchDropdown={showSearchDropdown}
          isSearching={isSearching}
          searchSuggestions={searchSuggestions}
          searchQuery={searchQuery}
          handleSuggestionClick={handleSuggestionClick}
        />
      </Header>

      {/* Desktop Navigation - hidden on mobile */}
      {!isMobile && (
        <Navigation 
          activeTab={activeBottomTab} 
          onNavigate={onNavigate} 
          isMobile={false} 
        />
      )}

      <div className="flex-1 overflow-y-auto relative z-10">
        {/* Hero Carousel */}
        <div 
          className="w-full mx-auto px-4 mt-4 md:px-6 md:mt-6 lg:max-w-[1400px] lg:px-6 lg:mt-6 rounded-2xl overflow-hidden h-56 sm:h-64 md:h-72 lg:h-80 relative shrink-0 shadow-xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Carousel slides */}
          <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            isAnimating 
              ? direction === 'next' 
                ? 'opacity-0 translate-x-8' 
                : 'opacity-0 -translate-x-8'
              : 'opacity-100 translate-x-0'
          }`}>
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${currentBanner.bgGradient}`} />
            
            {/* Decorative product images */}
            {generateProductImages(currentSlide, isMobile, carouselProductAssignments).map((productImage, index) => {
              // Final defensive check - only render if image is still valid
              if (!shouldRenderImage(productImage.src)) return null
              
              return (
                <div
                  key={index}
                  className={`absolute ${productImage.position} ${productImage.size} overflow-hidden`}
                  style={{ 
                    opacity: productImage.opacity,
                    transform: `rotate(${productImage.rotation}deg)`,
                  }}
                  aria-hidden="true"
                >
                  <img
                    src={productImage.src}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' }}
                    onError={() => handleImageError(productImage.src)}
                  />
                  {/* Subtle overlay for blending */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${currentBanner.accentColor}15, ${currentBanner.secondaryAccent}20)`,
                      mixBlendMode: 'overlay'
                    }}
                  />
                </div>
              )
            })}
            
            {/* Subtle gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent pointer-events-none" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-10 z-10">
              <div className="max-w-md md:max-w-lg">
                <h3 
                  className={`font-extrabold leading-tight text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-2`}
                  style={{ color: currentBanner.textColor }}
                >
                  {currentBanner.title}<br />{currentBanner.subtitle}
                </h3>
                <p 
                  className={`text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 max-w-xs sm:max-w-md md:max-w-xl`}
                  style={{ 
                    color: currentBanner.textColor,
                    opacity: 0.9 
                  }}
                >
                  {currentBanner.description}
                </p>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      if (onNavigateToAllProducts) {
                        onNavigateToAllProducts()
                      } else {
                        onNavigate('product-list')
                      }
                    }}
                    className="bg-white text-gray-900 text-xs sm:text-sm md:text-base font-bold px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl shadow-lg hover:bg-gray-100 transition-all hover:shadow-xl"
                  >
                    {currentBanner.buttonText}
                  </button>
                  <button
                    onClick={() => {
                      if (categories.length > 0) openCategory(categories[0].id)
                    }}
                    className="text-white text-xs sm:text-sm md:text-base font-bold px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl border-2 border-white/40 hover:bg-white/15 transition-all shadow-lg hidden sm:block"
                    style={{ color: currentBanner.textColor }}
                  >
                    Browse Categories
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === index 
                    ? 'w-8 bg-white shadow-lg' 
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* Carousel navigation arrows */}
          <button
            onClick={goToPrevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/35 transition-all z-20 shadow-xl border border-white/30"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/35 transition-all z-20 shadow-xl border border-white/30"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Quick Category Explorer */}
        <MainContent className="mt-6 md:mt-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 md:h-8 bg-gradient-to-b from-gray-900 to-gray-600 rounded-full" />
                <h2 className="font-extrabold text-gray-900 text-lg md:text-xl lg:text-2xl">Shop by Category</h2>
              </div>
              <p className="text-gray-500 text-sm md:text-base mt-1">Browse our curated collections</p>
            </div>
            <button onClick={() => {
              if (onNavigateToAllProducts) {
                onNavigateToAllProducts()
              } else {
                onNavigate('product-list')
              }
            }} className="text-gray-600 text-sm font-semibold hover:text-gray-900 transition-colors">View all →</button>
          </div>
          {isLoadingCategories ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              {[...Array(8)].map((_, i) => (
                <CategorySkeleton key={i} />
              ))}
            </div>
          ) : categoriesError ? (
            <ErrorState message={categoriesError} />
          ) : categories.length === 0 ? (
            <EmptyState 
              icon="📂"
              title="No categories available"
            />
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {homeCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => openCategory(cat.id)}
                  className="flex-shrink-0 w-28 md:w-36 lg:w-40 rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 group"
                >
                  {/* Category Image Area */}
                  <div 
                    className="relative w-full h-24 md:h-28 lg:h-32 overflow-hidden"
                    style={{ backgroundColor: cat.accentColor || cat.fallbackColor || '#F5F5F5' }}
                  >
                    {/* Category thumbnail from product image */}
                    {cat.thumbnail ? (
                      <img
                        src={cat.thumbnail}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      /* Fallback visual when no thumbnail available */
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/40 backdrop-blur-sm rounded-xl shadow-inner flex items-center justify-center">
                          <div className="text-3xl md:text-4xl font-bold text-gray-400">
                            {cat.name.charAt(0)}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  
                  {/* Category Info */}
                  <div className="p-3 bg-white">
                    <h3 className="text-xs md:text-sm font-bold text-gray-800 text-center leading-tight line-clamp-2 mb-1">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-xs text-gray-500 text-center line-clamp-1 hidden md:block">
                        {cat.description}
                      </p>
                    )}
                    <div className="flex items-center justify-center mt-2 text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                      Explore →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </MainContent>

        {/* Promotional Highlight */}
        <MainContent className="mt-4 md:mt-6">
          <div className="bg-gradient-to-r from-[#1E293B] to-[#334155] rounded-2xl p-4 md:p-6 lg:p-8 text-white relative overflow-hidden">
            {/* Subtle decorative pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-block bg-[#F59E0B] text-white text-xs font-bold px-2 py-1 rounded-md mb-2">NEW</div>
                <h3 className="font-extrabold text-lg md:text-xl lg:text-2xl mb-1">Free Delivery on First Order</h3>
                <p className="text-gray-300 text-sm md:text-base">Use code WELCOME at checkout</p>
              </div>
              <button
                onClick={() => {
                  if (onNavigateToAllProducts) {
                    onNavigateToAllProducts()
                  } else {
                    onNavigate('product-list')
                  }
                }}
                className="bg-white text-[#1E293B] text-sm md:text-base font-bold px-5 py-2.5 rounded-xl hover:bg-[#F8F9FA] transition-colors shrink-0"
              >
                Shop Now
              </button>
            </div>
          </div>
        </MainContent>

        {/* Popular Products */}
        <MainContent className="mt-6 md:mt-8 pb-6 md:pb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 md:h-8 bg-gradient-to-b from-gray-900 to-gray-600 rounded-full" />
              <div>
                <h2 className="font-extrabold text-gray-900 text-lg md:text-xl lg:text-2xl">Popular Products</h2>
                <p className="text-gray-500 text-sm md:text-base mt-1">Explore products people are buying</p>
              </div>
            </div>
            <button onClick={() => {
              if (onNavigateToAllProducts) {
                onNavigateToAllProducts()
              } else {
                onNavigate('product-list')
              }
            }} className="text-gray-600 text-sm font-semibold hover:text-gray-900 transition-colors">View all →</button>
          </div>
          {isLoadingProducts ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {[...Array(6)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : productsError ? (
            <ErrorState message={productsError} />
          ) : featured.length === 0 ? (
            <EmptyState 
              icon="🛒"
              title="No products available"
            />
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {featured.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  cart={cart}
                  onAddToCart={addToCart}
                  onUpdateQuantity={updateQuantity}
                  onProductClick={openProduct}
                />
              ))}
            </div>
          )}
        </MainContent>
      </div>

      {/* Bottom Navigation - only on mobile */}
      {isMobile && (
        <NavBottom
          activeBottomTab={activeBottomTab}
          cartCount={cartCount}
          onNavigate={onNavigate}
          onOpenCategory={openCategory}
          categories={categories}
        />
      )}
    </div>
  )
}
