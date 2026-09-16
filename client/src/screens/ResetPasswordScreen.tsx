import { useState } from 'react'
import { customerService } from '../services/customerService'
import { Logo } from '../components/Logo'
import type { Screen } from '../types/app'

interface ResetPasswordScreenProps {
  token: string
  onSetScreen: (screen: Screen) => void
  onPasswordResetSuccess?: () => void
}

export const ResetPasswordScreen = ({
  token,
  onSetScreen,
  onPasswordResetSuccess,
}: ResetPasswordScreenProps) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (isSubmitting) return

    setErrorMessage('')

    if (!token || !token.trim()) {
      setErrorMessage('Reset token is missing or invalid. Please request a new password reset link.')
      return
    }

    if (!password) {
      setErrorMessage('Please enter a password')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters')
      return
    }

    if (!confirmPassword) {
      setErrorMessage('Please confirm your password')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      await customerService.resetPassword(token.trim(), password)
      setIsSuccess(true)
      if (onPasswordResetSuccess) {
        onPasswordResetSuccess()
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'This password reset link is invalid or has expired.'
      )
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

        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Create a new password</h2>
        <p className="text-gray-400 text-sm mb-6">
          Your new password must be at least 6 characters.
        </p>

        {isSuccess ? (
          <div className="space-y-5 animate-card-in">
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl text-sm leading-relaxed">
              <p className="font-bold mb-1">Password Reset Successful</p>
              <p>Your password has been changed successfully. You can now sign in using your new password.</p>
            </div>

            <button
              type="button"
              onClick={() => onSetScreen('login')}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-base shadow-sm hover:bg-gray-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              Sign In Now
            </button>
          </div>
        ) : !token ? (
          <div className="space-y-5">
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-sm leading-relaxed">
              <p className="font-bold mb-1">Invalid Reset Link</p>
              <p>No valid reset token was detected in the URL. Please request a new password reset link.</p>
            </div>

            <button
              type="button"
              onClick={() => onSetScreen('forgot-password')}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-base shadow-sm hover:bg-gray-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              Request New Link
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">
                New Password
              </label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-gray-400 focus-within:shadow-xs transition-all bg-[#F8F9FA]">
                <input
                  className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400 font-medium"
                  placeholder="Enter new password (min 6 characters)"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">
                Confirm Password
              </label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-gray-400 focus-within:shadow-xs transition-all bg-[#F8F9FA]">
                <input
                  className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400 font-medium"
                  placeholder="Re-enter new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold animate-error-shake">
                {errorMessage}
              </div>
            )}

            {/* Reset Password Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-base shadow-sm hover:bg-gray-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                'Reset Password'
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
