import React from 'react'
import { Logo } from './Logo'
import { IcLocation, IcExternalLink } from './icons'
import { shopConfig } from '../config/shopConfig'

interface FooterProps {
  onNavigate: (screen: string) => void
  isMobile?: boolean
  className?: string
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  isMobile = false,
  className = '',
}) => {
  return (
    <footer
      className={`bg-[#1F2937] text-gray-300 border-t border-gray-800/80 ${className}`}
      role="contentinfo"
    >
      <div className="max-w-[1400px] mx-auto px-4 py-8 md:px-6 md:py-12 lg:px-8">
        {/* Main Footer Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* 1. Brand Section */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <Logo className="w-8 h-8 rounded-lg" alt={shopConfig.shopName} />
              <span className="text-lg font-extrabold text-white tracking-tight">
                {shopConfig.shopName}
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-400 leading-relaxed max-w-xs">
              Your everyday essentials, ready for pickup.
            </p>
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-emerald-400 text-[11px] font-medium px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>In-Store Pickup Only</span>
            </div>
          </div>

          {/* 2. Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5">
              Quick Links
            </h3>
            <nav aria-label="Footer Quick Links">
              <ul className="space-y-2 text-xs md:text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('home')}
                    className="text-gray-400 hover:text-white transition-colors duration-150 text-left focus:outline-none focus:text-white"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('product-list')}
                    className="text-gray-400 hover:text-white transition-colors duration-150 text-left focus:outline-none focus:text-white"
                  >
                    Browse Products
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('cart')}
                    className="text-gray-400 hover:text-white transition-colors duration-150 text-left focus:outline-none focus:text-white"
                  >
                    Cart
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('orders')}
                    className="text-gray-400 hover:text-white transition-colors duration-150 text-left focus:outline-none focus:text-white"
                  >
                    My Orders
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('profile')}
                    className="text-gray-400 hover:text-white transition-colors duration-150 text-left focus:outline-none focus:text-white"
                  >
                    Profile
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          {/* 3. Customer Care */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5">
              Customer
            </h3>
            <nav aria-label="Footer Customer Links">
              <ul className="space-y-2 text-xs md:text-sm">
                <li>
                  <a
                    href={shopConfig.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-150 inline-flex items-center gap-1 focus:outline-none focus:text-white"
                  >
                    Contact Us
                    <IcExternalLink />
                  </a>
                </li>
                <li>
                  <a
                    href={shopConfig.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-150 inline-flex items-center gap-1 focus:outline-none focus:text-white"
                  >
                    Pickup Information
                    <IcExternalLink />
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('orders')}
                    className="text-gray-400 hover:text-white transition-colors duration-150 text-left focus:outline-none focus:text-white"
                  >
                    Order Information
                  </button>
                </li>
                <li>
                  <span className="text-gray-500 text-xs cursor-default select-none">
                    Privacy Policy
                  </span>
                </li>
                <li>
                  <span className="text-gray-500 text-xs cursor-default select-none">
                    Terms & Conditions
                  </span>
                </li>
              </ul>
            </nav>
          </div>

          {/* 4. Visit Us */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5">
              Visit Us (Pickup)
            </h3>
            <div className="space-y-1 text-xs md:text-sm text-gray-400 leading-relaxed">
              <p className="font-semibold text-white">{shopConfig.shopName}</p>
              <p>{shopConfig.address.line1}, {shopConfig.address.line2}</p>
              <p>{shopConfig.address.area}, {shopConfig.address.city} – {shopConfig.address.pincode}</p>
            </div>
            <div className="pt-1.5">
              <a
                href={shopConfig.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors duration-150 group focus:outline-none focus:underline"
              >
                <IcLocation />
                <span>View on Google Maps</span>
                <span className="transition-transform group-hover:translate-x-0.5">
                  <IcExternalLink />
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar / Copyright */}
        <div className={`mt-8 md:mt-10 pt-6 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 ${
          isMobile ? 'pb-16' : ''
        }`}>
          <p>© 2026 {shopConfig.shopName}. All rights reserved.</p>
          <p className="text-gray-500 text-[11px]">
            In-Store Pickup • Mangaluru, Karnataka
          </p>
        </div>
      </div>
    </footer>
  )
}
