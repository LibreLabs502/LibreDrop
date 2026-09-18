import { useEffect, useState } from 'react'
import { catalogApi } from '../../api'
import { Alert, Card, Field, Row, Spinner } from '../ui'

const EMPTY_CAT = { name: '', description: '' }
const EMPTY_PROD = { name: '', description: '', price: '', category: '' }

function CategoryManager({ onChanged }) {
  const [list, setList] = useState(null)
  const [form, setForm] = useState(EMPTY_CAT)
  const [editing, setEditing] = useState(null)
  const [ed, setEd] = useState(EMPTY_CAT)
  const [error, setError] = useState('')

  const load = () => {
    catalogApi.categories
      .list()
      .then((data) => {
        setList(data)
        if (typeof onChanged === 'function') onChanged(data)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(load, [])

  const create = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await catalogApi.categories.create(form)
      setForm(EMPTY_CAT)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (c) => {
    setEditing(c.id)
    setEd({ name: c.name, description: c.description })
  }

  const save = async () => {
    setError('')
    try {
      await catalogApi.categories.update(editing, ed)
      setEditing(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (c) => {
    if (!window.confirm(`¿Eliminar la categoría "${c.name}"? Sus productos también se eliminarán.`)) return
    setError('')
    try {
      await catalogApi.categories.remove(c.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (list === null) return <Spinner />

  return (
    <Card title={`Categorías (${list.length})`}>
      <form onSubmit={create} className="row add-row">
        <Field label="Nueva categoría">
          <input value={form.name} placeholder="Nombre *" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Descripción">
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <button className="btn">Agregar</button>
      </form>
      <Alert>{error}</Alert>
      {list.length === 0 && <p className="muted">No hay categorías.</p>}
      {list.map((c) => (
        <div className="row-item" key={c.id}>
          {editing === c.id ? (
            <Row>
              <Field label="Nombre">
                <input value={ed.name} onChange={(e) => setEd({ ...ed, name: e.target.value })} />
              </Field>
              <Field label="Descripción">
                <input value={ed.description} onChange={(e) => setEd({ ...ed, description: e.target.value })} />
              </Field>
              <button className="btn" onClick={save}>Guardar</button>
              <button className="btn ghost" onClick={() => setEditing(null)}>Cancelar</button>
            </Row>
          ) : (
            <>
              <div className="row-item-main">
                <b>{c.name}</b>
                <span className="muted">{c.description || 'Sin descripción'}</span>
              </div>
              <span className="btn-group">
                <button className="btn small" onClick={() => startEdit(c)}>Editar</button>
                <button className="btn small danger" onClick={() => remove(c)}>Eliminar</button>
              </span>
            </>
          )}
        </div>
      ))}
    </Card>
  )
}

function ProductManager({ categories }) {
  const [list, setList] = useState(null)
  const [form, setForm] = useState(EMPTY_PROD)
  const [editId, setEditId] = useState(null)
  const [edit, setEdit] = useState(EMPTY_PROD)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const categoryName = (id) => {
    const c = (categories || []).find((c) => c.id === id)
    return c ? c.name : `#${id}`
  }

  const load = () => {
    catalogApi.products.list().then(setList).catch((err) => setError(err.message))
  }

  useEffect(load, [])

  useEffect(() => {
    if (categories && categories.length > 0 && !form.category) {
      setForm((f) => ({ ...f, category: categories[0].id }))
    }
  }, [categories])

  const resetFile = (e) => {
    setFile(e.target.files[0] || null)
    e.target.value = ''
  }

  const create = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    try {
      await catalogApi.products.create(
        { name: form.name, description: form.description, price: form.price, category: Number(form.category) },
        file,
      )
      setForm({ ...EMPTY_PROD, category: categories?.[0]?.id || '' })
      setFile(null)
      setOk('Producto publicado.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (p) => {
    setEditId(p.id)
    setEdit({ name: p.name, description: p.description, price: p.price, category: p.category })
    setFile(null)
  }

  const save = async () => {
    setError('')
    setOk('')
    try {
      await catalogApi.products.update(
        editId,
        { name: edit.name, description: edit.description, price: edit.price, category: Number(edit.category) },
        file,
      )
      setEditId(null)
      setFile(null)
      setOk('Producto actualizado.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (p) => {
    if (!window.confirm(`¿Eliminar el producto "${p.name}"?`)) return
    setError('')
    try {
      await catalogApi.products.remove(p.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (list === null) return <Spinner />

  const hasCategories = (categories || []).length > 0

  return (
    <Card title={`Productos (${list.length})`}>
      <form onSubmit={create} className="grid2">
        <Field label="Nombre *">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Precio (Q) *">
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </Field>
        <Field label="Categoría *">
          <select
            value={form.category}
            disabled={!hasCategories}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">{hasCategories ? '— selecciona —' : 'Crea una categoría primero'}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Imagen (opcional, requiere Cloudinary)">
          <input type="file" accept="image/*" onChange={resetFile} />
        </Field>
        <Field label="Descripción">
          <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="row align-end">
          <button className="btn">Publicar producto</button>
        </div>
      </form>

      <div className="stack small">
        <Alert kind="ok">{ok}</Alert>
        <Alert>{error}</Alert>
      </div>

      {list.length === 0 && <p className="muted">No hay productos.</p>}
      {list.map((p) => (
        <div className="row-item" key={p.id}>
          {editId === p.id ? (
            <div className="stack small">
              <Row>
                <Field label="Nombre">
                  <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                </Field>
                <Field label="Precio (Q)">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={edit.price}
                    onChange={(e) => setEdit({ ...edit, price: e.target.value })}
                  />
                </Field>
                <Field label="Categoría">
                  <select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>
                    <option value="">— selecciona —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
              </Row>
              <Row>
                <Field label="Nueva imagen (dejar vacío conserva la actual)">
                  <input type="file" accept="image/*" onChange={resetFile} />
                </Field>
                <button className="btn" onClick={save}>Guardar</button>
                <button className="btn ghost" onClick={() => setEditId(null)}>Cancelar</button>
              </Row>
            </div>
          ) : (
            <>
              <div className="row-item-main">
                <b>{p.name}</b>
                <span className="muted">
                  Q {p.price} · {categoryName(p.category)}
                  {p.description ? ` · ${p.description}` : ''}
                </span>
                {p.image && <span className="chip">con imagen</span>}
              </div>
              <span className="btn-group">
                <button className="btn small" onClick={() => startEdit(p)}>Editar</button>
                <button className="btn small danger" onClick={() => remove(p)}>Eliminar</button>
              </span>
            </>
          )}
        </div>
      ))}
    </Card>
  )
}

export default function AdminCatalog() {
  const [categories, setCategories] = useState([])

  return (
    <div className="stack">
      <CategoryManager onChanged={setCategories} />
      <ProductManager categories={categories} />
    </div>
  )
}