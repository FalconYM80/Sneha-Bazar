export interface Customer {
  _id: string
  name: string
  phone: string
  email?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface LoginRequest {
  phone: string
  password: string
}

export interface RegisterRequest {
  name: string
  phone: string
  email?: string
  password: string
}

export interface AuthResponse {
  customer: Customer
  token: string
}