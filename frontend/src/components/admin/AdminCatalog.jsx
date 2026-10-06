import { useCallback, useEffect, useState } from 'react'
import { catalogApi, formatPrice } from '../../api'
import { useTenant } from '../../store/TenantContext'
import { Alert, Card, Field, Spinner } from '../ui'

const EMPTY_CAT = { name: '', description: '' }
const EMPTY_PROD = { name: '', description: '', price: '', category: '', is_active: true }

export default function AdminCatalog() {
  const { current, currentTenant, loading } = useTenant()
  const [categories, setCategories] = useState(null)
  const [products, setProducts] = useState(null)
  const [catForm, setCatForm] = useState(EMPTY_CAT)
  const [editingCat, setEditingCat] = useState(null)
  const [catEdit, setCatEdit] = useState(EMPTY_CAT)
  const [prodForm, setProdForm] = useState(EMPTY_PROD)
  const [prodFile, setProdFile] = useState(null)
  const [editingProd, setEditingProd] = useState(null)
  const [prodEdit, setProdEdit] = useState(EMPTY_PROD)
  const [prodEditFile, setProdEditFile] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const load = useCallback(() => {
    if (!current) return
    catalogApi.categories.list(current).then(setCategories).catch((e) => setError(e.message))
    catalogApi.products.list(current).then(setProducts).catch((e) => setError(e.message))
  }, [current])

  useEffect(load, [load])

  const createCategory = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await catalogApi.categories.create(current, catForm)
      setCatForm(EMPTY_CAT)
      setOk('Categoría creada.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const saveCategory = async () => {
    setError('')
    try {
      await catalogApi.categories.update(current, editingCat, catEdit)
      setEditingCat(null)
      setOk('Categoría actualizada.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const removeCategory = async (c) => {
    if (!window.confirm(`¿Eliminar "${c.name}"?`)) return
    setError('')
    try {
      await catalogApi.categories.remove(current, c.id)
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
      await catalogApi.products.create(current, payload, prodFile)
      setProdForm(EMPTY_PROD)
      setProdFile(null)
      setOk('Producto creado.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const startEditProd = (p) => {
    setEditingProd(p.id)
    setProdEdit({
      name: p.name,
      description: p.description || '',
      price: p.price,
      category: p.category || '',
      is_active: p.is_active,
    })
    setProdEditFile(null)
  }

  const saveProduct = async () => {
    setError('')
    try {
      const payload = { ...prodEdit }
      if (!payload.category) delete payload.category
      await catalogApi.products.update(current, editingProd, payload, prodEditFile)
      setEditingProd(null)
      setOk('Producto actualizado.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleActive = async (p) => {
    setError('')
    try {
      await catalogApi.products.update(current, p.id, { is_active: !p.is_active })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const removeProduct = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.name}"?`)) return
    setError('')
    try {
      await catalogApi.products.remove(current, p.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <Spinner />
  if (!currentTenant) return <Card title="Catálogo"><Alert>No tienes tiendas.</Alert></Card>

  return (
    <div className="stack">
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
            {editingCat === c.id ? (
              <div className="row-item-main">
                <input value={catEdit.name} onChange={(e) => setCatEdit({ ...catEdit, name: e.target.value })} />
                <input value={catEdit.description} onChange={(e) => setCatEdit({ ...catEdit, description: e.target.value })} />
                <span className="btn-group">
                  <button className="btn small" onClick={saveCategory}>Guardar</button>
                  <button className="btn small ghost" onClick={() => setEditingCat(null)}>Cancelar</button>
                </span>
              </div>
            ) : (
              <>
                <div className="row-item-main">
                  <b>{c.name}</b>
                  <span className="muted">{c.description}</span>
                </div>
                <span className="btn-group">
                  <button className="btn small ghost" onClick={() => { setEditingCat(c.id); setCatEdit({ name: c.name, description: c.description || '' }) }}>Editar</button>
                  <button className="btn small danger" onClick={() => removeCategory(c)}>Eliminar</button>
                </span>
              </>
            )}
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
          <label className="field">
            <span className="field-label">Activo</span>
            <input type="checkbox" checked={prodForm.is_active} onChange={(e) => setProdForm({ ...prodForm, is_active: e.target.checked })} />
          </label>
          <button className="btn">Crear producto</button>
        </form>

        {(products || []).map((p) => (
          <div className="row-item" key={p.id}>
            {editingProd === p.id ? (
              <div className="row-item-main">
                <input value={prodEdit.name} onChange={(e) => setProdEdit({ ...prodEdit, name: e.target.value })} />
                <input type="number" step="0.01" value={prodEdit.price} onChange={(e) => setProdEdit({ ...prodEdit, price: e.target.value })} />
                <select value={prodEdit.category} onChange={(e) => setProdEdit({ ...prodEdit, category: e.target.value })}>
                  <option value="">Sin categoría</option>
                  {(categories || []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input value={prodEdit.description} onChange={(e) => setProdEdit({ ...prodEdit, description: e.target.value })} />
                <input type="file" accept="image/*" onChange={(e) => setProdEditFile(e.target.files?.[0] || null)} />
                <span className="btn-group">
                  <button className="btn small" onClick={saveProduct}>Guardar</button>
                  <button className="btn small ghost" onClick={() => setEditingProd(null)}>Cancelar</button>
                </span>
              </div>
            ) : (
              <>
                <div className="row-item-main">
                  <b>{p.name}</b>
                  <span className="muted">{formatPrice(p.price)} · {p.is_active ? 'activo' : 'inactivo'}</span>
                </div>
                <span className="btn-group">
                  <button className="btn small ghost" onClick={() => toggleActive(p)}>
                    {p.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button className="btn small ghost" onClick={() => startEditProd(p)}>Editar</button>
                  <button className="btn small danger" onClick={() => removeProduct(p)}>Eliminar</button>
                </span>
              </>
            )}
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
