import { useCallback, useEffect, useState } from 'react'
import { formatPrice, ordersApi } from '../../api'
import { useTenant } from '../../store/TenantContext'
import { Alert, Card, Spinner } from '../ui'

const ORDER_STATUSES = [
  ['new', 'Nuevo'],
  ['confirmed', 'Confirmado'],
  ['completed', 'Completado'],
  ['cancelled', 'Cancelado'],
]
const STATUS_LABELS = Object.fromEntries(ORDER_STATUSES)
const CHANNEL_LABELS = { whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok' }
const dateLabel = (value) => new Date(value).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })

export default function AdminOrders() {
  const { current, currentTenant, loading: tenantLoading } = useTenant()
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [busyOrder, setBusyOrder] = useState(null)
  const [expandedOrder, setExpandedOrder] = useState(null)

  const load = useCallback(() => {
    if (!current) return
    setOrders(null)
    ordersApi.list(current).then(setOrders).catch((err) => setError(err.message))
  }, [current])

  useEffect(load, [load])

  const changeStatus = async (order, status) => {
    setBusyOrder(order.id)
    setError('')
    try {
      const updated = await ordersApi.updateStatus(current, order.id, status)
      setOrders((items) => items.map((item) => item.id === updated.id ? updated : item))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyOrder(null)
    }
  }

  if (tenantLoading) return <Spinner />
  if (!currentTenant) return <Card title="Pedidos"><p className="muted">Seleccioná una tienda para ver sus pedidos.</p></Card>
  if (orders === null && !error) return <Spinner />

  const visibleOrders = (orders || []).filter((order) => statusFilter === 'all' || order.status === statusFilter)

  return (
    <div className="stack admin-orders-page">
      <Card title="Pedidos">
        <p className="admin-orders-subtitle">Pedidos recibidos por {currentTenant.name}</p>
        <div className="admin-orders-toolbar">
          <label htmlFor="orders-status-filter">Mostrar</label>
          <select id="orders-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Todos ({orders?.length || 0})</option>
            {ORDER_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button type="button" className="btn ghost small" onClick={load}>Actualizar</button>
        </div>
        {error && <Alert kind="error">{error}</Alert>}
        {visibleOrders.length === 0 ? (
          <div className="admin-orders-empty">
            <span aria-hidden="true">▤</span>
            <h3>{orders?.length ? 'No hay pedidos con este estado' : 'Todavía no hay pedidos'}</h3>
            <p>Cuando un cliente complete su pedido desde la tienda, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="admin-order-list">
            {visibleOrders.map((order) => (
              <article className={`admin-order-card${expandedOrder === order.id ? ' expanded' : ''}`} key={order.id}>
                <header className="admin-order-header">
                  <div>
                    <span className="admin-order-code">Pedido #{String(order.public_id).slice(0, 8)}</span>
                    <span className="admin-order-date">{dateLabel(order.created_at)}</span>
                  </div>
                  <div className="admin-order-summary-actions">
                    <span className={`admin-order-status ${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
                    <button
                      type="button"
                      className="admin-order-expand"
                      aria-label={`${expandedOrder === order.id ? 'Ocultar' : 'Ver'} detalles del pedido ${String(order.public_id).slice(0, 8)}`}
                      aria-expanded={expandedOrder === order.id}
                      aria-controls={`order-details-${order.id}`}
                      onClick={() => setExpandedOrder((current) => current === order.id ? null : order.id)}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m7 9 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                </header>
                {expandedOrder === order.id && (
                  <div className="admin-order-details" id={`order-details-${order.id}`}>
                    <div className="admin-order-detail-toolbar">
                      <span>Detalles del pedido</span>
                      <select aria-label={`Estado del pedido ${order.public_id}`} value={order.status} disabled={busyOrder === order.id} onChange={(event) => changeStatus(order, event.target.value)}>
                        {ORDER_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </div>
                    <div className="admin-order-customer">
                      <strong>{order.customer.full_name}</strong>
                      <span>{order.customer.phone_number} · {CHANNEL_LABELS[order.channel] || order.channel}</span>
                      <span>{order.customer.address}</span>
                      {order.customer.email && <span>{order.customer.email}</span>}
                    </div>
                    <ul className="admin-order-items">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          <span>{item.quantity} × {item.product_name}</span>
                          <span>{item.line_total === null ? 'Precio a confirmar' : formatPrice(item.line_total)}</span>
                        </li>
                      ))}
                    </ul>
                    <footer className="admin-order-footer">
                      {order.notes && <p><b>Notas:</b> {order.notes}</p>}
                      <strong>{order.total === null ? 'Total a confirmar' : `Total ${formatPrice(order.total)}`}</strong>
                    </footer>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
