import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { AdminProvider, useAdmin } from '../store/AdminContext'
import AdminAuth from '../components/admin/AdminAuth'
import { CatalogIcon, DomainIcon, MembersIcon, StoreIcon, StoresIcon } from '../components/AdminIcons'

const LINKS = [
  { to: '/admin', end: true, label: 'Mi tienda', Icon: StoreIcon },
  { to: '/admin/catalogo', label: 'Catálogo', Icon: CatalogIcon },
  { to: '/admin/dominios', label: 'Dominios', Icon: DomainIcon },
  { to: '/admin/miembros', label: 'Miembros', Icon: MembersIcon },
  { to: '/admin/tiendas', label: 'Tiendas', Icon: StoresIcon },
]

function TenantBanner() {
  const { stores } = useAdmin()

  if (stores.length === 0) {
    return (
      <div className="notice">
        Aún no tienes tiendas. Créala desde <NavLink to="/admin/tiendas">Tiendas</NavLink> o en el primer
        registro la tuya se crea automáticamente.
      </div>
    )
  }

  return (
    <div className="notice">
      Estás administrando el esquema <b>público</b> (localhost). Para gestionar el catálogo, dominios y
      miembros de una tienda, abre este panel desde el dominio de la tienda:
      <div className="chips">
        {stores.map((t) =>
          (t.domains || []).map((d) => (
            <span className="chip" key={d.domain}>{d.domain}</span>
          )),
        )}
      </div>
    </div>
  )
}

function Shell() {
  const { user, logout } = useAuth()
  const { activeTenant, error } = useAdmin()

  return (
    <div className="admin">
      <aside className="admin-side">
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
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <l.Icon />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-side-foot">
          {activeTenant ? (
            <div className="chip">{activeTenant.name}</div>
          ) : (
            <div className="chip">Esquema público</div>
          )}
          <button className="btn ghost small block" onClick={logout}>Cerrar sesión ({user.username})</button>
        </div>
      </aside>

      <main className="admin-main">
        {!activeTenant && <TenantBanner />}
        {error && <div className="alert">{error}</div>}
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
    <AdminProvider>
      <Shell />
    </AdminProvider>
  )
}