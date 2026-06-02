import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, {
  getStoredToken,
  getStoredUser,
  setAuthToken,
  setStoredUser,
  setUnauthorizedHandler,
} from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [token, setToken] = useState(() => getStoredToken())
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    setAuthToken(null)
    setStoredUser(null)
    setToken(null)
    setUser(null)
  }, [])

  const applySession = useCallback((accessToken, nextUser) => {
    setAuthToken(accessToken)
    setStoredUser(nextUser)
    setToken(accessToken)
    setUser(nextUser)
  }, [])

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me')
    setStoredUser(data)
    setUser(data)
    return data
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
    })
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const storedToken = getStoredToken()
      if (!storedToken) {
        if (!cancelled) setLoading(false)
        return
      }

      setAuthToken(storedToken)
      setToken(storedToken)

      try {
        const me = await refreshUser()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) clearSession()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [clearSession, refreshUser])

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password })
      applySession(data.access_token, data.user)
      return data.user
    },
    [applySession],
  )

  const register = useCallback(
    async (name, email, password) => {
      await api.post('/auth/register', { name, email, password })
      return login(email, password)
    },
    [login],
  )

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, loading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
