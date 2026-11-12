import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { TenantProvider, useTenant } from '../store/TenantContext'
import AdminAuth from '../components/admin/AdminAuth'
import EntryWelcome from '../components/admin/EntryWelcome'
import PaymentGate from '../components/admin/PaymentGate'
import AgreementGate, { AGREEMENT_VERSION } from '../components/admin/AgreementGate'
import WhatsNew from '../components/admin/WhatsNew'
import AgreementInfoModal from '../components/admin/AgreementInfoModal'
import { CatalogIcon, OrdersIcon, PaletteIcon, PaymentIcon, StoresIcon } from '../components/AdminIcons'
import { hasSeenLatestUpdate, markLatestUpdateSeen } from '../updates'
import { hasAdminSubscriptionAccess } from '../subscriptionAccess'

const LINKS = [
  { to: '/admin', end: true, label: 'Tiendas', Icon: StoresIcon },
  { to: '/admin/catalogo', label: 'Catálogo', Icon: CatalogIcon },
  { to: '/admin/pedidos', label: 'Pedidos', Icon: OrdersIcon },
  { to: '/admin/apariencia', label: 'Apariencia', Icon: PaletteIcon },
  { to: '/admin/pagos', label: 'Pagos', Icon: PaymentIcon },
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
  const [updatesOpen, setUpdatesOpen] = useState(false)
  const [agreementInfoOpen, setAgreementInfoOpen] = useState(false)
  const [showAllUpdates, setShowAllUpdates] = useState(false)
  const [hasNews, setHasNews] = useState(() => !hasSeenLatestUpdate(user))

  const close = () => setOpen(false)

  const openUpdates = (showAll = true) => {
    setShowAllUpdates(showAll)
    setUpdatesOpen(true)
  }

  const userId = user?.id ?? user?.username
  useEffect(() => {
    const unseen = !hasSeenLatestUpdate(user)
    setHasNews(unseen)
    if (unseen) {
      // Al entrar solo mostramos la última actualización; el historial completo
      // se ve cuando el usuario toca “Novedades” o “Ver Novedades”.
      setShowAllUpdates(false)
      setUpdatesOpen(true)
    }
  }, [userId])

  const closeUpdates = () => {
    markLatestUpdateSeen(user)
    setHasNews(false)
    setUpdatesOpen(false)
  }

  // Pagos aparece solo cuando la tienda ya tiene plan; el superusuario lo ve
  // siempre porque gestiona los pagos en espera de todas las tiendas.
  const showPayments = !!user?.is_superuser || !!currentTenant?.subscription

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
          <img className="admin-logo" src="/images/libredrop.webp" alt="LibreDrop" />
          <span className="muted">Panel de tiendas</span>
        </div>
        <nav className="admin-nav">
          {LINKS.filter((l) => l.to !== '/admin/pagos' || showPayments).map((l) => (
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
          <button className="btn ghost small block updates-btn" onClick={() => openUpdates(true)}>
            Novedades
            {hasNews && <span className="updates-tag">Nuevo</span>}
          </button>
          <button className="btn ghost small block updates-btn" onClick={() => setAgreementInfoOpen(true)}>
            Ver acuerdo y privacidad
          </button>
          <button className="btn ghost small block" onClick={logout}>Cerrar sesión ({user.username})</button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet context={{ openUpdates: () => openUpdates(true), hasNews }} />
      </main>

      <WhatsNew open={updatesOpen} showAll={showAllUpdates} onClose={closeUpdates} />
      <AgreementInfoModal open={agreementInfoOpen} onClose={() => setAgreementInfoOpen(false)} />
    </div>
  )
}

export default function AdminApp() {
  const { user, loading } = useAuth()

  if (loading) return <div className="page-load">Cargando sesión…</div>
  if (!user) return <AdminAuth />

  return (
    <TenantProvider>
      <GateOrShell />
    </TenantProvider>
  )
}

function GateOrShell() {
  const { user, entryTransition, finishEntryTransition } = useAuth()
  const { currentTenant, loading } = useTenant()

  if (entryTransition) {
    return (
      <EntryWelcome
        user={user}
        type={entryTransition}
        ready={!loading}
        onComplete={finishEntryTransition}
      />
    )
  }

  if (loading) return <div className="page-load">Cargando tiendas…</div>

  const agreementVersion = user?.agreement_required_version || AGREEMENT_VERSION
  if (currentTenant && !user?.is_superuser && user?.agreement_version !== agreementVersion) {
    return <AgreementGate />
  }

  // Sin suscripción o después de terminar los diez días de gracia, el dueño
  // solo ve el flujo de pago. Durante `past_due` conserva el panel.
  const blocked = currentTenant && !hasAdminSubscriptionAccess(
    currentTenant.subscription,
    !!user?.is_superuser,
  )
  if (blocked) return <PaymentGate />

  return <Shell />
}
