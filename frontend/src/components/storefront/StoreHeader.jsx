import { waLink } from '../../api'

export default function StoreHeader({ store }) {
  const greeting = `Hola ${store.name}, tengo una consulta.`

  return (
    <header className="store-header">
      <div className="store-header-inner">
        <div className="store-brand">
          {store.logo ? (
            <img className="store-logo" src={store.logo} alt={store.name} />
          ) : (
            <div className="store-logo store-logo-fallback">{String(store.name || 'T')[0].toUpperCase()}</div>
          )}
          <div>
            <h1 className="store-name">{store.name}</h1>
            {store.description && <p className="store-tagline">{store.description}</p>}
          </div>
        </div>

        {store.phone && (
          <div className="store-actions">
            <a className="btn-outline" href={waLink(store.phone, greeting)} target="_blank" rel="noreferrer">
              Contactar por WhatsApp
            </a>
          </div>
        )}
      </div>
    </header>
  )
}