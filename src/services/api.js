import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
})

let authToken = null

export function setAuthToken(token) {
  authToken = token
  if (token) {
    localStorage.setItem('qera_token', token)
  } else {
    localStorage.removeItem('qera_token')
    localStorage.removeItem('qera_user')
  }
}

export function getStoredToken() {
  return authToken || localStorage.getItem('qera_token')
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('qera_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('qera_user')
  }
}

export function getStoredUser() {
  const raw = localStorage.getItem('qera_user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

let onUnauthorized = null

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getApiErrorMessage(error, fallback = 'Something went wrong.') {
  if (error.response?.status === 401) {
    return 'Authentication required. Please sign in again.'
  }
  if (error.response?.status === 403) {
    return 'Admin access required. Please sign in with an admin account.'
  }
  const detail = error.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }
  return fallback
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized()
    }
    return Promise.reject(error)
  },
)

export default api
