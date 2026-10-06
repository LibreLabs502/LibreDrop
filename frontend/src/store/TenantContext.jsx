import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { tenantsApi } from '../api'

const TENANT_KEY = 'libredrop_tenant'
const TenantContext = createContext(null)

export function TenantProvider({ children }) {
  const [stores, setStores] = useState([])
  const [current, setCurrent] = useState(() => {
    const id = localStorage.getItem(TENANT_KEY)
    return id ? Number(id) : null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      const list = await tenantsApi.list()
      setStores(list)
      setError('')
      setCurrent((prev) => {
        if (prev && list.some((t) => t.id === prev)) {
          localStorage.setItem(TENANT_KEY, String(prev))
          return prev
        }
        const first = list[0]?.id ?? null
        if (first) localStorage.setItem(TENANT_KEY, String(first))
        else localStorage.removeItem(TENANT_KEY)
        return first
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const select = (id) => {
    setCurrent(id)
    if (id) localStorage.setItem(TENANT_KEY, String(id))
    else localStorage.removeItem(TENANT_KEY)
  }

  const currentTenant = stores.find((t) => t.id === current) || null

  return (
    <TenantContext.Provider value={{ stores, current, currentTenant, select, reload, loading, error }}>
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => useContext(TenantContext)
