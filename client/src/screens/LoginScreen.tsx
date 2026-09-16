import { useState } from 'react'
import { customerService } from '../services/customerService'
import { useAuth } from '../contexts/AuthContext'
import { isValidIndianPhone } from '../utils/phoneValidation'
import { Logo } from '../components/Logo'
import type { Screen } from '../types/app'

interface LoginScreenProps {
  onNavigate: (screen: string) => void
  onSetScreen: (screen: Screen) => void
}

export const LoginScreen = ({ onNavigate, onSetScreen }: LoginScreenProps) => {
  const { login } = useAuth()
  const [loginTab, setLoginTab] = useState<'phone' | 'email'>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState('')

  const handleLogin = async () => {
    setLoginError('')

    let loginIdentifier = ''

    if (loginTab === 'phone') {
      if (!phone.trim()) {
        setLoginError('Please enter your mobile number')
        return
      }
      if (!isValidIndianPhone(phone.trim())) {
        setLoginError('Please enter a valid 10-digit mobile number')
        return
      }
      loginIdentifier = phone.trim()
    } else {
      if (!email.trim()) {
        setLoginError('Please enter your email address')
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        setLoginError('Please enter a valid email address')
        return
      }
      loginIdentifier = email.trim().toLowerCase()
    }

    if (!password) {
      setLoginError('Please enter your password')
      return
    }

    setIsLoggingIn(true)
    try {
      const response = await customerService.login({
        identifier: loginIdentifier,
        password,
      })

      login(response.customer, response.token)
      onNavigate('home')
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : 'Invalid email/mobile number or password'
      )
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      <div className="px-6 py-4 flex flex-col flex-1">
        <div className="flex items-center gap-2.5 mb-7">
          <Logo className="w-10 h-10 rounded-xl" />
          <span className="text-xl font-extrabold text-gray-900">Sneha Bazar</span>
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome back!</h2>
        <p className="text-gray-400 text-sm mb-6">Sign in to continue shopping</p>

        {/* Tab toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          {(['phone', 'email'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setLoginTab(tab)
                setLoginError('')
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                loginTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
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
            <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-gray-400 transition-colors bg-[#F8F9FA]">
              {loginTab === 'phone' ? (
                <>
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
                </>
              ) : (
                <input
                  className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400 font-medium"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">
              Password
            </label>
            <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-gray-400 transition-colors bg-[#F8F9FA]">
              <input
                className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400 font-medium"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="button" className="text-gray-600 text-sm font-semibold hover:text-gray-900">
              Forgot Password?
            </button>
          </div>
        </div>

        {loginError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold">
            {loginError}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-base shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </button>

        <p className="text-center text-gray-400 text-sm mt-6">
          {'New to Sneha Bazar? '}
          <button
            type="button"
            onClick={() => onSetScreen('register')}
            className="text-gray-700 font-bold hover:text-gray-900 transition-colors"
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  )
}
