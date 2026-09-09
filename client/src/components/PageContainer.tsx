import React, { forwardRef } from 'react'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

/**
 * Responsive page container that provides consistent layout across all screens.
 * 
 * Mobile (< 768px): Full width with minimal padding
 * Tablet (768px - 1023px): Centered with moderate max-width
 * Desktop (>= 1024px): Centered with larger max-width
 * Large Desktop (>= 1280px): Centered with maximum width
 */
export const PageContainer = ({ children, className = '' }: PageContainerProps) => {
  return (
    <div className={`w-full mx-auto ${className}`}>
      {children}
    </div>
  )
}

/**
 * Content wrapper for screen content areas
 * Provides responsive padding and max-width
 */
export const ContentWrapper = ({ children, className = '' }: PageContainerProps) => {
  return (
    <div className={`w-full mx-auto px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 ${className}`}>
      {children}
    </div>
  )
}

/**
 * Main content area with responsive grid capabilities
 */
export const MainContent = forwardRef<HTMLDivElement, PageContainerProps>(({ children, className = '' }, ref) => {
  return (
    <div ref={ref} className={`w-full mx-auto px-4 py-4 md:px-6 md:py-6 lg:max-w-[1400px] lg:px-6 lg:py-6 ${className}`}>
      {children}
    </div>
  )
})

MainContent.displayName = 'MainContent'
