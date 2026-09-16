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
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#16A34A] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold animate-modal-in">
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
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5E7EB] mb-4 animate-card-in stagger-1">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center font-extrabold text-gray-600 text-2xl md:text-3xl shadow-xs border border-gray-200 shrink-0">
              {customer?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-extrabold text-gray-900 text-xl md:text-2xl truncate">
                {customer?.name || 'Customer'}
              </h2>
              {customer?.phone && (
                <p className="text-gray-500 text-sm mt-0.5 font-medium">
                  {formatDisplayPhone(customer.phone)}
                </p>
              )}
              {customer?.email && (
                <p className="text-gray-400 text-xs mt-0.5 truncate">
                  {customer.email}
                </p>
              )}
            </div>
            <button
              onClick={handleOpenEdit}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all shrink-0"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Store Info Card */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#E5E7EB] mb-4 animate-card-in stagger-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-gray-900 text-sm md:text-base">Store Information</h3>
            <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
              Pickup Point
            </span>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0 mt-0.5">
              <IcLocation />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{shopConfig.shopName}</p>
              <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{shopConfig.address.fullAddress}</p>
              <a
                href={shopConfig.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-green-700 font-semibold mt-1.5 hover:underline"
              >
                View on Google Maps <IcExternalLink />
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-xs border border-[#E5E7EB] mb-4 overflow-hidden divide-y divide-gray-100 animate-card-in stagger-3">
          <button
            onClick={() => navigate('orders')}
            className="w-full flex items-center justify-between p-4 hover:bg-[#F8F9FA] active:scale-[0.99] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <IcUser />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">My Orders</p>
                <p className="text-gray-400 text-xs">View order history and track pickup</p>
              </div>
            </div>
            <span className="text-gray-400 text-sm">→</span>
          </button>

          <a
            href={shopConfig.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-4 hover:bg-[#F8F9FA] active:scale-[0.99] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <IcHelp />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Store Directions & Help</p>
                <p className="text-gray-400 text-xs">Locate our store or find assistance</p>
              </div>
            </div>
            <span className="text-gray-400 text-sm">→</span>
          </a>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => {
            logout()
            clearNavigationState()
            setCart([])
            navigate('login')
          }}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.99] mb-4 border border-red-100"
        >
          Sign Out
        </button>

        <p className="text-center text-gray-300 text-[10px] md:text-xs pb-4 font-medium">Sneha Bazar v2.4.1</p>
      </MainContent>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-backdrop-in"
          onClick={handleCloseEdit}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative my-8 animate-modal-in"
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
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-90 transition-all"
              >
                <IcClose />
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium animate-error-shake">
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
