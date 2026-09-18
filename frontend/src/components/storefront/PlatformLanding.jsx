import { Link } from 'react-router-dom'

export default function PlatformLanding() {
  return (
    <div className="landing">
      <div className="landing-logo">LibreDrop</div>
      <h1>Tiendas online simples, sin comisiones.</h1>
      <p>
        Este dominio no tiene una tienda publicada. Si eres el dueño de una tienda, entra al panel
        de administración para gestionar tu catálogo.
      </p>
      <div className="landing-actions">
        <Link className="btn" to="/admin">Ir al panel de administración</Link>
      </div>
    </div>
  )
}