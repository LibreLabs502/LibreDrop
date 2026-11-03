import { useEffect } from 'react'
import { UPDATES, VERSIONS_URL } from '../../updates'

export default function WhatsNew({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || UPDATES.length === 0) return null

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
          <span className="updates-badge">Novedades</span>
          <h2 id="updates-title">Novedades en tu panel</h2>
          <p className="muted">Estos son los últimos cambios de LibreDrop.</p>

          <div className="updates-versions">
            {UPDATES.map((update) => (
              <section className="updates-entry" key={update.version}>
                <div className="updates-entry-head">
                  <span className="updates-version">{update.version}</span>
                  <span className="updates-date">{update.date}</span>
                </div>
                <h3>{update.title}</h3>
                <ul className="updates-list">
                  {update.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

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
