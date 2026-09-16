import { useState } from 'react'
import { NavBottom } from '../components/NavBottom'
import { Header } from '../components/Header'
import { Navigation } from '../components/Navigation'
import { MainContent } from '../components/PageContainer'
import { IcUser, IcLocation, IcHelp, IcExternalLink, IcClose, IcCheckTiny } from '../components/icons'
import { shopConfig } from '../config/shopConfig'
import { useAuth } from '../contexts/AuthContext'
import { customerService } from '../services/customerService'

import type { Product } from '../types/app'
import { SearchDropdown } from '../components/SearchDropdown'

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
  searchQuery?: string
  handleSearch?: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSearchFocus?: () => void
  handleSearchBlur?: () => void
  executeSearch?: () => void
  showSearchDropdown?: boolean
  isSearching?: boolean
  searchSuggestions?: Product[]
  handleSuggestionClick?: (product: Product) => void
}

export const ProfileScreen = ({
  customer: propCustomer,
  navigate,
  logout,
  clearNavigationState,
  setCart,
  activeBottomTab,
  onNavigate,
  onOpenCategory,
  categories,
  isMobile = true,
  searchQuery = '',
  handleSearch = () => {},
  handleSearchFocus = () => {},
  handleSearchBlur = () => {},
  executeSearch = () => {},
  showSearchDropdown = false,
  isSearching = false,
  searchSuggestions = [],
  handleSuggestionClick = () => {},
}: ProfileScreenProps) => {
  const { customer: authCustomer, updateCustomer } = useAuth()
  const customer = authCustomer || propCustomer

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successToast, setSuccessToast] = useState('')

  const formatDisplayPhone = (phone?: string) => {
    if (!phone) return ''
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 12 && digits.startsWith('91')) {
      return `+91 ${digits.slice(2)}`
    }
    if (digits.length === 10) {
      return `+91 ${digits}`
    }
    return phone.startsWith('+') ? phone : `+91 ${phone}`
  }

  const handleOpenEdit = () => {
    setName(customer?.name || '')
    setEmail(customer?.email || '')
    setErrorMessage('')
    setIsEditOpen(true)
  }

  const handleCloseEdit = () => {
    if (isSaving) return
    setIsEditOpen(false)
    setErrorMessage('')
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) {
      setErrorMessage('Full name cannot be empty')
      return
    }

    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        setErrorMessage('Please enter a valid email address')
        return
      }
    }

    setIsSaving(true)
    try {
      const updatedCustomer = await customerService.updateProfile({
        name: trimmedName,
        email: trimmedEmail || undefined,
      })
      updateCustomer(updatedCustomer)
      setIsEditOpen(false)
      setSuccessToast('Profile updated successfully')
      setTimeout(() => {
        setSuccessToast('')
      }, 3500)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update profile. Please try again.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F7F6F2] overflow-hidden relative">
      {/* Success Toast Notification */}
      {successToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#16A34A] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold transition-all">
          <IcCheckTiny />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        handleSearch={handleSearch}
        handleSearchFocus={handleSearchFocus}
        handleSearchBlur={handleSearchBlur}
        executeSearch={executeSearch}
        cartCount={0}
        onNavigate={onNavigate}
        isMobile={isMobile}
        title="Profile"
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

      <MainContent className="flex-1 overflow-y-auto lg:max-w-[1100px]">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB] mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center font-extrabold text-gray-600 text-2xl md:text-3xl shadow-sm border border-gray-200 shrink-0">
              {customer?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-gray-900 font-extrabold text-lg md:text-xl lg:text-2xl truncate">
                {customer?.name || 'Guest'}
              </h2>
              <p className="text-gray-500 text-sm md:text-base">
                {formatDisplayPhone(customer?.phone)}
              </p>
              {customer?.email && (
                <p className="text-gray-400 text-xs mt-0.5 truncate">{customer.email}</p>
              )}
            </div>
            <button
              onClick={handleOpenEdit}
              className="bg-white text-gray-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-300 hover:bg-[#F8F9FA] transition-colors shrink-0"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E5E7EB] mb-4">
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-4 pt-3.5 pb-2 md:px-6 md:pt-4 md:pb-3">
            Account
          </p>
          
          {/* Personal Information */}
          <button
            onClick={handleOpenEdit}
            className="w-full flex items-center gap-3 px-4 py-3.5 md:px-6 md:py-4 text-left hover:bg-[#F8F9FA] transition-colors"
          >
            <span className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-gray-600 shrink-0 bg-gray-50">
              <IcUser />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-base font-semibold text-gray-900">Personal Information</p>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5 truncate">
                {customer?.name ? `${customer.name}${customer.email ? ` • ${customer.email}` : ''}` : 'Name, email, mobile number'}
              </p>
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

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={handleCloseEdit}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Edit Profile</h3>
                <p className="text-xs text-gray-400 mt-0.5">Update your personal information</p>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={isSaving}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <IcClose />
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                {errorMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 mb-1.5 block uppercase tracking-wider">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full border-2 border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 focus:border-green-600 focus:outline-none transition-colors bg-[#F8F9FA]"
                  required
                  disabled={isSaving}
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 mb-1.5 block uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  className="w-full border-2 border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-900 focus:border-green-600 focus:outline-none transition-colors bg-[#F8F9FA]"
                  disabled={isSaving}
                />
              </div>

              {/* Phone Number (Read-only) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-gray-500 block uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-md">
                    Cannot be changed
                  </span>
                </div>
                <input
                  type="text"
                  value={formatDisplayPhone(customer?.phone)}
                  disabled
                  readOnly
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-500 bg-gray-100 cursor-not-allowed font-medium"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
}
