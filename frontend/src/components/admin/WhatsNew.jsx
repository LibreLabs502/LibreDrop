import { useEffect } from 'react'
import { LATEST_UPDATE, VERSIONS_URL } from '../../updates'

export default function WhatsNew({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !LATEST_UPDATE) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal updates-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="updates-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <div className="updates-body">
          <span className="updates-badge">Novedades · {LATEST_UPDATE.version}</span>
          <h2 id="updates-title">{LATEST_UPDATE.title}</h2>
          <p className="muted">{LATEST_UPDATE.date}</p>
          <ul className="updates-list">
            {LATEST_UPDATE.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="updates-actions">
            <a className="btn ghost block" href={VERSIONS_URL} target="_blank" rel="noreferrer">
              Más información en GitHub
            </a>
            <button type="button" className="btn block" onClick={onClose}>
              Entendido, seguir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
