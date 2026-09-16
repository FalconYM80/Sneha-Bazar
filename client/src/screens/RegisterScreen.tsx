import { useState } from 'react'
import { customerService } from '../services/customerService'
import { useAuth } from '../contexts/AuthContext'
import { isValidIndianPhone, normalizeToE164 } from '../utils/phoneValidation'
import { Logo } from '../components/Logo'
import type { Screen } from '../types/app'

interface RegisterScreenProps {
  onNavigate: (screen: string) => void
  onSetScreen: (screen: Screen) => void
}

export const RegisterScreen = ({ onNavigate, onSetScreen }: RegisterScreenProps) => {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [registerError, setRegisterError] = useState('')

  const handleRegister = async () => {
    setRegisterError('')

    // Validation
    if (!name.trim()) {
      setRegisterError('Please enter your full name')
      return
    }
    if (!phone) {
      setRegisterError('Please enter your mobile number')
      return
    }
    if (!isValidIndianPhone(phone)) {
      setRegisterError('Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9')
      return
    }
    if (!email.trim()) {
      setRegisterError('Please enter your email address')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setRegisterError('Please enter a valid email address')
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
    if (!confirmPassword) {
      setRegisterError('Please confirm your password')
      return
    }
    if (password !== confirmPassword) {
      setRegisterError('Passwords do not match')
      return
    }

    setIsRegistering(true)
    try {
      const e164 = normalizeToE164(phone)
      const response = await customerService.register({
        name: name.trim(),
        phone: e164,
        email: email.trim().toLowerCase(),
        password,
      })

      login(response.customer, response.token)
      onNavigate('home')
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setIsRegistering(false)
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

        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Create Account</h2>
        <p className="text-gray-400 text-sm mb-6">Join us and start shopping fresh</p>

        <div className="space-y-4 mb-5">
          {/* Full Name */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">
              Full Name
            </label>
            <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-gray-400 focus-within:shadow-xs transition-all bg-[#F8F9FA]">
              <input
                className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400 font-medium"
                placeholder="John Doe"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">
              Mobile Number
            </label>
            <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-gray-400 focus-within:shadow-xs transition-all bg-[#F8F9FA]">
              <span className="text-gray-700 text-xs font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-200 shrink-0">
                IN
              </span>
              <span className="text-gray-900 text-sm font-bold shrink-0">+91</span>
              <div className="w-px h-5 bg-gray-300 shrink-0" />
              <input
                className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400 font-medium"
                placeholder="98765 43210"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
              />
            </div>
          </div>

          {/* Email Address */}
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
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">
              Password
            </label>
            <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-gray-400 focus-within:shadow-xs transition-all bg-[#F8F9FA]">
              <input
                className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400 font-medium"
                placeholder="Create a password (min 6 characters)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                placeholder="Re-enter your password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Error message */}
        {registerError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold animate-error-shake">
            {registerError}
          </div>
        )}

        {/* Create Account Submit Button */}
        <button
          type="button"
          onClick={handleRegister}
          disabled={isRegistering}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-base shadow-sm hover:bg-gray-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isRegistering ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            'Create Account'
          )}
        </button>

        <p className="text-center text-gray-400 text-sm mt-6">
          {'Already have an account? '}
          <button
            type="button"
            onClick={() => onSetScreen('login')}
            className="text-gray-700 font-bold hover:text-gray-900 transition-colors"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  )
}
