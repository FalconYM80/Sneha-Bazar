import { useState } from 'react'
import { customerService } from '../services/customerService'
import { useAuth } from '../contexts/AuthContext'
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
    
    // Validation
    if (loginTab === 'phone' && !phone) {
      setLoginError('Please enter your phone number')
      return
    }
    if (loginTab === 'email' && !email) {
      setLoginError('Please enter your email address')
      return
    }
    if (!password) {
      setLoginError('Please enter your password')
      return
    }

    if (loginTab === 'phone' && phone.length !== 10) {
      setLoginError('Please enter a valid 10-digit phone number')
      return
    }

    setIsLoggingIn(true)
    try {
      const response = await customerService.login({
        phone: loginTab === 'phone' ? phone : '',
        password,
      })
      
      login(response.customer, response.token)
      onNavigate('home')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      <div className="px-6 py-4 flex flex-col flex-1">
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-md shadow-green-200">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 18h12M8 12l-3 6h14l-3-6M12 3c-2 0-4 1.5-4 4h8c0-2.5-2-4-4-4z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="22" r="1.5" fill="white" />
              <circle cx="15" cy="22" r="1.5" fill="white" />
            </svg>
          </div>
          <span className="text-xl font-extrabold text-gray-900">Sneha Bazar</span>
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome back!</h2>
        <p className="text-gray-400 text-sm mb-6">Sign in to continue shopping</p>

        {/* Tab toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          {(['phone', 'email'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setLoginTab(tab); setLoginError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${loginTab === tab ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
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
            <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-green-500 transition-colors bg-gray-50">
              {loginTab === 'phone' ? (
                <>
                  <span className="text-gray-600 text-sm font-bold shrink-0">🇮🇳 +91</span>
                  <div className="w-px h-5 bg-gray-300 shrink-0" />
                  <input 
                    className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400" 
                    placeholder="98765 43210" 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                  />
                </>
              ) : (
                <input 
                  className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400" 
                  placeholder="name@example.com" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">Password</label>
            <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-green-500 transition-colors bg-gray-50">
              <input 
                className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400" 
                placeholder="Enter your password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button className="text-green-600 text-sm font-semibold">Forgot Password?</button>
          </div>
        </div>

        {loginError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold">
            {loginError}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-green-200 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-xs font-medium">or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button className="w-full border-2 border-gray-200 text-gray-700 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
          Continue with Google
        </button>

        <p className="text-center text-gray-400 text-sm mt-6">
          {"New to Sneha Bazar? "}
          <button onClick={() => onSetScreen('register')} className="text-green-600 font-bold">Create Account</button>
        </p>
      </div>
    </div>
  )
}
