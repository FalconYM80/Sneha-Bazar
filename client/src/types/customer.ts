export interface Customer {
  _id: string
  name: string
  phone: string
  email?: string
  phoneVerified?: boolean
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface LoginRequest {
  identifier?: string
  phone?: string
  email?: string
  password: string
}

export interface RegisterRequest {
  name: string
  phone: string
  email?: string
  password: string
  verificationToken?: string
}

export interface UpdateProfileRequest {
  name: string
  email?: string
}

export interface AuthResponse {
  customer: Customer
  token: string
  requiresPhoneVerification?: boolean
  message?: string
}

export interface SendOtpResponse {
  success: boolean
  message: string
  retryAfter?: number
}

export interface VerifyOtpResponse {
  success: boolean
  verified: boolean
  verificationToken?: string
  message: string
}

export interface ResendOtpResponse {
  success: boolean
  message: string
  retryAfter?: number
}