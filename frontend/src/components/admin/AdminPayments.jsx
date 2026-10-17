import { useCallback, useEffect, useState } from 'react'
import { billingApi, formatPrice, paymentsApi, waLink, SUPPORT_WHATSAPP, SUBSCRIPTION_PRICE } from '../../api'
import { useAuth } from '../../store/AuthContext'
import { useTenant } from '../../store/TenantContext'
import { Alert, Card, Field, Spinner } from '../ui'
import BankDetails from './BankDetails'

const SUBSCRIPTION_DESC = 'Pago de suscripción'

const STATUS_LABELS = {
  active: 'Activo',
  past_due: 'Vencido',
  suspended: 'Suspendido',
  pending: 'En espera',
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

const supportLink = (message) => waLink(SUPPORT_WHATSAPP, message)

export default function AdminPayments() {
  const { user } = useAuth()
  const { loading } = useTenant()
  const isSuperuser = !!user?.is_superuser

  if (loading) return <Spinner />

  return (
    <div className="stack">
      <SubscriptionPanel />
      {isSuperuser && <PaymentsTable />}
      {isSuperuser && <BillingSettings />}
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
  const [billing, setBilling] = useState(null)

  useEffect(() => {
    billingApi
      .get()
      .then(setBilling)
      .catch(() => setBilling(null))
  }, [])

  if (!currentTenant) {
    return (
      <Card title="Mi plan">
        <p className="muted">No tienes una tienda seleccionada.</p>
      </Card>
    )
  }

  const tenant = currentTenant
  const sub = tenant.subscription

  // Cuenta recién registrada: el registro dejó el pago en espera y el dueño
  // avisa por WhatsApp para que la activen. Sin formulario de pago.
  if (!sub) {
    return (
      <Card title="Mi plan">
        <div className="kv">
          <span>Estado</span>
          <span><span className="chip status pending">En espera de activación</span></span>
        </div>
        <div className="notice warn">
          <p className="notice-text">
            Tu cuenta está en espera de activación. Mandanos un WhatsApp y la activamos de inmediato.
          </p>
          <div className="btn-group">
            <a
              className="btn small"
              href={supportLink('Hola LibreLabs, me gustaría activar mi cuenta.')}
              target="_blank"
              rel="noreferrer"
            >
              Me gustaría activar mi cuenta
            </a>
          </div>
        </div>
      </Card>
    )
  }

  const status = sub?.status
  const days = sub?.grace_days_remaining ?? 0
  const needsPayment = status !== 'active'

  let warning = ''
  if (status === 'past_due') {
    warning = `Tu plan finalizó. Tienes ${days} ${days === 1 ? 'día' : 'días'} para pagar la suscripción. Más información al WhatsApp.`
  } else if (status === 'suspended') {
    warning = `Tu plan venció y la tienda quedó suspendida. Pagá la suscripción para reactivarla. Más información al WhatsApp.`
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    if (!file) {
      setError('Adjuntá la foto del comprobante (obligatorio).')
      return
    }
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

        {needsPayment && <BankDetails billing={billing} />}

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
            <Field label="Foto del comprobante (Obligatorio)" hint="Transferencia o depósito (imagen).">
              <input type="file" accept="image/*" required onChange={(e) => setFile(e.target.files?.[0] || null)} />
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

/* ---------- Datos de pago (superusuario) ---------- */

function BillingSettings() {
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    billingApi
      .get()
      .then(setForm)
      .catch((err) => setError(err.message))
  }, [])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setOk('')
    try {
      const updated = await billingApi.update({
        bank: form.bank,
        account_type: form.account_type,
        account_number: form.account_number,
        holder: form.holder,
      })
      setForm(updated)
      setOk('Datos de pago guardados.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!form) {
    return (
      <Card title="Datos de pago (cuenta bancaria)">
        {error ? <Alert>{error}</Alert> : <Spinner />}
      </Card>
    )
  }

  return (
    <Card title="Datos de pago (cuenta bancaria)">
      <p className="muted">
        Es la cuenta que ven los dueños para depositar la suscripción. Se muestra en
        el paso de activación y en el panel de pagos.
      </p>
      <form className="form" onSubmit={save}>
        <Field label="Banco">
          <input value={form.bank} onChange={set('bank')} />
        </Field>
        <Field label="Tipo de cuenta">
          <input value={form.account_type} onChange={set('account_type')} />
        </Field>
        <Field label="Número de cuenta">
          <input value={form.account_number} onChange={set('account_number')} />
        </Field>
        <Field label="Titular">
          <input value={form.holder} onChange={set('holder')} />
        </Field>
        {error && <Alert>{error}</Alert>}
        {ok && <Alert kind="ok">{ok}</Alert>}
        <div className="btn-group">
          <button className="btn" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Card>
  )
}
