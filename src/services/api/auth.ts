import type { Role } from '@/types/domain'
import { apiRequest, tokenStore } from './client'

export interface ApiUser { id: string; name: string; email: string; phone?: string | null; jobTitle?: string | null; status: string; memberships: Array<{ companyId: string; role: Role; company: { id: string; name: string; slug: string; defaultCurrency: string; timezone: string } }> }
interface AuthResponse { accessToken: string; refreshToken: string; user: { id: string; email: string; companyId: string; role: Role } }

export async function loginRequest(email: string, password: string) { const result = await apiRequest<AuthResponse>('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); tokenStore.set(result.accessToken, result.refreshToken); return getCurrentUser() }
export async function getCurrentUser() { return apiRequest<ApiUser>('/auth/me') }
export async function logoutRequest() { try { await apiRequest('/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: tokenStore.refreshToken }) }) } finally { tokenStore.clear() } }
