import { useEffect, useState } from 'react'
import { catalogApi, formatPrice, tenantsApi } from '../../api'
import { Alert, Card, Field, Spinner } from '../ui'

const EMPTY_CAT = { name: '', description: '' }
const EMPTY_PROD = { name: '', description: '', price: '', category: '', is_active: true }

export default function AdminCatalog() {
  const [stores, setStores] = useState(null)
  const [tenantId, setTenantId] = useState('')
  const [categories, setCategories] = useState(null)
  const [products, setProducts] = useState(null)
  const [catForm, setCatForm] = useState(EMPTY_CAT)
  const [prodForm, setProdForm] = useState(EMPTY_PROD)
  const [prodFile, setProdFile] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    tenantsApi
      .list()
      .then((s) => {
        setStores(s)
        if (s.length > 0) setTenantId(String(s[0].id))
      })
      .catch((e) => setError(e.message))
  }, [])

  const load = () => {
    if (!tenantId) return
    catalogApi.categories
      .list(tenantId)
      .then(setCategories)
      .catch((e) => setError(e.message))
    catalogApi.products
      .list(tenantId)
      .then(setProducts)
      .catch((e) => setError(e.message))
  }

  useEffect(load, [tenantId])

  const createCategory = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await catalogApi.categories.create(tenantId, catForm)
      setCatForm(EMPTY_CAT)
      setOk('Categoría creada.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const removeCategory = async (c) => {
    if (!window.confirm(`¿Eliminar "${c.name}"?`)) return
    setError('')
    try {
      await catalogApi.categories.remove(tenantId, c.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const createProduct = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...prodForm }
      if (!payload.category) delete payload.category
      await catalogApi.products.create(tenantId, payload, prodFile)
      setProdForm(EMPTY_PROD)
      setProdFile(null)
      setOk('Producto creado.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const removeProduct = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.name}"?`)) return
    setError('')
    try {
      await catalogApi.products.remove(tenantId, p.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (stores === null) return <Spinner />

  return (
    <div className="stack">
      <Card title="Tienda">
        <Field label="Selecciona tienda">
          <select value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
            {stores.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
      </Card>

      <Card title={`Categorías (${(categories || []).length})`}>
        <form onSubmit={createCategory} className="row add-row">
          <Field label="Nombre *">
            <input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
          </Field>
          <Field label="Descripción">
            <input value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
          </Field>
          <button className="btn">Agregar</button>
        </form>
        {(categories || []).map((c) => (
          <div className="row-item" key={c.id}>
            <div className="row-item-main">
              <b>{c.name}</b>
              <span className="muted">{c.description}</span>
            </div>
            <button className="btn small danger" onClick={() => removeCategory(c)}>Eliminar</button>
          </div>
        ))}
      </Card>

      <Card title={`Productos (${(products || []).length})`}>
        <form onSubmit={createProduct} className="grid2">
          <Field label="Nombre *">
            <input value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} />
          </Field>
          <Field label="Precio *">
            <input type="number" step="0.01" value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })} />
          </Field>
          <Field label="Categoría">
            <select value={prodForm.category} onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}>
              <option value="">Sin categoría</option>
              {(categories || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Descripción">
            <input value={prodForm.description} onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })} />
          </Field>
          <Field label="Imagen">
            <input type="file" accept="image/*" onChange={(e) => setProdFile(e.target.files?.[0] || null)} />
          </Field>
          <button className="btn">Crear producto</button>
        </form>
        {(products || []).map((p) => (
          <div className="row-item" key={p.id}>
            <div className="row-item-main">
              <b>{p.name}</b>
              <span className="muted">{formatPrice(p.price)} · {p.is_active ? 'activo' : 'inactivo'}</span>
            </div>
            <button className="btn small danger" onClick={() => removeProduct(p)}>Eliminar</button>
          </div>
        ))}
      </Card>

      <div className="stack small">
        <Alert kind="ok">{ok}</Alert>
        <Alert>{error}</Alert>
      </div>
    </div>
  )
}
