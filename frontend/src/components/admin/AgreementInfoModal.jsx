import { useEffect } from 'react'
import { AgreementCopy } from './AgreementGate'

export default function AgreementInfoModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal agreement-info-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agreement-info-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        <div className="updates-body">
          <span className="updates-badge">LibreDrop · Información</span>
          <h2 id="agreement-info-title">Acuerdo, privacidad y lo que ofrecemos</h2>
          <p className="muted">Consultá cómo funciona el servicio y cómo tratamos la información de tu cuenta, tienda y pedidos.</p>
          <div className="agreement-info-copy">
            <div className="agreement-privacy-callout">
              <span aria-hidden="true">◇</span>
              <p><b>Protegemos tus datos.</b> Usamos controles de acceso y los tratamos para operar LibreDrop, brindar soporte y administrar tu suscripción.</p>
            </div>
            <AgreementCopy />
          </div>
          <div className="updates-actions agreement-info-actions">
            <button type="button" className="btn block" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </section>
    </div>
  )
}
