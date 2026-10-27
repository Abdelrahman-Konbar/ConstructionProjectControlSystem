import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getCurrentUser, loginRequest, logoutRequest, tokenStore } from '@/services/api'
import type { Company, User } from '@/types/domain'

export interface AuthSession { user: User; company: Company }

interface AuthContextValue { session: AuthSession | null; isAuthenticated: boolean; isLoading: boolean; signIn: (email: string, password: string) => Promise<void>; signOut: () => Promise<void> }
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(tokenStore.accessToken))
  useEffect(() => {
    if (!tokenStore.accessToken) { setIsLoading(false); return }
    getCurrentUser()
      .then((user) => setSession({ user: { id: user.id, companyId: user.memberships[0]?.companyId ?? '', name: user.name, email: user.email, jobTitle: user.jobTitle, roles: user.memberships.map((membership) => membership.role), permissions: [] }, company: user.memberships[0]?.company ?? { id: '', name: '' } }))
      .catch(() => { tokenStore.clear(); setSession(null) })
      .finally(() => setIsLoading(false))
  }, [])
  const value = useMemo<AuthContextValue>(() => ({
    session, isAuthenticated: Boolean(session), isLoading,
    signIn: async (email, password) => { const user = await loginRequest(email, password); const membership = user.memberships[0]; if (!membership) throw new Error('No active company membership'); setSession({ user: { id: user.id, companyId: membership.companyId, name: user.name, email: user.email, jobTitle: user.jobTitle, roles: user.memberships.map((item) => item.role), permissions: [] }, company: membership.company }) },
    signOut: async () => { await logoutRequest(); setSession(null) },
  }), [session, isLoading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within AuthProvider'); return context }
