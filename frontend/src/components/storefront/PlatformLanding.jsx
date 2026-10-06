import { Link } from 'react-router-dom'

export default function PlatformLanding() {
  return (
    <div className="landing">
      <img className="landing-icon" src="/images/favicon.png" alt="LibreDrop" />
      <h1>Tiendas online simples, sin comisiones.</h1>
      <img className="landing-hero" src="/images/libredrop-hero-soft.webp" alt="LibreDrop" />
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