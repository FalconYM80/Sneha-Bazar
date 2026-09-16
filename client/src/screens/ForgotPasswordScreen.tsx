import { useState } from 'react'
import { customerService } from '../services/customerService'
import { Logo } from '../components/Logo'
import type { Screen } from '../types/app'

interface ForgotPasswordScreenProps {
  onNavigate: (screen: string) => void
  onSetScreen: (screen: Screen) => void
}

export const ForgotPasswordScreen = ({ onSetScreen }: ForgotPasswordScreenProps) => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (isSubmitting) return

    setErrorMessage('')
    setSuccessMessage('')

    if (!email.trim()) {
      setErrorMessage('Please enter your email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await customerService.forgotPassword(email.trim().toLowerCase())
      setSuccessMessage(response.message || 'If an account exists with that email, a password reset link has been sent.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      <div className="px-6 py-4 flex flex-col flex-1 max-w-md mx-auto w-full animate-card-in">
        {/* Header Branding */}
        <div className="flex items-center gap-2.5 mb-7">
          <Logo className="w-10 h-10 rounded-xl transition-transform hover:scale-105" />
          <span className="text-xl font-extrabold text-gray-900">Sneha Bazar</span>
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Forgot your password?</h2>
        <p className="text-gray-400 text-sm mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {successMessage ? (
          <div className="space-y-5 animate-card-in">
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl text-sm leading-relaxed">
              <p className="font-bold mb-1">Reset Link Sent</p>
              <p>{successMessage}</p>
              <p className="text-xs text-green-700 mt-2">
                Please check your inbox (and spam folder) for the 30-minute password reset link.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSetScreen('login')}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-base shadow-sm hover:bg-gray-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">
                Email Address
              </label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-gray-400 focus-within:shadow-xs transition-all bg-[#F8F9FA]">
                <input
                  className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400 font-medium"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold animate-error-shake">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-base shadow-sm hover:bg-gray-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <p className="text-center text-gray-400 text-sm mt-6">
              {'Remember your password? '}
              <button
                type="button"
                onClick={() => onSetScreen('login')}
                className="text-gray-700 font-bold hover:text-gray-900 transition-colors"
              >
                Login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
