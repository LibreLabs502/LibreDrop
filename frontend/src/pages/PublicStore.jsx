import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatPrice, storefrontApi } from '../api'
import { buildPurchaseLinks, waLink, ICONS } from '../channels'
import { themeStyle } from '../theme'

// Redes sociales de la tienda: cada una con su logo (ícono SVG).
const SOCIAL_LINKS = [
  {
    key: 'instagram_url',
    label: 'Instagram',
    path: ICONS.instagram,
  },
  {
    key: 'facebook_url',
    label: 'Facebook',
    path: ICONS.facebook,
  },
  {
    key: 'tiktok_url',
    label: 'TikTok',
    path: ICONS.tiktok,
  },
  {
    key: 'linkedin_url',
    label: 'LinkedIn',
    path: ICONS.linkedin,
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

  // Categorías: con muchas, se navegan con flechitas en vez de la barra de
  // scroll (que ocultamos por CSS). Las flechas solo aparecen si desbordan.
  const catsRef = useRef(null)
  const [catsNav, setCatsNav] = useState({ overflow: false, left: false, right: false })

  const updateCatsNav = useCallback(() => {
    const el = catsRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    const next = {
      overflow: maxScroll > 1,
      left: el.scrollLeft > 1,
      right: el.scrollLeft < maxScroll - 1,
    }
    // Si nada cambió devolvemos el estado anterior: evita renders/loops.
    setCatsNav((prev) =>
      prev.overflow === next.overflow && prev.left === next.left && prev.right === next.right
        ? prev
        : next,
    )
  }, [])

  useEffect(() => {
    const el = catsRef.current
    if (!el) return
    updateCatsNav()
    el.addEventListener('scroll', updateCatsNav, { passive: true })
    // Al montar las flechas o redimensionar, el ancho cambia: re-medimos.
    const observer = new ResizeObserver(updateCatsNav)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', updateCatsNav)
      observer.disconnect()
    }
  }, [updateCatsNav, store])

  const scrollCats = (direction) => {
    const el = catsRef.current
    if (!el) return
    el.scrollBy({ left: direction * Math.max(140, el.clientWidth * 0.7), behavior: 'smooth' })
  }

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
        <div className="store-cats-wrap">
          {catsNav.overflow && (
            <button
              type="button"
              className="store-cats-arrow"
              onClick={() => scrollCats(-1)}
              disabled={!catsNav.left}
              aria-label="Categorías anteriores"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path
                  d="M15 6l-6 6 6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <nav className="store-cats" ref={catsRef}>
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
          {catsNav.overflow && (
            <button
              type="button"
              className="store-cats-arrow"
              onClick={() => scrollCats(1)}
              disabled={!catsNav.right}
              aria-label="Ver más categorías"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path
                  d="M9 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
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
          const buyLinks = buildPurchaseLinks(
            store,
            `Hola ${store.name}, me gustaria comprar este producto: ${p.name}. ¿Aun tienen a la venta?`,
          )
          return (
            <article className="product-card" key={p.id}>
              {p.image && <img src={p.image} alt={p.name} />}
              <div className="product-body">
                <h3 className="product-name-link" onClick={() => setSelected(p)}>{p.name}</h3>
                {p.description && <p className="store-product-desc">{p.description}</p>}
                <span className="product-price">{formatPrice(p.price)}</span>
                {buyLinks.length > 0 && (
                  <div className="product-buy">
                    {buyLinks.map((c) => (
                      <a key={c.key} className="btn-buy" href={c.href} target="_blank" rel="noreferrer">
                        <svg viewBox={c.viewBox} width="18" height="18" fill="currentColor" aria-hidden="true">
                          <path d={c.icon} />
                        </svg>
                        {c.action} {c.label}
                      </a>
                    ))}
                  </div>
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
              {buildPurchaseLinks(
                store,
                `Hola ${store.name}, me gustaria comprar este producto: ${selected.name}. ¿Aun tienen a la venta?`,
              ).map((c) => (
                <a key={c.key} className="btn-buy" href={c.href} target="_blank" rel="noreferrer">
                  <svg viewBox={c.viewBox} width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d={c.icon} />
                  </svg>
                  {c.action} {c.label}
                </a>
              ))}
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
