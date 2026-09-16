import { apiService } from './api'
import type {
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  AuthResponse,
  Customer,
  SendOtpResponse,
  VerifyOtpResponse,
  ResendOtpResponse,
} from '../types/customer'

export const customerService = {
  async sendOtp(phone: string): Promise<SendOtpResponse> {
    return apiService.post<SendOtpResponse>('/customers/send-otp', { phone })
  },

  async verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
    return apiService.post<VerifyOtpResponse>('/customers/verify-otp', { phone, otp })
  },

  async resendOtp(phone: string): Promise<ResendOtpResponse> {
    return apiService.post<ResendOtpResponse>('/customers/resend-otp', { phone })
  },

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/customers/login', credentials)
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/customers/register', data)
  },

  async getCurrentCustomer(): Promise<Customer> {
    return apiService.get<Customer>('/customers/me')
  },

  async updateProfile(data: UpdateProfileRequest): Promise<Customer> {
    return apiService.patch<Customer>('/customers/profile', data)
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return apiService.post<{ success: boolean; message: string }>('/customers/forgot-password', { email })
  },

  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    return apiService.post<{ success: boolean; message: string }>(`/customers/reset-password/${encodeURIComponent(token)}`, { password })
  },
}