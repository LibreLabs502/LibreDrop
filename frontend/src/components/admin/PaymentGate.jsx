import { useEffect, useState } from 'react'
import { billingApi, formatPrice, paymentsApi, waLink, SUPPORT_WHATSAPP, SUBSCRIPTION_PRICE } from '../../api'
import { useAuth } from '../../store/AuthContext'
import { useTenant } from '../../store/TenantContext'
import { Alert, Card, Field } from '../ui'
import BankDetails from './BankDetails'
import SubscriptionPaymentTransition, { waitForSubscriptionTransition } from './SubscriptionPaymentTransition'
import { hasAdminSubscriptionAccess } from '../../subscriptionAccess'

const SUBSCRIPTION_DESC = 'Pago de suscripción'

/**
 * Pantalla que ve el dueño mientras su tienda no tiene plan activo:
 * no puede entrar al panel hasta que el superusuario active su pago.
 */
export default function PaymentGate() {
  const { user, logout, showWelcomeTransition } = useAuth()
  const { currentTenant, reload } = useTenant()
  const [description, setDescription] = useState(SUBSCRIPTION_DESC)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [billing, setBilling] = useState(null)
  const [checking, setChecking] = useState(false)
  const [checkMessage, setCheckMessage] = useState('')
  const [showPaymentTransition, setShowPaymentTransition] = useState(false)

  useEffect(() => {
    billingApi
      .get()
      .then(setBilling)
      .catch(() => setBilling(null))
  }, [])

  if (!currentTenant) return null

  const tenant = currentTenant

  const checkActivation = async () => {
    setChecking(true)
    setCheckMessage('')
    const stores = await reload()
    setChecking(false)
    if (!stores) {
      setCheckMessage('No pudimos comprobar la activación. Inténtalo de nuevo.')
      return
    }

    const updatedTenant = stores.find((store) => store.id === tenant.id)
    if (hasAdminSubscriptionAccess(updatedTenant?.subscription, !!user?.is_superuser)) {
      showWelcomeTransition()
      return
    }
    setCheckMessage('Tu pago aún está en revisión. Vuelve a comprobarlo en un momento.')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!file) {
      setError('Adjuntá la foto del comprobante (obligatorio).')
      return
    }
    setBusy(true)
    // Abrimos la pestaña desde el gesto del usuario para que el navegador no
    // bloquee WhatsApp después de esperar la respuesta del servidor.
    const whatsappTab = window.open('about:blank', '_blank')
    try {
      setShowPaymentTransition(true)
      await waitForSubscriptionTransition()
      setShowPaymentTransition(false)
      // POST del pago con comprobante.
      await paymentsApi.create(tenant.id, { description }, file)
      setSent(true)
      if (whatsappTab) {
        whatsappTab.location.href = waLink(
          SUPPORT_WHATSAPP,
          `Hola LibreLabs, soy ${tenant.name}. Me gustaría activar mi cuenta.`,
        )
      }
    } catch (err) {
      setShowPaymentTransition(false)
      whatsappTab?.close()
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-gate">
      {showPaymentTransition && <SubscriptionPaymentTransition />}
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
              <button className="btn small" disabled={checking} onClick={checkActivation}>
                {checking ? 'Comprobando…' : '¿Ya me activaron? Comprobar'}
              </button>
            </div>
            {checkMessage && <p className="muted" role="status">{checkMessage}</p>}
          </Card>
        ) : (
          <Card title="Activa tu cuenta">
            <p>
              Para usar tu panel pagá la suscripción de <b>{formatPrice(SUBSCRIPTION_PRICE)}</b>{' '}
              (30 días) por transferencia o depósito a esta cuenta:
            </p>
            {billing ? (
              <BankDetails billing={billing} />
            ) : (
              <p className="muted">Pedí los datos de la cuenta por WhatsApp (botón abajo).</p>
            )}
            <p className="muted">Después adjuntá la foto del comprobante acá abajo.</p>
            <form className="form payment-form" onSubmit={submit}>
              <Field label="Nombre de la empresa">
                <input value={tenant.name} readOnly />
              </Field>
              <Field label="Descripción del pago">
                <input value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
              <Field label="Foto del comprobante (Obligatorio)" hint="Transferencia o depósito (imagen).">
                <input type="file" accept="image/*" required onChange={(e) => setFile(e.target.files?.[0] || null)} />
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
