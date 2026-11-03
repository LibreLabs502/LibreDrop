import { useEffect } from 'react'
import { LATEST_UPDATE, UPDATES, VERSIONS_URL } from '../../updates'

export default function WhatsNew({ open, onClose, showAll = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !LATEST_UPDATE) return null

  // Al abrirse solo (actualización sin ver) mostramos únicamente la última.
  // El historial completo aparece cuando se entra desde “Novedades” o
  // “Ver Novedades”.
  const entries = showAll ? UPDATES : [LATEST_UPDATE]

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
          <span className="updates-badge">
            {showAll ? 'Novedades' : `Novedades · ${LATEST_UPDATE.version}`}
          </span>
          <h2 id="updates-title">
            {showAll ? 'Novedades en tu panel' : LATEST_UPDATE.title}
          </h2>
          <p className="muted">
            {showAll ? 'Estos son los últimos cambios de LibreDrop.' : LATEST_UPDATE.date}
          </p>

          <div className="updates-versions">
            {entries.map((update) => (
              <section className="updates-entry" key={update.version}>
                {showAll && (
                  <div className="updates-entry-head">
                    <span className="updates-version">{update.version}</span>
                    <span className="updates-date">{update.date}</span>
                  </div>
                )}
                {showAll && <h3>{update.title}</h3>}
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
