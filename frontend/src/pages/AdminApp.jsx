import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import AdminAuth from '../components/admin/AdminAuth'
import { CatalogIcon, MembersIcon, StoresIcon } from '../components/AdminIcons'

const LINKS = [
  { to: '/admin', end: true, label: 'Tiendas', Icon: StoresIcon },
  { to: '/admin/miembros', label: 'Miembros', Icon: MembersIcon },
  { to: '/admin/catalogo', label: 'Catálogo', Icon: CatalogIcon },
]

function Shell() {
  const { user, logout } = useAuth()

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

  return <Shell />
}
