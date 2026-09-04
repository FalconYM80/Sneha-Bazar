import { apiService } from './api'
import type { LoginRequest, RegisterRequest, AuthResponse, Customer } from '../types/customer'

export const customerService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/customers/login', credentials)
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/customers/register', data)
  },

  async getCurrentCustomer(): Promise<Customer> {
    return apiService.get<Customer>('/customers/me')
  },
}