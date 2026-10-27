import { API_BASE_URL } from './config'
import { ApiError } from './errors'

const ACCESS_TOKEN_KEY = 'construction_access_token'
const REFRESH_TOKEN_KEY = 'construction_refresh_token'
const LEGACY_AUTH_KEYS = ['construction-control.access-token', 'construction-control.refresh-token']

for (const key of LEGACY_AUTH_KEYS) sessionStorage.removeItem(key)

export const tokenStore = {
  get accessToken() { return sessionStorage.getItem(ACCESS_TOKEN_KEY) },
  get refreshToken() { return sessionStorage.getItem(REFRESH_TOKEN_KEY) },
  set(accessToken: string, refreshToken: string) { sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken); sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken) },
  clear() { sessionStorage.removeItem(ACCESS_TOKEN_KEY); sessionStorage.removeItem(REFRESH_TOKEN_KEY) },
}

export interface ApiRequestOptions extends RequestInit { query?: Record<string, string | number | boolean | undefined> }

async function request<T>(path: string, options: ApiRequestOptions = {}, retry = true): Promise<T> {
  const { query, headers, ...init } = options
  const url = new URL(`${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`)
  Object.entries(query ?? {}).forEach(([key, value]) => value !== undefined && url.searchParams.set(key, String(value)))
  const token = tokenStore.accessToken
  const response = await fetch(url, { ...init, headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers } })
  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    const refreshToken = tokenStore.refreshToken
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/refresh`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) })
        if (refreshResponse.ok) { const refreshed = await refreshResponse.json() as { accessToken: string; refreshToken: string }; tokenStore.set(refreshed.accessToken, refreshed.refreshToken); return request<T>(path, options, false) }
      } catch { /* clear below */ }
    }
    tokenStore.clear()
  }
  if (!response.ok) throw new ApiError(`API request failed: ${response.status}`, response.status, await response.text())
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> { return request<T>(path, options) }
