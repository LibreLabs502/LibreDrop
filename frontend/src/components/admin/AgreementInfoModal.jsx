import { useEffect, useState } from 'react'
import { useAuth } from '../../store/AuthContext'
import { AgreementCopy, AGREEMENT_VERSION } from './AgreementGate'

export default function AgreementInfoModal({ open, required = false, onClose }) {
  const { user, acceptAgreement, logout } = useAuth()
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !required) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, required, onClose])

  const accept = async (event) => {
    event.preventDefault()
    if (!checked || busy) return
    setBusy(true)
    setError('')
    try {
      await acceptAgreement(AGREEMENT_VERSION)
    } catch (err) {
      setError(err.message || 'No se pudo guardar tu aceptación. Intentá de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={() => { if (!required) onClose() }}>
      <section
        className="modal agreement-info-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agreement-info-title"
        onClick={(event) => event.stopPropagation()}
      >
        {!required && <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>}
        <div className="updates-body">
          <span className="updates-badge">{required ? 'ACCIÓN REQUERIDA' : 'LibreDrop · Información'}</span>
          <h2 id="agreement-info-title">{required ? 'Revisá y aceptá el acuerdo para continuar' : 'Acuerdo, privacidad y lo que ofrecemos'}</h2>
          <p className="muted">{required ? `Hola${user?.first_name ? `, ${user.first_name}` : ''}. Leé el acuerdo vigente y aceptalo para usar el panel.` : 'Consultá cómo funciona el servicio y cómo tratamos la información de tu cuenta, tienda y pedidos.'}</p>
          <div className="agreement-info-copy">
            <div className="agreement-privacy-callout">
              <span aria-hidden="true">◇</span>
              <p><b>Protegemos tus datos.</b> Usamos controles de acceso y los tratamos para operar LibreDrop, brindar soporte y administrar tu suscripción.</p>
            </div>
            <AgreementCopy />
          </div>
          {required ? (
            <form className="agreement-info-acceptance" onSubmit={accept}>
              <label className="agreement-check">
                <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
                <span>Leí y acepto el acuerdo de uso y tratamiento de datos de LibreDrop.</span>
              </label>
              {error && <p className="agreement-error" role="alert">{error}</p>}
              <div className="agreement-buttons">
                <button type="button" className="btn ghost" onClick={logout}>Cerrar sesión</button>
                <button type="submit" className="btn" disabled={!checked || busy}>{busy ? 'Guardando…' : 'Aceptar y continuar'}</button>
              </div>
            </form>
          ) : (
            <div className="updates-actions agreement-info-actions">
              <button type="button" className="btn block" onClick={onClose}>Cerrar</button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
