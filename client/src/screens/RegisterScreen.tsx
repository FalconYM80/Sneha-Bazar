import { useState } from 'react'
import { customerService } from '../services/customerService'
import { useAuth } from '../contexts/AuthContext'
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
  const [isRegistering, setIsRegistering] = useState(false)
  const [registerError, setRegisterError] = useState('')

  const handleRegister = async () => {
    setRegisterError('')
    
    // Validation
    if (!name.trim()) {
      setRegisterError('Please enter your name')
      return
    }
    if (!phone) {
      setRegisterError('Please enter your phone number')
      return
    }
    if (phone.length !== 10) {
      setRegisterError('Please enter a valid 10-digit phone number')
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

    setIsRegistering(true)
    try {
      const response = await customerService.register({
        name: name.trim(),
        phone,
        email: email.trim() || undefined,
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
      <div className="px-6 py-4 flex flex-col flex-1">
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-md">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 18h12M8 12l-3 6h14l-3-6M12 3c-2 0-4 1.5-4 4h8c0-2.5-2-4-4-4z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="22" r="1.5" fill="white" />
              <circle cx="15" cy="22" r="1.5" fill="white" />
            </svg>
          </div>
          <span className="text-xl font-extrabold text-gray-900">Sneha Bazar</span>
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Create Account</h2>
        <p className="text-gray-400 text-sm mb-6">Join us and start shopping fresh</p>

        <div className="space-y-4 mb-5">
          <div>
            <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">Full Name</label>
            <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-gray-400 transition-colors bg-[#F8F9FA]">
              <input 
                className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400" 
                placeholder="John Doe" 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">Mobile Number</label>
            <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-gray-400 transition-colors bg-[#F8F9FA]">
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
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">Email Address (Optional)</label>
            <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-gray-400 transition-colors bg-[#F8F9FA]">
              <input 
                className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400" 
                placeholder="name@example.com" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-widest">Password</label>
            <div className="flex items-center border-2 border-gray-200 rounded-xl px-3.5 py-3.5 gap-2 focus-within:border-gray-400 transition-colors bg-[#F8F9FA]">
              <input 
                className="flex-1 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400" 
                placeholder="Create a password (min 6 characters)" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        {registerError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold">
            {registerError}
          </div>
        )}

        <button
          onClick={handleRegister}
          disabled={isRegistering}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-base shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRegistering ? 'Creating Account...' : 'Create Account'}
        </button>

        <p className="text-center text-gray-400 text-sm mt-6">
          {"Already have an account? "}
          <button onClick={() => onSetScreen('login')} className="text-gray-700 font-bold hover:text-gray-900 transition-colors">Login</button>
        </p>
      </div>
    </div>
  )
}
