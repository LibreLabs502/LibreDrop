export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function Row({ children }) {
  return <div className="row">{children}</div>
}

export function Alert({ kind, children }) {
  if (!children) return null
  return <div className={`alert ${kind || ''}`}>{children}</div>
}

export function Card({ title, actions, children }) {
  return (
    <section className="card">
      {(title || actions) && (
        <div className="card-head">
          {title && <h3>{title}</h3>}
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </section>
  )
}

export function Spinner() {
  return <div className="spinner">Cargando…</div>
}