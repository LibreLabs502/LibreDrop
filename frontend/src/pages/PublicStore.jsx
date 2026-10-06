import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatPrice, storefrontApi } from '../api'

const waLink = (phone, message) => {
  const digits = String(phone || '').replace(/[^\d]/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export default function PublicStore() {
  const { slug } = useParams()
  const [store, setStore] = useState(null)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    storefrontApi
      .getStore(slug)
      .then((s) => {
        setStore(s)
        if (s?.name) document.title = s.name
      })
      .catch((e) => setError(e.message))
    return () => {
      document.title = 'LibreDrop'
    }
  }, [slug])

  const products = useMemo(() => {
    if (!store) return []
    return store.products.filter((p) => {
      const inCategory = category === 'all' || String(p.category) === String(category)
      const matches = !query || p.name.toLowerCase().includes(query.toLowerCase())
      return inCategory && matches
    })
  }, [store, category, query])

  if (error) {
    return (
      <div className="store-page">
        <div className="store-error">
          <h1>Tienda no encontrada</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return <div className="store-page"><p className="store-loading">Cargando tienda…</p></div>
  }

  return (
    <div className="store-page">
      <header className="store-hero store-hero-brand">
        <div className="store-hero-row">
          {store.logo ? (
            <img className="store-logo-lg" src={store.logo} alt={store.name} />
          ) : (
            <div className="store-logo-lg store-logo-fallback">{String(store.name || 'T')[0].toUpperCase()}</div>
          )}
          <div className="store-hero-info">
            <h1>{store.name}</h1>
            {store.description && <p>{store.description}</p>}
          </div>
          {store.whatsapp && (
            <a
              className="btn-store-contact"
              href={waLink(store.whatsapp, `Hola ${store.name}, tengo una consulta.`)}
              target="_blank"
              rel="noreferrer"
            >
              Contactar por WhatsApp
            </a>
          )}
        </div>
      </header>

      <div className="store-toolbar">
        <nav className="store-cats">
          <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>
            Todos
          </button>
          {store.categories.map((c) => (
            <button
              key={c.id}
              className={String(category) === String(c.id) ? 'active' : ''}
              onClick={() => setCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </nav>
        <input
          className="store-search"
          type="search"
          placeholder="Buscar productos…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <section className="store-grid">
        {products.length === 0 && <p className="muted">No hay productos.</p>}
        {products.map((p) => {
          const buyUrl = waLink(store.whatsapp, `Hola ${store.name}, me gustaria comprar este producto: ${p.name}. ¿Aun tienen a la venta?`)
          return (
            <article className="product-card" key={p.id}>
              {p.image && <img src={p.image} alt={p.name} />}
              <div className="product-body">
                <h3 className="product-name-link" onClick={() => setSelected(p)}>{p.name}</h3>
                {p.description && <p>{p.description}</p>}
                <span className="product-price">{formatPrice(p.price)}</span>
                {buyUrl && (
                  <a className="btn-whatsapp" href={buyUrl} target="_blank" rel="noreferrer">
                    <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor" aria-hidden="true">
                      <path d="M16.04 4C9.5 4 4.12 9.37 4.12 15.9c0 2.1.55 4.15 1.6 5.96L4 28l6.32-1.66a11.9 11.9 0 0 0 5.72 1.46h.01c6.53 0 11.91-5.37 11.91-11.9S22.58 4 16.04 4zm6.95 16.78c-.29.81-1.43 1.55-2.32 1.65-.61.06-1.4.1-2.3-.14-.53-.14-1.2-.39-2.06-.77-3.63-1.57-5.99-5.23-6.17-5.47-.18-.24-1.46-1.95-1.46-3.72 0-1.77.92-2.64 1.25-3 .32-.35.71-.44 1.06-.44h.76c.24 0 .57-.09.89.68.33.8 1.12 2.77 1.22 2.97.1.2.16.43.03.68-.13.25-.2.4-.4.62-.19.21-.41.47-.58.63-.2.19-.4.4-.17.79.23.39 1.02 1.68 2.2 2.72 1.5 1.33 2.77 1.74 3.16 1.94.4.2.63.16.86-.1.23-.26.98-1.14 1.24-1.53.26-.4.52-.33.88-.2.36.13 2.29 1.08 2.68 1.27.4.2.66.29.75.46.1.16.1.94-.2 1.79z" />
                    </svg>
                    Comprar por WhatsApp
                  </a>
                )}
              </div>
            </article>
          )
        })}
      </section>

      {selected && (
        <div className="product-modal-overlay" onClick={() => setSelected(null)}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="product-modal-close" onClick={() => setSelected(null)} aria-label="Cerrar">×</button>
            {selected.image && <img src={selected.image} alt={selected.name} />}
            <div className="product-modal-body">
              <h2>{selected.name}</h2>
              {selected.description && <p>{selected.description}</p>}
              <span className="product-price">{formatPrice(selected.price)}</span>
              {waLink(store.whatsapp, `Hola ${store.name}, me gustaria comprar este producto: ${selected.name}. ¿Aun tienen a la venta?`) && (
                <a
                  className="btn-whatsapp"
                  href={waLink(store.whatsapp, `Hola ${store.name}, me gustaria comprar este producto: ${selected.name}. ¿Aun tienen a la venta?`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Comprar por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
