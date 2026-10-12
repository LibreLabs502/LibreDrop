import { useCallback, useEffect, useState } from 'react'
import { formatPrice, paymentsApi, waLink } from '../../api'
import { useAuth } from '../../store/AuthContext'
import { useTenant } from '../../store/TenantContext'
import { Alert, Card, Field, Spinner } from '../ui'

// Teléfono temporal de soporte (el de LibreLabs está roto por ahora).
const WHATSAPP_SUPPORT = '+50239085258'
const SUBSCRIPTION_PRICE = 100
const SUBSCRIPTION_DESC = 'Pago de suscripción'
// Cuenta a la que se paga por transferencia/depósito. Reemplazar por los datos reales.
const PAYMENT_ACCOUNT = 'la cuenta inicial de LibreLabs'

const STATUS_LABELS = {
  active: 'Activo',
  past_due: 'Vencido',
  suspended: 'Suspendido',
  pending: 'Pendiente',
  approved: 'Pagado',
  rejected: 'Rechazado',
}
const statusLabel = (s) => STATUS_LABELS[s] || s || '—'

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
}

const supportLink = (message) => waLink(WHATSAPP_SUPPORT, message)

export default function AdminPayments() {
  const { user } = useAuth()
  const { loading } = useTenant()
  const isSuperuser = !!user?.is_superuser

  if (loading) return <Spinner />

  return (
    <div className="stack">
      <SubscriptionPanel />
      {isSuperuser && <PaymentsTable />}
    </div>
  )
}

/* ---------- Mi plan (dueño de la tienda) ---------- */

function SubscriptionPanel() {
  const { currentTenant } = useTenant()
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState(SUBSCRIPTION_DESC)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [sent, setSent] = useState(null)

  if (!currentTenant) {
    return (
      <Card title="Mi plan">
        <p className="muted">No tienes una tienda seleccionada.</p>
      </Card>
    )
  }

  const tenant = currentTenant
  const sub = tenant.subscription
  const status = sub?.status
  const days = sub?.grace_days_remaining ?? 0
  const needsPayment = !sub || status !== 'active'

  let warning = ''
  if (!sub) {
    warning = `Tu tienda todavía no tiene un plan activo. Paga por transferencia o depósito a ${PAYMENT_ACCOUNT}. Más información al WhatsApp.`
  } else if (status === 'past_due') {
    warning = `Tu plan finalizó. Tienes ${days} ${days === 1 ? 'día' : 'días'} para pagar por transferencia o depósito a ${PAYMENT_ACCOUNT}. Más información al WhatsApp.`
  } else if (status === 'suspended') {
    warning = `Tu plan venció y la tienda quedó suspendida. Paga por transferencia o depósito a ${PAYMENT_ACCOUNT} para reactivarla. Más información al WhatsApp.`
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    setBusy(true)
    try {
      const payment = await paymentsApi.create(tenant.id, { description }, file)
      setSent(payment)
      setOk('Comprobante enviado. Te escribiremos para activar tu cuenta.')
      setOpen(false)
      window.open(
        supportLink(`Hola LibreLabs, soy ${tenant.name}. Me gustaría que me reactivaran mi cuenta.`),
        '_blank',
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card title="Mi plan">
        {sub ? (
          <div className="kv">
            <span>Estado</span>
            <span><span className={`chip status ${status}`}>{statusLabel(status)}</span></span>
            <span>Vence</span>
            <span>{formatDate(sub.current_period_end)}</span>
            {status !== 'active' && (
              <>
                <span>Días de gracia</span>
                <span>{days}</span>
              </>
            )}
          </div>
        ) : (
          <div className="kv">
            <span>Estado</span>
            <span><span className="chip status pending">Sin plan</span></span>
          </div>
        )}

        {warning && (
          <div className="notice warn">
            <p className="notice-text">{warning}</p>
            <div className="btn-group">
              <a
                className="btn small ghost"
                href={supportLink('Hola, necesito información de los pagos.')}
                target="_blank"
                rel="noreferrer"
              >
                Más información por WhatsApp
              </a>
              {needsPayment && !open && !sent && (
                <button className="btn small" onClick={() => setOpen(true)}>Hacer pago</button>
              )}
            </div>
          </div>
        )}

        {ok && <Alert kind="ok">{ok}</Alert>}
        {error && <Alert>{error}</Alert>}

        {open && (
          <form className="form payment-form" onSubmit={submit}>
            <Field label="Nombre de la tienda">
              <input value={tenant.name} readOnly />
            </Field>
            <Field label="Descripción del pago">
              <input value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <Field label="Foto del comprobante" hint="Transferencia o depósito (imagen).">
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Field>
            <div className="btn-group">
              <button className="btn" disabled={busy}>{busy ? 'Enviando…' : 'Enviar'}</button>
              <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Cancelar</button>
            </div>
          </form>
        )}

        {sent && (
          <div className="btn-group receipt-actions">
            <button className="btn" onClick={() => window.print()}>Generar recibo</button>
          </div>
        )}
      </Card>

      {sent && <Receipt payment={sent} tenantName={tenant.name} />}
    </>
  )
}

function Receipt({ payment, tenantName }) {
  return (
    <section className="card receipt-print">
      <div className="card-body">
        <h3 className="receipt-title">Recibo de pago</h3>
        <p className="muted">LibreDrop · Suscripción</p>
        <table className="table receipt-table">
          <tbody>
            <tr><th>Nombre de la tienda</th><td>{tenantName}</td></tr>
            <tr><th>Descripción del pago</th><td>{payment.description || SUBSCRIPTION_DESC}</td></tr>
            <tr><th>Precio</th><td>{formatPrice(SUBSCRIPTION_PRICE)}</td></tr>
            <tr><th>Fecha</th><td>{formatDate(payment.created_at)}</td></tr>
            <tr><th>Estado</th><td>{statusLabel(payment.status)}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ---------- Pagos recibidos (superusuario) ---------- */

function PaymentsTable() {
  const { reload } = useTenant()
  const [payments, setPayments] = useState(null)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setPayments(await paymentsApi.list())
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const activate = async (payment) => {
    if (!window.confirm(`¿Activar la suscripción de "${payment.tenant_name}"?`)) return
    setBusy(true)
    setError('')
    setOk('')
    try {
      const updated = await paymentsApi.activate(payment.id)
      setSelected(updated)
      setOk(`Suscripción de "${updated.tenant_name}" activada por 30 días.`)
      await load()
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (payments === null) return <Spinner />

  return (
    <Card title={`Pagos recibidos (${payments.length})`}>
      <Alert kind="ok">{ok}</Alert>
      <Alert>{error}</Alert>

      {payments.length === 0 ? (
        <p className="muted">Todavía no hay pagos.</p>
      ) : (
        <table className="table clickable">
          <thead>
            <tr>
              <th>Nombre de la tienda</th>
              <th>Descripción</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr
                key={p.id}
                className={selected?.id === p.id ? 'selected' : ''}
                onClick={() => setSelected(p)}
              >
                <td><b>{p.tenant_name}</b></td>
                <td>{p.description || '—'}</td>
                <td>{formatDate(p.created_at)}</td>
                <td><span className={`chip status ${p.status}`}>{statusLabel(p.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div className="payment-detail">
          <h4>{selected.tenant_name}</h4>
          <div className="kv">
            <span>Descripción</span>
            <span>{selected.description || '—'}</span>
            <span>Estado</span>
            <span>{statusLabel(selected.status)}</span>
            <span>Fecha</span>
            <span>{formatDate(selected.created_at)}</span>
          </div>

          {selected.image ? (
            <a href={selected.image} target="_blank" rel="noreferrer">
              <img className="payment-receipt" src={selected.image} alt="Comprobante" />
            </a>
          ) : (
            <p className="muted">Sin comprobante adjunto.</p>
          )}

          <div className="btn-group receipt-actions">
            <button className="btn" disabled={busy} onClick={() => activate(selected)}>
              Activar {selected.tenant_name}
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
