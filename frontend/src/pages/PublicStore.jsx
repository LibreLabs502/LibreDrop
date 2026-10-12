import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatPrice, storefrontApi } from '../api'
import { themeStyle } from '../theme'

const waLink = (phone, message) => {
  const digits = String(phone || '').replace(/[^\d]/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

// Redes sociales de la tienda: cada una con su logo (ícono SVG).
const SOCIAL_LINKS = [
  {
    key: 'instagram_url',
    label: 'Instagram',
    path: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm7.846-10.405a1.441 1.441 0 01-2.88 0 1.44 1.44 0 012.88 0z',
  },
  {
    key: 'facebook_url',
    label: 'Facebook',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    key: 'tiktok_url',
    label: 'TikTok',
    path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  },
  {
    key: 'linkedin_url',
    label: 'LinkedIn',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
]

export default function PublicStore() {
  const { slug } = useParams()
  const [store, setStore] = useState(null)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    let alive = true
    // Al cambiar de tienda, no mostramos la anterior mientras carga: así el
    // tema nuevo no se aplica sobre datos viejos.
    setStore(null)
    setError('')
    storefrontApi
      .getStore(slug)
      .then((s) => {
        if (!alive) return
        setStore(s)
        if (s?.name) document.title = s.name
      })
      .catch((e) => {
        if (alive) setError(e.message)
      })
    return () => {
      alive = false
      document.title = 'LibreDrop'
    }
  }, [slug])

  const themeVars = useMemo(() => themeStyle(store?.theme), [store])

  // Colorea el fondo del body para que toda la página comparta el tema.
  useEffect(() => {
    const body = document.body
    if (!body) return
    const bg = themeVars['--store-bg'] || '#f6f7f9'
    const prev = body.style.background
    body.style.background = bg
    return () => {
      body.style.background = prev
    }
  }, [themeVars])

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

  const socials = SOCIAL_LINKS.filter((s) => store[s.key])

  return (
    <div className="store-page" style={themeVars}>
      <header className="store-hero store-hero-brand">
        <div className="store-hero-row">
          {store.logo ? (
            <img className="store-logo-lg" src={store.logo} alt={store.name} />
          ) : (
            <div className="store-logo-lg store-logo-fallback">{String(store.name || 'T')[0].toUpperCase()}</div>
          )}
          <div className="store-hero-info">
            <h1
              className="store-name-link"
              role="button"
              tabIndex={0}
              title="Ver descripción completa"
              onClick={() => setInfoOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setInfoOpen(true)
                }
              }}
            >
              {store.name}
            </h1>
            {store.description && <p className="store-hero-desc">{store.description}</p>}
            {socials.length > 0 && (
              <div className="store-socials">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    className="store-social-link"
                    href={store[s.key]}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    title={s.label}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                      <path d={s.path} />
                    </svg>
                  </a>
                ))}
              </div>
            )}
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
                {p.description && <p className="store-product-desc">{p.description}</p>}
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

      {infoOpen && (
        <div className="product-modal-overlay" onClick={() => setInfoOpen(false)}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="product-modal-close" onClick={() => setInfoOpen(false)} aria-label="Cerrar">×</button>
            <div className="product-modal-body">
              <h2>{store.name}</h2>
              {store.description && <p>{store.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
