const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL
export const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5000/api/v1' : configuredApiBaseUrl || '/api/v1'
