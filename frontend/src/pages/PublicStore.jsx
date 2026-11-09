import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatPrice, storefrontApi } from '../api'
import { buildPurchaseLinks, productOrderMessage, waLink, ICONS } from '../channels'
import { carouselPage } from '../carousel'
import { productImages } from '../images'
import { discountPercent, effectivePrice, hasOffer } from '../pricing'
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

// Copia al portapapeles con respaldo para navegadores viejos o contextos donde
// la API moderna no está disponible.
const copyText = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Seguimos con el respaldo de abajo.
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '0'
    area.style.left = '0'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.focus()
    area.select()
    area.setSelectionRange(0, text.length)
    const copied = document.execCommand('copy')
    document.body.removeChild(area)
    return copied
  } catch {
    return false
  }
}

function PriceTag({ product }) {
  if (hasOffer(product)) {
    const percent = discountPercent(product)
    const oldPrice = formatPrice(product.price)
    const offerPrice = formatPrice(effectivePrice(product))
    return (
      <span className="product-price-row offer-price-list">
        {oldPrice && <span className="product-price-old">Precio original: {oldPrice}</span>}
        <span className="product-offer-badge">
          {percent > 0 ? `Descuento del: ${percent}%` : 'Oferta'}
        </span>
        {offerPrice && (
          <span className="product-price">
            {oldPrice ? `Precio con descuento: ${offerPrice}` : offerPrice}
          </span>
        )}
      </span>
    )
  }
  const price = formatPrice(product.price)
  return price ? <span className="product-price">{price}</span> : null
}

// Carrusel compartido por las colecciones de la tienda. Solo muestra fotos:
// al tocar una, se abre la ventana de detalles del producto. Con una sola foto
// no hay carrusel (solo queda el filtro de la colección); con dos se ve una a
// la vez; con tres o más se ven de a tres, repitiendo fotos si hace falta para
// completar cada tanda.
function ProductPhotoCarousel({
  title,
  eyebrow,
  products,
  onOpen,
  onSeeAll,
  actionLabel,
  interval = 4000,
}) {
  const [slide, setSlide] = useState(0)
  const photos = products.filter((product) => productImages(product).length > 0)
  const { pageSize, pageCount, items } = carouselPage(photos, slide)

  useEffect(() => {
    if (pageCount <= 1) return undefined
    const timer = window.setInterval(
      () => setSlide((index) => (index + 1) % pageCount),
      interval,
    )
    return () => window.clearInterval(timer)
  }, [pageCount, interval])

  if (!pageCount) return null

  return (
    <section className="store-carousel" aria-label={title}>
      <div className="store-carousel-heading">
        {eyebrow && <span>{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      <div
        key={`${title}-${slide % pageCount}`}
        className={`store-carousel-photos${pageSize === 3 ? ' has-three' : ''}`}
      >
        {items.map((product) => {
          const photo = productImages(product)[0]
          return photo ? (
            <button
              type="button"
              className="store-carousel-frame"
              key={product.id}
              onClick={() => onOpen(product)}
              aria-label={`Ver ${product.name}`}
            >
              <img src={photo} alt={product.name} />
            </button>
          ) : null
        })}
      </div>
      <button type="button" className="store-carousel-link" onClick={onSeeAll}>
        {actionLabel}
      </button>
    </section>
  )
}

export default function PublicStore() {
  const { slug } = useParams()
  const [store, setStore] = useState(null)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [activeImage, setActiveImage] = useState(0)
  const [order, setOrder] = useState(null)
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

  const offerProducts = useMemo(
    () => (store ? store.products.filter(hasOffer) : []),
    [store],
  )
  const seasonalProducts = useMemo(
    () => (store ? store.products.filter((item) => item.seasonal_category) : []),
    [store],
  )
  const featuredProducts = useMemo(
    () => (store ? store.products.filter((item) => item.featured) : []),
    [store],
  )
  const offerCarouselProducts = useMemo(
    () => offerProducts.filter((product) => productImages(product).length > 0),
    [offerProducts],
  )
  const seasonalCarouselProducts = useMemo(
    () => seasonalProducts.filter((product) => productImages(product).length > 0),
    [seasonalProducts],
  )
  const featuredCarouselProducts = useMemo(
    () => featuredProducts.filter((product) => productImages(product).length > 0),
    [featuredProducts],
  )
  const showStoreHighlights = category === 'all' && !query.trim()

  const products = useMemo(() => {
    if (!store) return []
    const q = query.toLowerCase()
    return store.products.filter((p) => {
      const inCategory =
        category === 'offers'
          ? hasOffer(p)
          : category === 'seasonal'
            ? Boolean(p.seasonal_category)
            : category === 'featured'
              ? Boolean(p.featured)
              : category === 'all' || String(p.category) === String(category)
      const matches =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      return inCategory && matches
    })
  }, [store, category, query])

  const openProduct = (product) => {
    setActiveImage(0)
    setSelected(product)
  }

  const openOrder = (product, channel) => {
    const message = productOrderMessage(store, product)
    setSelected(null)
    setOrder({ product, channel, message, copied: null })
    // Aprovechamos el clic del usuario para copiar automáticamente. Si el
    // navegador lo bloquea, el modal muestra el botón para copiar a mano.
    copyText(message).then((copied) => {
      setOrder((prev) =>
        prev &&
        prev.channel.key === channel.key &&
        String(prev.product.id) === String(product.id)
          ? { ...prev, copied }
          : prev,
      )
    })
  }

  const copyOrder = () => {
    if (!order) return
    copyText(order.message).then((copied) => {
      setOrder((prev) => (prev ? { ...prev, copied } : prev))
    })
  }

  const renderPurchaseButton = (channel, product) => {
    const content = (
      <>
        <svg viewBox={channel.viewBox} width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d={channel.icon} />
        </svg>
        {channel.action} {channel.label}
      </>
    )
    // WhatsApp sigue abriendo el chat con el mensaje ya escrito. Las redes
    // sociales no permiten eso, así que abrimos la guía para copiar y pegar.
    if (channel.key === 'whatsapp') {
      return (
        <a key={channel.key} className="btn-buy" href={channel.href} target="_blank" rel="noreferrer">
          {content}
        </a>
      )
    }
    return (
      <button key={channel.key} type="button" className="btn-buy" onClick={() => openOrder(product, channel)}>
        {content}
      </button>
    )
  }

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
  const selectedImages = selected ? productImages(selected) : []

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

      {showStoreHighlights && seasonalCarouselProducts.length > 0 && (
        <ProductPhotoCarousel
          title="Productos de temporada"
          eyebrow="PARA CADA OCASIÓN"
          products={seasonalCarouselProducts}
          onOpen={openProduct}
          onSeeAll={() => setCategory('seasonal')}
          actionLabel="Ver productos de temporada"
        />
      )}

      {showStoreHighlights && offerCarouselProducts.length > 0 && (
        <ProductPhotoCarousel
          title={store.sale_text || 'Productos con ofertas'}
          eyebrow="OFERTAS"
          products={offerCarouselProducts}
          onOpen={openProduct}
          onSeeAll={() => setCategory('offers')}
          actionLabel="Ver ofertas"
        />
      )}

      {showStoreHighlights && featuredCarouselProducts.length > 0 && (
        <ProductPhotoCarousel
          title={store.featured_products_text || 'Productos destacados'}
          eyebrow="SELECCIÓN DE LA TIENDA"
          products={featuredCarouselProducts}
          onOpen={openProduct}
          onSeeAll={() => setCategory('featured')}
          actionLabel="Ver productos destacados"
        />
      )}

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
            {offerProducts.length > 0 && (
              <button
                className={`store-filter${category === 'offers' ? ' active' : ''}`}
                onClick={() => setCategory('offers')}
              >
                Ofertas <span className="store-filter-count">{offerProducts.length}</span>
              </button>
            )}
            {seasonalProducts.length > 0 && (
              <button
                className={`store-filter${category === 'seasonal' ? ' active' : ''}`}
                onClick={() => setCategory('seasonal')}
              >
                Temporada <span className="store-filter-count">{seasonalProducts.length}</span>
              </button>
            )}
            {featuredProducts.length > 0 && (
              <button
                className={`store-filter${category === 'featured' ? ' active' : ''}`}
                onClick={() => setCategory('featured')}
              >
                Destacados <span className="store-filter-count">{featuredProducts.length}</span>
              </button>
            )}
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
          const buyLinks = buildPurchaseLinks(store, productOrderMessage(store, p))
          const cover = productImages(p)[0]
          return (
            <article className="product-card" key={p.id}>
              {cover && <img src={cover} alt={p.name} />}
              <div className="product-body">
                {p.brand && <span className="product-brand">{p.brand}</span>}
                <h3 className="product-name-link" onClick={() => openProduct(p)}>{p.name}</h3>
                {p.description && <p className="store-product-desc">{p.description}</p>}
                <PriceTag product={p} />
                <button type="button" className="product-details-link" onClick={() => openProduct(p)}>
                  Ver detalles…
                </button>
                {buyLinks.length > 0 && (
                  <div className="product-buy">
                    {buyLinks.map((c) => renderPurchaseButton(c, p))}
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
            {selectedImages.length > 0 && (
              <div className="product-gallery">
                <img
                  className="product-gallery-main"
                  src={selectedImages[activeImage] || selectedImages[0]}
                  alt={selected.name}
                />
                {selectedImages.length > 1 && (
                  <div className="product-gallery-thumbs">
                    {selectedImages.map((src, index) => (
                      <button
                        key={src}
                        type="button"
                        className={index === activeImage ? 'active' : ''}
                        onClick={() => setActiveImage(index)}
                        aria-label={`Ver foto ${index + 1}`}
                        aria-pressed={index === activeImage}
                      >
                        <img src={src} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="product-modal-body">
              <h2>{selected.name}</h2>
              {selected.brand && <span className="product-brand">{selected.brand}</span>}
              {selected.description && <p>{selected.description}</p>}
              <PriceTag product={selected} />
              {buildPurchaseLinks(store, productOrderMessage(store, selected)).map((c) =>
                renderPurchaseButton(c, selected),
              )}
            </div>
          </div>
        </div>
      )}

      {order && (
        <div className="product-modal-overlay" onClick={() => setOrder(null)}>
          <div
            className="product-modal order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="product-modal-close" onClick={() => setOrder(null)} aria-label="Cerrar">×</button>
            <div className="product-modal-body order-modal-body">
              <span className="order-channel">
                <svg viewBox={order.channel.viewBox} width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d={order.channel.icon} />
                </svg>
                {order.channel.label}
              </span>
              <h2 id="order-title">Hola, este es tu pedido</h2>
              <p>Copiá el mensaje y envialo por {order.channel.label}.</p>

              <div className="order-message">
                <p>{order.message}</p>
              </div>

              <p
                className={`order-status ${order.copied === false ? 'error' : order.copied ? 'ok' : ''}`}
                role="status"
                aria-live="polite"
              >
                {order.copied === null
                  ? 'Copiando el pedido…'
                  : order.copied
                    ? '¡Pedido copiado!'
                    : 'No se pudo copiar automáticamente. Tocá “Copiar pedido”.'}
              </p>

              <div className="order-actions">
                <button type="button" className="btn-buy order-copy" onClick={copyOrder}>
                  Copiar pedido
                </button>
                <a className="btn-buy" href={order.channel.href} target="_blank" rel="noreferrer">
                  Continuar a {order.channel.label}
                </a>
              </div>

              <ol className="order-steps">
                <li>Copiá el pedido.</li>
                <li>Dale a continuar.</li>
                <li>Ve a enviar mensaje.</li>
                <li>Pegá el pedido en el mensaje.</li>
                <li>Listo, ya estarías pidiendo por {order.channel.label}.</li>
              </ol>
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
