import { useState } from 'react'
import { formatPrice, paymentsApi, waLink, SUPPORT_WHATSAPP } from '../../api'
import { useAuth } from '../../store/AuthContext'
import { useTenant } from '../../store/TenantContext'
import { Alert, Card, Field } from '../ui'

const SUBSCRIPTION_PRICE = 100
const SUBSCRIPTION_DESC = 'Pago de suscripción'
// Cuenta a la que se paga por transferencia/depósito. Reemplazar por los datos reales.
const PAYMENT_ACCOUNT = 'la cuenta inicial de LibreLabs'

/**
 * Pantalla que ve el dueño mientras su tienda no tiene plan activo:
 * no puede entrar al panel hasta que el superusuario active su pago.
 */
export default function PaymentGate() {
  const { user, logout } = useAuth()
  const { currentTenant, reload } = useTenant()
  const [description, setDescription] = useState(SUBSCRIPTION_DESC)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  if (!currentTenant) return null

  const tenant = currentTenant

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      // POST del pago con comprobante.
      await paymentsApi.create(tenant.id, { description }, file)
      setSent(true)
      // Después del POST, se abre el WhatsApp para avisar la activación.
      window.open(
        waLink(SUPPORT_WHATSAPP, `Hola LibreLabs, soy ${tenant.name}. Me gustaría activar mi cuenta.`),
        '_blank',
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-gate">
      <header className="admin-topbar gate-topbar">
        <span className="chip">{tenant.name}</span>
        <button className="btn ghost small" onClick={logout}>
          Cerrar sesión ({user?.username})
        </button>
      </header>

      <div className="stack">
        {sent ? (
          <Card title="Pago en espera">
            <div className="alert ok">¡Comprobante enviado!</div>
            <p>
              Tu pago quedó <b>en espera de activación</b>. En cuanto esté activo vas a poder
              entrar a tu panel — te escribimos por WhatsApp apenas lo activemos.
            </p>
            <div className="btn-group">
              <a
                className="btn small ghost"
                href={waLink(SUPPORT_WHATSAPP, `Hola LibreLabs, soy ${tenant.name}. ¿Ya activaron mi cuenta?`)}
                target="_blank"
                rel="noreferrer"
              >
                Consultar por WhatsApp
              </a>
              <button className="btn small" onClick={() => reload()}>
                ¿Ya me activaron? Comprobar
              </button>
            </div>
          </Card>
        ) : (
          <Card title="Activa tu cuenta">
            <p>
              Para usar tu panel pagá la suscripción de <b>{formatPrice(SUBSCRIPTION_PRICE)}</b>{' '}
              (30 días) por transferencia o depósito a <b>{PAYMENT_ACCOUNT}</b> y mandanos el
              comprobante.
            </p>
            <form className="form payment-form" onSubmit={submit}>
              <Field label="Nombre de la empresa">
                <input value={tenant.name} readOnly />
              </Field>
              <Field label="Descripción del pago">
                <input value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
              <Field label="Foto del comprobante" hint="Transferencia o depósito (imagen).">
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Field>
              {error && <Alert>{error}</Alert>}
              <div className="btn-group">
                <button className="btn" disabled={busy}>
                  {busy ? 'Enviando…' : `Pagar ${formatPrice(SUBSCRIPTION_PRICE)} y activar mi cuenta`}
                </button>
                <a
                  className="btn ghost"
                  href={waLink(SUPPORT_WHATSAPP, 'Hola, necesito información de los pagos.')}
                  target="_blank"
                  rel="noreferrer"
                >
                  Más información por WhatsApp
                </a>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  )
}