import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { accountsApi, clearTokens, getAccessToken, getStoredUser, setStoredUser, setTokens } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    // El backend aún no tiene /me/; recuperamos el usuario guardado al login.
    setUser(getStoredUser())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = async (username, password) => {
    const tokens = await accountsApi.login(username, password)
    setTokens(tokens)
    const u = { username }
    setStoredUser(u)
    setUser(u)
    return tokens
  }

  const register = async (payload) => {
    await accountsApi.register(payload)
    return login(payload.username, payload.password)
  }

  const logout = () => {
    clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
