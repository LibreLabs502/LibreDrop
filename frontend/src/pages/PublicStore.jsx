import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatPrice, storefrontApi } from '../api'
import { buildPurchaseLinks, waLink, ICONS } from '../channels'
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

const readStoredCart = (slug) => {
  if (!slug || typeof window === 'undefined') return []
  try {
    const saved = JSON.parse(window.localStorage.getItem(`libredrop_cart_${slug}`) || '[]')
    if (!Array.isArray(saved)) return []
    return saved
      .filter((item) => item && item.productId !== undefined && Number.isFinite(Number(item.quantity)))
      .map((item) => ({ productId: String(item.productId), quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity)))) }))
  } catch {
    return []
  }
}

const cartOrderMessage = (store, lines) => {
  const items = lines.map(({ product, quantity, unitPrice }) =>
    `• ${quantity} × ${product.name}${unitPrice === null ? '' : ` — ${formatPrice(unitPrice)} c/u`}`,
  )
  const allItemsHavePrice = lines.every((line) => line.unitPrice !== null)
  const total = lines.reduce((sum, line) => sum + (line.unitPrice === null ? 0 : line.unitPrice * line.quantity), 0)
  const subtotal = allItemsHavePrice ? `\nSubtotal: ${formatPrice(total)}` : ''
  return `Hola ${store?.name || ''}, quiero realizar este pedido:\n${items.join('\n')}${subtotal}`
}

function CartIcon({ size = 19 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L20.5 8H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="19.5" r="1.2" fill="currentColor" />
      <circle cx="17.5" cy="19.5" r="1.2" fill="currentColor" />
    </svg>
  )
}

function PriceTag({ product, now = Date.now() }) {
  if (hasOffer(product, now)) {
    const percent = discountPercent(product, now)
    const oldPrice = formatPrice(product.price)
    const offerPrice = formatPrice(effectivePrice(product, now))
    const countdown = offerCountdown(product, now)
    return (
      <div className="product-price-row offer-price-list">
        {oldPrice && <div className="product-price-line product-price-old">Precio original: {oldPrice}</div>}
        <div className="product-price-line">
          <span className="product-offer-badge">
            {percent > 0 ? `Descuento: ${percent}%` : 'Oferta'}
          </span>
        </div>
        {offerPrice && (
          <div className="product-price-line product-discounted-price">
            <span className="product-price-label">Precio con descuento:</span>
            <span className="product-price">{offerPrice}</span>
          </div>
        )}
        {countdown && <div className="product-price-line product-offer-countdown">Termina en {countdown}</div>}
      </div>
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

function StoreHeroCarousel({ products, eyebrow, title, store, now, canPurchase, onAddToCart, onOpen }) {
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
            {canPurchase && <button type="button" className="btn-buy store-add-to-cart" onClick={() => onAddToCart(product)}><CartIcon size={17} />Agregar al carrito</button>}
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
  const [cartState, setCartState] = useState(() => ({ slug, items: readStoredCart(slug) }))
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const cartItems = cartState.slug === slug ? cartState.items : []

  useEffect(() => {
    if (cartState.slug !== slug) setCartState({ slug, items: readStoredCart(slug) })
  }, [slug, cartState.slug])

  useEffect(() => {
    if (!slug || cartState.slug !== slug) return
    try {
      window.localStorage.setItem(`libredrop_cart_${slug}`, JSON.stringify(cartState.items))
    } catch {
      // El carrito sigue funcionando en memoria si el navegador bloquea storage.
    }
  }, [cartState, slug])

  const updateCartItems = (update) => {
    setCartState((current) => {
      const items = current.slug === slug ? current.items : []
      return { slug, items: update(items) }
    })
  }

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
  const cartLines = useMemo(() => {
    if (!store) return []
    return cartItems
      .map((item) => {
        const product = store.products.find((candidate) => String(candidate.id) === item.productId)
        if (!product) return null
        return { product, quantity: item.quantity, unitPrice: effectivePrice(product, now) }
      })
      .filter(Boolean)
  }, [store, cartItems, now])
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cartLines.reduce((total, line) => total + (line.unitPrice === null ? 0 : line.unitPrice * line.quantity), 0)
  const cartHasUnpricedProduct = cartLines.some((line) => line.unitPrice === null)
  const cartMessage = cartLines.length ? cartOrderMessage(store, cartLines) : ''
  const cartChannelLinks = cartLines.length ? buildPurchaseLinks(store, cartMessage) : []
  const hasPurchaseChannels = buildPurchaseLinks(store, 'pedido').length > 0

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

  const addToCart = (product) => {
    updateCartItems((items) => {
      const existing = items.find((item) => item.productId === String(product.id))
      if (existing) {
        return items.map((item) => item.productId === String(product.id)
          ? { ...item, quantity: Math.min(99, item.quantity + 1) }
          : item)
      }
      return [...items, { productId: String(product.id), quantity: 1 }]
    })
    setSelected(null)
  }

  const changeCartQuantity = (productId, quantity) => {
    updateCartItems((items) => items.map((item) => item.productId === String(productId)
      ? { ...item, quantity: Math.max(1, Math.min(99, quantity)) }
      : item))
  }

  const removeFromCart = (productId) => {
    updateCartItems((items) => items.filter((item) => item.productId !== String(productId)))
  }

  const openOrder = (channel) => {
    const message = cartMessage
    setCheckoutOpen(false)
    if (channel.key === 'whatsapp') {
      window.open(channel.href, '_blank', 'noopener,noreferrer')
      return
    }
    setOrder({ channel, message, copied: null })
    // Aprovechamos el clic del usuario para copiar automáticamente. Si el
    // navegador lo bloquea, el modal muestra el botón para copiar a mano.
    copyText(message).then((copied) => {
      setOrder((prev) =>
        prev && prev.channel.key === channel.key ? { ...prev, copied } : prev,
      )
    })
  }

  const copyOrder = () => {
    if (!order) return
    copyText(order.message).then((copied) => {
      setOrder((prev) => (prev ? { ...prev, copied } : prev))
    })
  }

  const renderAddToCartButton = (product) => (
    <button type="button" className="btn-buy store-add-to-cart" onClick={() => addToCart(product)}>
      <CartIcon size={17} />Agregar al carrito
    </button>
  )

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
  const maxNavCategoryCharacters = 18
  const useCompactNav = store.categories.some((item) => item.name.trim().length > maxNavCategoryCharacters)
  const shortCategoryNavItems = store.categories
    .filter((item) => item.name.trim().length <= maxNavCategoryCharacters)
    .map((item) => ({ label: item.name, type: 'category', value: item.id }))
  const topNavItems = useCompactNav
    ? [{ label: 'Inicio', type: 'home' }, ...shortCategoryNavItems]
    : store.categories.slice(0, 4).map((item) => ({ label: item.name, type: 'category', value: item.id }))
  if (!useCompactNav && topNavItems.length < 4) {
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
                  if (item.type === 'home') {
                    chooseCategory('all')
                    setQuery('')
                    setSearchOpen(false)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  } else if (item.type === 'category') {
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
          <button
            type="button"
            className="store-cart-toggle"
            onClick={() => { setSearchOpen(false); setQuery(''); setCartOpen(true) }}
            aria-label={`Abrir carrito, ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}`}
            aria-haspopup="dialog"
          >
            <CartIcon />
            <span>Carrito</span>
            {cartCount > 0 && <span className="store-cart-count" aria-live="polite">{cartCount > 99 ? '99+' : cartCount}</span>}
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

      {cartOpen && (
        <div className="store-cart-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false) }}>
          <aside className="store-cart-drawer" role="dialog" aria-modal="true" aria-labelledby="store-cart-title">
            <header className="store-cart-head">
              <div>
                <span className="store-section-eyebrow">TU SELECCIÓN</span>
                <h2 id="store-cart-title">Tu carrito <span>{cartCount}</span></h2>
              </div>
              <button type="button" className="store-cart-close" onClick={() => setCartOpen(false)} aria-label="Cerrar carrito">×</button>
            </header>
            {cartLines.length === 0 ? (
              <div className="store-cart-empty">
                <span className="store-cart-empty-icon"><CartIcon size={28} /></span>
                <h3>Tu carrito está vacío</h3>
                <p>Agregá los productos que te gusten y aparecerán acá.</p>
                <button type="button" className="btn-buy store-cart-continue" onClick={() => setCartOpen(false)}>Seguir explorando</button>
              </div>
            ) : (
              <>
                <div className="store-cart-lines">
                  {cartLines.map(({ product, quantity, unitPrice }) => (
                    <article className="store-cart-line" key={product.id}>
                      {productImages(product)[0]
                        ? <img src={productImages(product)[0]} alt="" />
                        : <span className="store-cart-line-placeholder" aria-hidden="true" />}
                      <div className="store-cart-line-info">
                        <b>{product.name}</b>
                        <span>{unitPrice === null ? 'Precio a consultar' : formatPrice(unitPrice)}</span>
                        <div className="store-cart-quantity" aria-label={`Cantidad de ${product.name}`}>
                          <button type="button" onClick={() => quantity === 1 ? removeFromCart(product.id) : changeCartQuantity(product.id, quantity - 1)} aria-label={quantity === 1 ? `Quitar ${product.name}` : `Reducir cantidad de ${product.name}`}>{quantity === 1 ? '−' : '−'}</button>
                          <span>{quantity}</span>
                          <button type="button" onClick={() => changeCartQuantity(product.id, quantity + 1)} aria-label={`Aumentar cantidad de ${product.name}`}>+</button>
                        </div>
                      </div>
                      <button type="button" className="store-cart-remove" onClick={() => removeFromCart(product.id)} aria-label={`Eliminar ${product.name} del carrito`}>×</button>
                    </article>
                  ))}
                </div>
                <footer className="store-cart-foot">
                  <div className="store-cart-total">
                    <span>{cartHasUnpricedProduct ? 'Subtotal parcial' : 'Subtotal'}</span>
                    <b>{cartLines.some((line) => line.unitPrice !== null) ? formatPrice(cartTotal) : 'A consultar'}</b>
                  </div>
                  {cartHasUnpricedProduct && <p>Hay productos sin precio publicado; se confirmará el total por mensaje.</p>}
                  <button type="button" className="btn-buy store-cart-checkout" onClick={() => { setCartOpen(false); setCheckoutOpen(true) }} disabled={!cartChannelLinks.length}>
                    Continuar con el pedido
                  </button>
                  {!cartChannelLinks.length && <p>Esta tienda todavía no tiene un canal de compra configurado.</p>}
                </footer>
              </>
            )}
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className="store-checkout-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCheckoutOpen(false) }}>
          <section className="store-checkout-card" role="dialog" aria-modal="true" aria-labelledby="store-checkout-title">
            <button type="button" className="store-cart-close store-checkout-close" onClick={() => setCheckoutOpen(false)} aria-label="Cerrar">×</button>
            <div className="store-checkout-brand">
              {store.logo
                ? <img src={store.logo} alt="" />
                : <span className="store-checkout-logo-fallback">{String(store.name || 'T')[0].toUpperCase()}</span>}
              <span>{store.name}</span>
            </div>
            <p className="store-checkout-kicker">Tu pedido está listo</p>
            <h2 id="store-checkout-title">¿Por qué medio querés enviarlo?</h2>
            <p className="store-checkout-summary">{cartCount} {cartCount === 1 ? 'producto' : 'productos'} · {cartLines.some((line) => line.unitPrice !== null) ? formatPrice(cartTotal) : 'total a consultar'}</p>
            <div className="store-checkout-channels">
              {cartChannelLinks.map((channel) => (
                <button type="button" key={channel.key} className={`store-checkout-channel ${channel.key}`} onClick={() => openOrder(channel)}>
                  <svg viewBox={channel.viewBox} width="20" height="20" fill="currentColor" aria-hidden="true"><path d={channel.icon} /></svg>
                  <span>Enviar por {channel.label}</span>
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <button type="button" className="store-checkout-back" onClick={() => { setCheckoutOpen(false); setCartOpen(true) }}>Volver al carrito</button>
          </section>
        </div>
      )}

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
            canPurchase={hasPurchaseChannels}
            onAddToCart={addToCart}
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
                {hasPurchaseChannels && (
                  <div className="product-buy">
                    {renderAddToCartButton(p)}
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
              {hasPurchaseChannels && renderAddToCartButton(selected)}
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
