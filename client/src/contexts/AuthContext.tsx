import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Customer } from '../types/customer'
import { customerService } from '../services/customerService'

interface AuthContextType {
  customer: Customer | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (customer: Customer, token: string) => void
  logout: () => void
  refreshCustomer: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const storedToken = localStorage.getItem('customerToken')
    const storedCustomer = localStorage.getItem('customerData')

    if (storedToken && storedCustomer) {
      try {
        setToken(storedToken)
        setCustomer(JSON.parse(storedCustomer))
        
        // Verify token is still valid by fetching current customer
        customerService.getCurrentCustomer()
          .then(updatedCustomer => {
            setCustomer(updatedCustomer)
            localStorage.setItem('customerData', JSON.stringify(updatedCustomer))
          })
          .catch(() => {
            // Token is invalid, clear everything
            localStorage.removeItem('customerToken')
            localStorage.removeItem('customerData')
            setToken(null)
            setCustomer(null)
          })
          .finally(() => {
            setIsLoading(false)
          })
      } catch (error) {
        // Invalid stored data, clear everything
        localStorage.removeItem('customerToken')
        localStorage.removeItem('customerData')
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = (customerData: Customer, authToken: string) => {
    setCustomer(customerData)
    setToken(authToken)
    localStorage.setItem('customerToken', authToken)
    localStorage.setItem('customerData', JSON.stringify(customerData))
  }

  const logout = () => {
    setCustomer(null)
    setToken(null)
    localStorage.removeItem('customerToken')
    localStorage.removeItem('customerData')
  }

  const refreshCustomer = async () => {
    if (!token) return
    try {
      const updatedCustomer = await customerService.getCurrentCustomer()
      setCustomer(updatedCustomer)
      localStorage.setItem('customerData', JSON.stringify(updatedCustomer))
    } catch (error) {
      logout()
    }
  }

  const value: AuthContextType = {
    customer,
    token,
    isAuthenticated: !!customer && !!token,
    isLoading,
    login,
    logout,
    refreshCustomer,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}