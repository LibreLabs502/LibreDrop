import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { TenantProvider, useTenant } from '../store/TenantContext'
import AdminAuth from '../components/admin/AdminAuth'
import { CatalogIcon, StoresIcon } from '../components/AdminIcons'

const LINKS = [
  { to: '/admin', end: true, label: 'Tiendas', Icon: StoresIcon },
  { to: '/admin/catalogo', label: 'Catálogo', Icon: CatalogIcon },
]

function TenantSwitcher() {
  const { stores, current, select } = useTenant()
  if (stores.length === 0) return null
  return (
    <select
      className="tenant-switcher"
      value={current ?? ''}
      onChange={(e) => select(Number(e.target.value))}
    >
      {stores.map((t) => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </select>
  )
}

function Shell() {
  const { user, logout } = useAuth()
  const { currentTenant } = useTenant()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <div className="admin">
      <header className="admin-topbar">
        <button className="hamburger" onClick={() => setOpen((v) => !v)} aria-label="Menú">
          ☰
        </button>
        <img className="topbar-logo" src="/images/favicon.png" alt="LibreDrop" />
        <TenantSwitcher />
      </header>

      {open && <div className="admin-overlay" onClick={close} />}

      <aside className={`admin-side ${open ? 'open' : ''}`}>
        <div className="admin-brand">
          <img className="admin-logo" src="/images/libredrop.jpg" alt="LibreDrop" />
          <span className="muted">Panel de tiendas</span>
        </div>
        <nav className="admin-nav">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={close}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <l.Icon />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-side-foot">
          <TenantSwitcher />
          {currentTenant && <div className="chip">{currentTenant.name}</div>}
          <button className="btn ghost small block" onClick={logout}>Cerrar sesión ({user.username})</button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}

export default function AdminApp() {
  const { user, loading } = useAuth()

  if (loading) return <div className="page-load">Cargando sesión…</div>
  if (!user) return <AdminAuth />

  return (
    <TenantProvider>
      <Shell />
    </TenantProvider>
  )
}
