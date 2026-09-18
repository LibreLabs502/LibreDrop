import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { goToTenantAdmin, storeApi, tenantsApi } from '../api'
import { useAuth } from '../store/AuthContext'
import AdminAuth from '../components/admin/AdminAuth'
import Storefront from './Storefront'

export default function IndexPage() {
  const { user, loading } = useAuth()
  const [store, setStore] = useState(null)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    let alive = true
    storeApi
      .info()
      .then((info) => alive && setStore(info))
      .catch(() => alive && setStore(false))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (redirecting || !user || store) return
    let alive = true
    tenantsApi
      .list()
      .then((stores) => {
        if (!alive) return
        const domain = stores
          .map((s) => (s.domains || []).find((d) => d.is_primary)?.domain)
          .find(Boolean)
        if (domain && goToTenantAdmin(domain)) {
          setRedirecting(true)
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [user, store, redirecting])

  if (loading || store === null) {
    return <div className="page-load">Cargando…</div>
  }

  if (store) {
    return <Storefront />
  }

  if (!user) {
    return <AdminAuth />
  }

  if (redirecting) {
    return <div className="page-load">Redirigiendo a tu tienda…</div>
  }

  return <Navigate to="/admin" replace />
}