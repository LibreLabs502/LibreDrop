import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { catalogApi, storeApi } from '../api'
import PlatformLanding from '../components/storefront/PlatformLanding'
import StoreHeader from '../components/storefront/StoreHeader'
import ProductCard from '../components/storefront/ProductCard'
import ProductModal from '../components/storefront/ProductModal'

export default function Storefront() {
  const [store, setStore] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const info = await storeApi.info()
        if (!alive) return
        setStore(info)
      } catch {
        if (alive) setStore(false)
        return
      }
      try {
        const [cats, prods] = await Promise.all([
          catalogApi.categories.list(),
          catalogApi.products.list(),
        ])
        if (!alive) return
        setCategories(cats)
        setProducts(prods)
      } catch (e) {
        if (alive) {
          setProducts([])
          setError(`No se pudo cargar el catálogo: ${e.message}`)
        }
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  if (store === null) {
    return <div className="page-load">Cargando tienda…</div>
  }

  if (!store) {
    return <PlatformLanding />
  }

  const q = query.trim().toLowerCase()
  const visible = products.filter((p) => {
    const matchCategory = category === 'all' || p.category === category
    const matchQuery = !q || p.name.toLowerCase().includes(q)
    return matchCategory && matchQuery
  })

  return (
    <div className="store">
      <StoreHeader store={store} />

      <main className="store-main">
        <div className="catalog-toolbar">
          <div className="category-chips">
            <button className={`chip ${category === 'all' ? 'active' : ''}`} onClick={() => setCategory('all')}>
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={`chip ${category === c.id ? 'active' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
          <input
            className="search-input"
            type="search"
            placeholder="Buscar productos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {error && <div className="alert">{error}</div>}

        {visible.length === 0 ? (
          <p className="muted store-empty">
            No hay productos que coincidan. {products.length === 0 ? 'La tienda aún no publica productos.' : ''}
          </p>
        ) : (
          <div className="product-grid">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} store={store} onSelect={setSelected} />
            ))}
          </div>
        )}
      </main>

      <footer className="store-footer">
        <span>
          Creado con <Link to="/admin">LibreDrop</Link>
        </span>
      </footer>

      <ProductModal product={selected} store={store} onClose={() => setSelected(null)} />
    </div>
  )
}