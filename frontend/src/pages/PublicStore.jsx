import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatPrice, storefrontApi } from '../api'
import { buildPurchaseLinks, productOrderMessage, waLink, ICONS } from '../channels'
import { productImages } from '../images'
import { discountPercent, effectivePrice, hasOffer, offerCountdown } from '../pricing'
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

function PriceTag({ product, now = Date.now() }) {
  if (hasOffer(product, now)) {
    const percent = discountPercent(product, now)
    const oldPrice = formatPrice(product.price)
    const offerPrice = formatPrice(effectivePrice(product, now))
    const countdown = offerCountdown(product, now)
    return (
      <span className="product-price-row offer-price-list">
        {oldPrice && <span className="product-price-old">Precio original: {oldPrice}</span>}
        <span className="product-offer-badge">
          {percent > 0 ? `Descuento: ${percent}%` : 'Oferta'}
        </span>
        {offerPrice && (
          <span className="product-price">Precio con descuento: {offerPrice}</span>
        )}
        {countdown && <span className="product-offer-countdown">Termina en {countdown}</span>}
      </span>
    )
  }
  const price = formatPrice(product.price)
  return price ? <span className="product-price">{price}</span> : null
}

function ArrowIcon({ direction = 'right' }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d={direction === 'left' ? 'M14.5 5 7.5 12l7 7' : 'm9.5 5 7 7-7 7'} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StoreHeroCarousel({ products, eyebrow, title, store, now, onBuy, onOpen }) {
  const [slide, setSlide] = useState(0)
  const visibleProducts = products.filter((product) => productImages(product).length > 0)

  useEffect(() => {
    setSlide(0)
  }, [store?.id, eyebrow])

  useEffect(() => {
    if (visibleProducts.length < 2) return undefined
    const timer = window.setInterval(() => setSlide((index) => (index + 1) % visibleProducts.length), 5500)
    return () => window.clearInterval(timer)
  }, [visibleProducts.length])

  if (!visibleProducts.length) return null

  const product = visibleProducts[slide % visibleProducts.length]
  const cover = productImages(product)[0]
  const buyLinks = buildPurchaseLinks(store, productOrderMessage(store, product))

  return (
    <section id="store-hero" className="store-hero-carousel" aria-label={title}>
      <div className="store-hero-glow" aria-hidden="true" />
      <div className="store-hero-slide" key={product.id}>
        <div className="store-hero-copy">
          <span className="store-hero-eyebrow">{eyebrow}</span>
          <p className="store-hero-kicker">{title}</p>
          <h1>{product.name}</h1>
          {product.description && <p className="store-hero-product-desc">{product.description}</p>}
          <PriceTag product={product} now={now} />
          <div className="store-hero-actions">
            {buyLinks.map((channel) => onBuy(channel, product))}
            <button type="button" className="store-hero-details" onClick={() => onOpen(product)}>Ver producto</button>
          </div>
        </div>
        <button type="button" className="store-hero-image" onClick={() => onOpen(product)} aria-label={`Ver ${product.name}`}>
          <img src={cover} alt={product.name} />
          {hasOffer(product, now) && <span className="store-hero-offer">-{discountPercent(product, now)}% OFF</span>}
        </button>
      </div>
      {visibleProducts.length > 1 && (
        <div className="store-hero-dots" aria-label="Elegir producto destacado">
          {visibleProducts.map((item, index) => (
            <button key={item.id} type="button" className={index === slide ? 'active' : ''} onClick={() => setSlide(index)} aria-label={`Ver ${item.name}`} aria-pressed={index === slide} />
          ))}
        </div>
      )}
    </section>
  )
}

function CollectionRail({ id, title, eyebrow, products, now, onOpen, onSeeAll }) {
  const railRef = useRef(null)
  const [railEdges, setRailEdges] = useState({ left: false, right: false })
  const updateRailEdges = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    const maxScroll = rail.scrollWidth - rail.clientWidth
    setRailEdges((current) => {
      const next = { left: rail.scrollLeft > 1, right: rail.scrollLeft < maxScroll - 1 }
      return current.left === next.left && current.right === next.right ? current : next
    })
  }, [])

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return undefined
    updateRailEdges()
    rail.addEventListener('scroll', updateRailEdges, { passive: true })
    const observer = new ResizeObserver(updateRailEdges)
    observer.observe(rail)
    return () => {
      rail.removeEventListener('scroll', updateRailEdges)
      observer.disconnect()
    }
  }, [products.length, updateRailEdges])

  const scrollRail = (direction) => {
    if (!railRef.current) return
    railRef.current.scrollBy({ left: direction * railRef.current.clientWidth * .8, behavior: 'smooth' })
  }

  if (!products.length) return null

  return (
    <section className="store-collection-rail-section" id={id}>
      <header className="store-rail-heading">
        <div>
          <span className="store-section-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <div className="store-rail-actions">
          <button type="button" className="store-see-all" onClick={onSeeAll}>Ver todas <ArrowIcon /></button>
          <button type="button" className="store-rail-arrow" onClick={() => scrollRail(-1)} disabled={!railEdges.left} aria-label={`Anterior: ${title}`}><ArrowIcon direction="left" /></button>
          <button type="button" className="store-rail-arrow" onClick={() => scrollRail(1)} disabled={!railEdges.right} aria-label={`Siguiente: ${title}`}><ArrowIcon /></button>
        </div>
      </header>
      <div className="store-product-rail" ref={railRef}>
        {products.map((product) => {
          const cover = productImages(product)[0]
          return (
            <button key={product.id} type="button" className="store-rail-product" onClick={() => onOpen(product)}>
              <span className="store-rail-product-media">
                <img src={cover} alt="" />
                {hasOffer(product, now) && <span className="store-rail-badge">-{discountPercent(product, now)}%</span>}
              </span>
              <span className="store-rail-product-info">
                {product.brand && <span className="product-brand">{product.brand}</span>}
                <strong>{product.name}</strong>
                <PriceTag product={product} now={now} />
                <span className="store-rail-choose">Ver opciones <ArrowIcon /></span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function PublicStore() {
  const { slug } = useParams()
  const [store, setStore] = useState(null)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('all')
  const [seasonalSubcategory, setSeasonalSubcategory] = useState('all')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [activeImage, setActiveImage] = useState(0)
  const [order, setOrder] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  // Categorías: con muchas, se navegan con flechitas en vez de la barra de
  // scroll (que ocultamos por CSS). Las flechas solo aparecen si desbordan.
  const catsRef = useRef(null)
  const searchInputRef = useRef(null)
  const navbarRef = useRef(null)
  const [catsNav, setCatsNav] = useState({ overflow: false, left: false, right: false })
  const [navbarScrolled, setNavbarScrolled] = useState(false)

  useEffect(() => {
    const updateNavbar = () => {
      setNavbarScrolled(window.scrollY > 8)
    }
    updateNavbar()
    window.addEventListener('scroll', updateNavbar, { passive: true })
    window.addEventListener('resize', updateNavbar)
    return () => {
      window.removeEventListener('scroll', updateNavbar)
      window.removeEventListener('resize', updateNavbar)
    }
  }, [])

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

  useEffect(() => {
    const hasUpcomingEnd = store?.products?.some(
      (product) => product.offer_ends_at && new Date(product.offer_ends_at).getTime() > now,
    )
    if (!hasUpcomingEnd) return undefined
    const timer = window.setTimeout(() => setNow(Date.now()), 1000)
    return () => window.clearTimeout(timer)
  }, [store, now])

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
    () => (store ? store.products.filter((product) => hasOffer(product, now)) : []),
    [store, now],
  )
  const seasonalProducts = useMemo(
    () => (store ? store.products.filter((item) => item.seasonal_category) : []),
    [store],
  )
  const seasonalCategories = useMemo(() => {
    if (!store) return []
    return (store.seasonal_categories || []).filter((season) =>
      seasonalProducts.some((product) => String(product.seasonal_category) === String(season.id)),
    )
  }, [store, seasonalProducts])
  const featuredProducts = useMemo(
    () => (store ? store.products.filter((item) => item.featured).sort((a, b) => {
      const aOrder = a.featured_order
      const bOrder = b.featured_order
      const aHasOrder = aOrder !== null && aOrder !== undefined
      const bHasOrder = bOrder !== null && bOrder !== undefined
      if (aHasOrder && bHasOrder) return aOrder - bOrder
      if (aHasOrder) return -1
      if (bHasOrder) return 1
      return a.name.localeCompare(b.name)
    }) : []),
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
  const isSearching = searchOpen || Boolean(query.trim())
  const showStoreHighlights = category === 'all' && !isSearching
  const heroCollection = seasonalCarouselProducts.length
    ? { type: 'seasonal', products: seasonalCarouselProducts, eyebrow: 'COLECCIÓN DE TEMPORADA', title: 'Para cada ocasión' }
    : offerCarouselProducts.length
      ? { type: 'offers', products: offerCarouselProducts, eyebrow: 'OFERTAS ESPECIALES', title: store?.sale_text || 'Encontrá tu favorito' }
      : featuredCarouselProducts.length
        ? { type: 'featured', products: featuredCarouselProducts, eyebrow: 'PRODUCTOS DESTACADOS', title: store?.featured_products_text || 'Nuestra selección' }
        : null
  const secondaryCollections = [
    { type: 'seasonal', id: 'rail-seasonal', title: 'Productos de temporada', eyebrow: 'PARA CADA OCASIÓN', products: seasonalCarouselProducts },
    { type: 'offers', id: 'rail-offers', title: store?.sale_text || 'Ofertas especiales', eyebrow: 'PRECIOS ESPECIALES', products: offerCarouselProducts },
    { type: 'featured', id: 'rail-featured', title: store?.featured_products_text || 'Productos destacados', eyebrow: 'SELECCIÓN DE LA TIENDA', products: featuredCarouselProducts },
  ].filter((collection) => collection.type !== heroCollection?.type && collection.products.length > 0)

  const chooseCategory = (nextCategory) => {
    setCategory(nextCategory)
    setSeasonalSubcategory('all')
  }

  const scrollToStoreSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openSearch = () => {
    const nextOpen = !searchOpen
    setSearchOpen(nextOpen)
    if (!nextOpen) setQuery('')
    chooseCategory('all')
  }

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus({ preventScroll: true })
  }, [searchOpen])

  useEffect(() => {
    if (!searchOpen) return undefined
    const closeSearchOutside = (event) => {
      if (!event.target.closest('.store-search-panel, .store-search-toggle')) setSearchOpen(false)
    }
    document.addEventListener('pointerdown', closeSearchOutside)
    return () => document.removeEventListener('pointerdown', closeSearchOutside)
  }, [searchOpen])

  const products = useMemo(() => {
    if (!store) return []
    const q = query.toLowerCase()
    return store.products.filter((p) => {
      const inCategory =
        category === 'offers'
          ? hasOffer(p, now)
          : category === 'seasonal'
            ? Boolean(p.seasonal_category) && (
                seasonalSubcategory === 'all' ||
                String(p.seasonal_category) === String(seasonalSubcategory)
              )
            : category === 'featured'
              ? Boolean(p.featured)
              : category === 'all' || String(p.category) === String(category)
      const matches =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      return inCategory && matches
    })
  }, [store, category, seasonalSubcategory, query, now])

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
  const currentCategory = store.categories.find((item) => String(item.id) === String(category))
  const specialNavItems = [
    seasonalCarouselProducts.length > 0 && { label: 'Temporada', type: 'seasonal' },
    offerCarouselProducts.length > 0 && { label: 'Ofertas', type: 'offers' },
    featuredCarouselProducts.length > 0 && { label: 'Destacados', type: 'featured' },
  ].filter(Boolean)
  const topNavItems = store.categories.slice(0, 4).map((item) => ({ label: item.name, type: 'category', value: item.id }))
  if (topNavItems.length < 4) {
    const specialsNeeded = Math.max(0, 3 - topNavItems.length)
    topNavItems.push(...specialNavItems.slice(0, specialsNeeded))
    if (topNavItems.length < 4) topNavItems.push({ label: 'Ver todo', type: 'all' })
  }
  const collectionTitle = query.trim()
    ? `Resultados para “${query.trim()}”`
    : searchOpen
      ? 'Buscá tus productos favoritos'
    : category === 'offers'
      ? 'Ofertas especiales'
      : category === 'seasonal'
        ? 'Colección de temporada'
        : category === 'featured'
          ? 'Selección destacada'
          : currentCategory?.name || 'Nuestra colección'

  return (
    <div className="store-page" style={themeVars}>
      <nav ref={navbarRef} className={`store-navbar${navbarScrolled ? ' is-scrolled' : ''}${searchOpen ? ' search-open' : ''}${isSearching ? ' is-searching' : ''}`} aria-label="Navegación de la tienda">
        <div className="store-navbar-inner">
          <div id="store-main-menu" className={`store-navbar-links${mobileMenuOpen ? ' mobile-open' : ''}`}>
            {topNavItems.map((item) => (
              <button
                type="button"
                key={`${item.type}-${item.value || item.label}`}
                onClick={() => {
                  setMobileMenuOpen(false)
                  if (item.type === 'category') {
                    chooseCategory(item.value)
                    setQuery('')
                    setSearchOpen(false)
                    scrollToStoreSection('all-products')
                  } else if (item.type === 'all') {
                    chooseCategory('all')
                    setQuery('')
                    setSearchOpen(false)
                    scrollToStoreSection('all-products')
                  } else {
                    setSearchOpen(false)
                    if (showStoreHighlights) {
                      const target = heroCollection?.type === item.type ? 'store-hero' : `rail-${item.type}`
                      scrollToStoreSection(target)
                    } else {
                      chooseCategory(item.type)
                      setQuery('')
                      scrollToStoreSection('all-products')
                    }
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`store-mobile-menu-toggle${mobileMenuOpen ? ' active' : ''}`}
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            aria-controls="store-main-menu"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              {mobileMenuOpen ? (
                <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
          {!searchOpen && (
            <button type="button" className="store-wordmark" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label={`Inicio de ${store.name}`}>
              <span>{store.name}</span>
            </button>
          )}
          <button type="button" className={`store-search-toggle${searchOpen ? ' active' : ''}`} onClick={openSearch} aria-label={searchOpen ? 'Cerrar búsqueda' : 'Buscar productos'}>
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <span>Buscar</span>
          </button>
        </div>
        {searchOpen && (
          <div className="store-search-panel">
            <label className="store-search-label" htmlFor="store-search-input">¿Qué estás buscando?</label>
            <div className="store-search-input-wrap">
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <input id="store-search-input" ref={searchInputRef} className="store-search" type="search" placeholder="Buscar productos…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <button type="button" onClick={() => { setQuery(''); setSearchOpen(false) }} aria-label="Cerrar búsqueda">×</button>
            </div>
          </div>
        )}
      </nav>

      {!isSearching && <section className={`storefront-feature${heroCollection ? '' : ' no-carousel'}`}>
        <div className="store-intro">
          <span className="store-intro-decoration one" aria-hidden="true" />
          <span className="store-intro-decoration two" aria-hidden="true" />
          {store.logo ? (
            <img className="store-intro-logo" src={store.logo} alt={`Logo de ${store.name}`} />
          ) : (
            <span className="store-intro-logo store-intro-logo-fallback" aria-hidden="true">{String(store.name || 'T')[0].toUpperCase()}</span>
          )}
          <span className="store-intro-eyebrow">BIENVENIDO A</span>
          <h1>{store.name}</h1>
          <p>{store.description || 'Descubrí productos hechos para vos.'}</p>
          {socials.length > 0 && (
            <div className="store-socials store-intro-socials">
              {socials.map((s) => (
                <a key={s.key} className="store-social-link" href={store[s.key]} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
          )}
          {store.whatsapp && (
            <a className="store-intro-contact" href={waLink(store.whatsapp, `Hola ${store.name}, tengo una consulta.`)} target="_blank" rel="noreferrer">
              Contactar por WhatsApp
            </a>
          )}
        </div>

        {showStoreHighlights && heroCollection && (
          <StoreHeroCarousel
            products={heroCollection.products}
            eyebrow={heroCollection.eyebrow}
            title={heroCollection.title}
            store={store}
            now={now}
            onBuy={renderPurchaseButton}
            onOpen={openProduct}
          />
        )}
      </section>}

      {showStoreHighlights && secondaryCollections.map((collection) => (
        <CollectionRail
          key={collection.id}
          {...collection}
          now={now}
          onOpen={openProduct}
          onSeeAll={() => {
            chooseCategory(collection.type === 'offers' ? 'offers' : collection.type === 'seasonal' ? 'seasonal' : 'featured')
            scrollToStoreSection('all-products')
          }}
        />
      ))}

      <section className="store-all-products" id="all-products">
      <header className="store-collection-heading">
        <div>
          <span className="store-section-eyebrow">DESCUBRE LA TIENDA</span>
          <h2>{collectionTitle === 'Nuestra colección' ? 'Todos nuestros productos' : collectionTitle}</h2>
          <p>{query.trim() ? 'Encontrá algo que te encante.' : searchOpen ? 'Escribí en el buscador para ver los resultados.' : 'Elegí tus favoritos y consultá por tu canal preferido.'}</p>
        </div>
        <span className="store-product-count">{products.length} {products.length === 1 ? 'producto' : 'productos'}</span>
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
            <button className={category === 'all' ? 'active' : ''} onClick={() => chooseCategory('all')}>
              Todos
            </button>
            {offerProducts.length > 0 && (
              <button
                className={`store-filter${category === 'offers' ? ' active' : ''}`}
                onClick={() => chooseCategory('offers')}
              >
                Ofertas <span className="store-filter-count">{offerProducts.length}</span>
              </button>
            )}
            {seasonalProducts.length > 0 && (
              <button
                className={`store-filter${category === 'seasonal' ? ' active' : ''}`}
                onClick={() => chooseCategory('seasonal')}
              >
                Temporada <span className="store-filter-count">{seasonalProducts.length}</span>
              </button>
            )}
            {featuredProducts.length > 0 && (
              <button
                className={`store-filter${category === 'featured' ? ' active' : ''}`}
                onClick={() => chooseCategory('featured')}
              >
                Destacados <span className="store-filter-count">{featuredProducts.length}</span>
              </button>
            )}
            {store.categories.map((c) => (
              <button
                key={c.id}
                className={String(category) === String(c.id) ? 'active' : ''}
                onClick={() => chooseCategory(c.id)}
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
      </div>

      {category === 'seasonal' && seasonalCategories.length > 0 && (
        <nav className="store-seasonal-subcategories" aria-label="Subcategorías de temporada">
          <span className="store-seasonal-subcategories-label">Explorá por temporada</span>
          <div className="store-seasonal-subcategory-list">
            <button
              type="button"
              className={seasonalSubcategory === 'all' ? 'active' : ''}
              onClick={() => setSeasonalSubcategory('all')}
              aria-pressed={seasonalSubcategory === 'all'}
            >
              Todas <span>{seasonalProducts.length}</span>
            </button>
            {seasonalCategories.map((season) => {
              const count = seasonalProducts.filter(
                (product) => String(product.seasonal_category) === String(season.id),
              ).length
              const active = String(seasonalSubcategory) === String(season.id)
              return (
                <button
                  key={season.id}
                  type="button"
                  className={active ? 'active' : ''}
                  onClick={() => setSeasonalSubcategory(String(season.id))}
                  aria-pressed={active}
                >
                  {season.name} <span>{count}</span>
                </button>
              )
            })}
          </div>
        </nav>
      )}

      <div className="store-grid">
        {products.length === 0 && <p className="muted">No hay productos.</p>}
        {products.map((p, index) => {
          const buyLinks = buildPurchaseLinks(store, productOrderMessage(store, p))
          const cover = productImages(p)[0]
          return (
            <article className="product-card" key={p.id} style={{ '--card-index': Math.min(index, 8) }}>
              <div className="product-media">
                {cover ? (
                  <button type="button" className="product-image-button" onClick={() => openProduct(p)} aria-label={`Ver ${p.name}`}>
                    <img className="product-cover" src={cover} alt={p.name} />
                    <span className="product-quick-view">Vista rápida <span aria-hidden="true">↗</span></span>
                  </button>
                ) : (
                  <div className="product-image-placeholder">Foto próximamente</div>
                )}
                <div className="product-card-badges">
                  {hasOffer(p, now) && <span className="product-card-badge offer">-{discountPercent(p, now)}%</span>}
                  {p.featured && <span className="product-card-badge featured">Destacado</span>}
                </div>
              </div>
              <div className="product-body">
                {p.brand && <span className="product-brand">{p.brand}</span>}
                <button type="button" className="product-name-link" onClick={() => openProduct(p)}>{p.name}</button>
                {p.description && <p className="store-product-desc">{p.description}</p>}
                <PriceTag product={p} now={now} />
                {buyLinks.length > 0 && (
                  <div className="product-buy">
                    {buyLinks.map((c) => renderPurchaseButton(c, p))}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
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
              <PriceTag product={selected} now={now} />
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

    </div>
  )
}
