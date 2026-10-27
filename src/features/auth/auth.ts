import { mockCompany, mockUser } from '@/data/mock'
import type { Company, User } from '@/types/domain'

export interface AuthSession { user: User; company: Company }
export interface AuthService { login(email: string, password: string): Promise<AuthSession>; logout(): Promise<void>; getCurrentUser(): Promise<AuthSession | null> }

export const authService: AuthService = {
  async login() { throw new Error('Development auth service is not enabled; use the API auth service.') },
  async logout() {},
  async getCurrentUser() { return null },
}
