import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { accountsApi, clearTokens, getAccessToken, setTokens } from '../api'

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
    try {
      setUser(await accountsApi.me())
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = async (username, password) => {
    const tokens = await accountsApi.login(username, password)
    setTokens(tokens)
    await refresh()
    return tokens
  }

  const register = (payload) => accountsApi.register(payload)

  const updateUser = async (patch) => {
    const updated = await accountsApi.update(patch)
    setUser(updated)
    return updated
  }

  const logout = () => {
    clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)