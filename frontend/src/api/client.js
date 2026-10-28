import axios from 'axios'
import { supabase } from '../lib/supabaseClient'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 60000, // 60s for AI operations
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach JWT from current Supabase session
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle 401 (token expired)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh the session
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        // Redirect to login if refresh fails
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
