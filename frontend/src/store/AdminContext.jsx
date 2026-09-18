import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { currentHost, hostOfDomain, tenantsApi } from '../api'

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const [stores, setStores] = useState([])
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      setStores(await tenantsApi.list())
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const activeTenant = stores.find((t) =>
    (t.domains || []).some((d) => hostOfDomain(d.domain) === currentHost()),
  )

  return (
    <AdminContext.Provider value={{ stores, reload, activeTenant, error }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)