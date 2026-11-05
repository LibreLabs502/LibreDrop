import { useCallback, useEffect, useState } from 'react'
import { catalogApi, formatPrice } from '../../api'
import { discountPercent, hasOffer } from '../../pricing'
import { useTenant } from '../../store/TenantContext'
import { Alert, Card, Field, Spinner } from '../ui'

const EMPTY_CAT = { name: '' }
const EMPTY_PROD = {
  name: '',
  description: '',
  brand: '',
  price: '',
  discount_percent: '',
  category: '',
  is_active: true,
}

// El backend guarda hasta 5 fotos en image, image2 … image5. La primera es la
// portada que se ve en la tarjeta; el resto aparece en “Ver detalles”.
const PHOTO_FIELDS = [
  { key: 'image', label: 'Foto 1 (portada)' },
  { key: 'image2', label: 'Foto 2' },
  { key: 'image3', label: 'Foto 3' },
  { key: 'image4', label: 'Foto 4' },
  { key: 'image5', label: 'Foto 5' },
]

const EMPTY_FILES = {}

function ProductPhotos({ images = {}, files = {}, onPick }) {
  return (
    <div className="product-photos">
      {PHOTO_FIELDS.map((photo) => (
        <div className="photo-field" key={photo.key}>
          <span className="field-label">{photo.label}</span>
          {images[photo.key] && (
            <img className="photo-preview" src={images[photo.key]} alt={photo.label} />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPick(photo.key, e.target.files?.[0] || null)}
          />
          {files[photo.key] && <span className="muted photo-name">{files[photo.key].name}</span>}
        </div>
      ))}
    </div>
  )
}

// Valida la oferta antes de enviarla: el backend también la valida, pero así
// mostramos el error al instante y sin gastar una petición.
const isEmpty = (value) => value === '' || value === null || value === undefined

const offerError = (form) => {
  if (isEmpty(form.discount_percent)) return ''
  const discount = Number(form.discount_percent)
  if (!Number.isInteger(discount) || discount < 1 || discount > 99) {
    return 'El porcentaje de descuento debe ser un número entero entre 1 y 99.'
  }
  return ''
}

const offerPreview = (form) => {
  if (isEmpty(form.price) || Number(form.price) <= 0 || isEmpty(form.discount_percent) || offerError(form)) return ''
  const percent = Number(form.discount_percent)
  const discounted = Math.round(Number(form.price) * (100 - percent)) / 100
  return `Precio original: ${formatPrice(form.price)} · Descuento: ${percent}% · Precio con descuento: ${formatPrice(discounted)}`
}

export default function AdminCatalog() {
  const { current, currentTenant, loading } = useTenant()
  const [categories, setCategories] = useState(null)
  const [products, setProducts] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [catForm, setCatForm] = useState(EMPTY_CAT)
  const [editingCat, setEditingCat] = useState(null)
  const [catEdit, setCatEdit] = useState(EMPTY_CAT)
  const [prodForm, setProdForm] = useState(EMPTY_PROD)
  const [prodFiles, setProdFiles] = useState(EMPTY_FILES)
  const [editingProd, setEditingProd] = useState(null)
  const [prodEdit, setProdEdit] = useState(EMPTY_PROD)
  const [prodEditFiles, setProdEditFiles] = useState(EMPTY_FILES)
  const [prodEditImages, setProdEditImages] = useState({})
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const load = useCallback(() => {
    if (!current) return
    catalogApi.categories.list(current).then(setCategories).catch((e) => setError(e.message))
    catalogApi.products.list(current).then(setProducts).catch((e) => setError(e.message))
  }, [current])

  useEffect(load, [load])

  const filteredProducts = (products || []).filter((product) => {
    const search = productSearch.trim().toLocaleLowerCase()
    return !search || [product.name, product.brand, product.description]
      .some((value) => (value || '').toLocaleLowerCase().includes(search))
  })

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
    const problem = offerError(prodForm)
    if (problem) {
      setError(problem)
      return
    }
    try {
      const payload = { ...prodForm }
      if (!payload.category) delete payload.category
      await catalogApi.products.create(current, payload, prodFiles)
      setProdForm(EMPTY_PROD)
      setProdFiles(EMPTY_FILES)
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
      brand: p.brand || '',
      price: p.price ?? '',
      discount_percent: p.discount_percent ?? '',
      category: p.category || '',
      is_active: p.is_active,
    })
    setProdEditFiles(EMPTY_FILES)
    setProdEditImages(
      Object.fromEntries(PHOTO_FIELDS.map((photo) => [photo.key, p[photo.key] || ''])),
    )
  }

  const saveProduct = async () => {
    setError('')
    const problem = offerError(prodEdit)
    if (problem) {
      setError(problem)
      return
    }
    try {
      const payload = { ...prodEdit }
      if (!payload.category) delete payload.category
      await catalogApi.products.update(current, editingProd, payload, prodEditFiles)
      setEditingProd(null)
      setProdEditFiles(EMPTY_FILES)
      setProdEditImages({})
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
          <button className="btn">Agregar</button>
        </form>
        {(categories || []).map((c) => (
          <div className="row-item" key={c.id}>
            {editingCat === c.id ? (
              <div className="row-item-main">
                <input value={catEdit.name} onChange={(e) => setCatEdit({ ...catEdit, name: e.target.value })} />
                <span className="btn-group">
                  <button className="btn small" onClick={saveCategory}>Guardar</button>
                  <button className="btn small ghost" onClick={() => setEditingCat(null)}>Cancelar</button>
                </span>
              </div>
            ) : (
              <>
                <div className="row-item-main">
                  <b>{c.name}</b>
                </div>
                <span className="btn-group">
                  <button className="btn small ghost" onClick={() => { setEditingCat(c.id); setCatEdit({ name: c.name }) }}>Editar</button>
                  <button className="btn small danger" onClick={() => removeCategory(c)}>Eliminar</button>
                </span>
              </>
            )}
          </div>
        ))}
      </Card>

      <Card title={`Productos (${filteredProducts.length}${productSearch ? ` de ${(products || []).length}` : ''})`}>
        <form onSubmit={createProduct} className="grid2">
          <Field label="Nombre *">
            <input value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} />
          </Field>
          <Field label="Marca">
            <input value={prodForm.brand} onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })} />
          </Field>
          <Field label="Precio" hint="Dejalo vacío si el producto no tiene precio.">
            <input
              type="number"
              step="0.01"
              placeholder="Sin precio"
              value={prodForm.price}
              onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
            />
          </Field>
          <Field label="% de descuento" hint="Ingresá un número entero entre 1 y 99.">
            <input
              type="number"
              step="1"
              min="1"
              max="99"
              placeholder="Sin oferta"
              value={prodForm.discount_percent}
              onChange={(e) => setProdForm({ ...prodForm, discount_percent: e.target.value })}
            />
            {offerPreview(prodForm) && <span className="field-hint">{offerPreview(prodForm)}</span>}
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
          <div className="field photo-field-wide">
            <span className="field-label">Fotos (hasta 5)</span>
            <span className="field-hint">La primera foto es la portada. Las demás se ven en “Ver detalles”.</span>
            <ProductPhotos
              files={prodFiles}
              onPick={(key, file) => setProdFiles((prev) => ({ ...prev, [key]: file }))}
            />
          </div>
          <label className="field">
            <span className="field-label">Activo</span>
            <input type="checkbox" checked={prodForm.is_active} onChange={(e) => setProdForm({ ...prodForm, is_active: e.target.checked })} />
          </label>
          <button className="btn">Crear producto</button>
        </form>

        <Field label="Buscar producto">
          <input
            type="search"
            placeholder="Buscar por nombre, marca o descripción…"
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
          />
        </Field>
        {productSearch && filteredProducts.length === 0 && <p className="muted">No se encontraron productos.</p>}
        {filteredProducts.map((p) => (
          <div className="row-item" key={p.id}>
            {editingProd === p.id ? (
              <div className="row-item-main product-edit">
                <div className="grid2">
                  <Field label="Nombre *">
                    <input value={prodEdit.name} onChange={(e) => setProdEdit({ ...prodEdit, name: e.target.value })} />
                  </Field>
                  <Field label="Marca">
                    <input value={prodEdit.brand} onChange={(e) => setProdEdit({ ...prodEdit, brand: e.target.value })} />
                  </Field>
                  <Field label="Precio" hint="Dejalo vacío si el producto no tiene precio.">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Sin precio"
                      value={prodEdit.price}
                      onChange={(e) => setProdEdit({ ...prodEdit, price: e.target.value })}
                    />
                  </Field>
                  <Field label="% de descuento" hint="Ingresá un número entero entre 1 y 99.">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="99"
                      placeholder="Sin oferta"
                      value={prodEdit.discount_percent}
                      onChange={(e) => setProdEdit({ ...prodEdit, discount_percent: e.target.value })}
                    />
                    {offerPreview(prodEdit) && <span className="field-hint">{offerPreview(prodEdit)}</span>}
                  </Field>

                  <Field label="Categoría">
                    <select value={prodEdit.category} onChange={(e) => setProdEdit({ ...prodEdit, category: e.target.value })}>
                      <option value="">Sin categoría</option>
                      {(categories || []).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Descripción">
                    <input value={prodEdit.description} onChange={(e) => setProdEdit({ ...prodEdit, description: e.target.value })} />
                  </Field>
                  <div className="field photo-field-wide">
                    <span className="field-label">Fotos (hasta 5)</span>
                    <span className="field-hint">Podés reemplazar una foto eligiendo un archivo nuevo en su lugar.</span>
                    <ProductPhotos
                      images={prodEditImages}
                      files={prodEditFiles}
                      onPick={(key, file) => setProdEditFiles((prev) => ({ ...prev, [key]: file }))}
                    />
                  </div>
                  <label className="field">
                    <span className="field-label">Activo</span>
                    <input type="checkbox" checked={prodEdit.is_active} onChange={(e) => setProdEdit({ ...prodEdit, is_active: e.target.checked })} />
                  </label>
                  <span className="btn-group">
                    <button className="btn small" onClick={saveProduct}>Guardar</button>
                    <button className="btn small ghost" onClick={() => setEditingProd(null)}>Cancelar</button>
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="row-item-main">
                  <b>{p.name}</b>
                  <span className="muted">
                    {[
                      p.brand,
                      hasOffer(p) && formatPrice(p.price) ? `Precio original: ${formatPrice(p.price)}` : null,
                      hasOffer(p) ? `Descuento: ${discountPercent(p)}%` : null,
                      hasOffer(p) && formatPrice(p.price)
                        ? `Precio con descuento: ${formatPrice(Math.round(Number(p.price) * (100 - discountPercent(p)) / 100 * 100) / 100)}`
                        : !hasOffer(p) ? formatPrice(p.price) : null,
                      p.is_active ? 'activo' : 'inactivo',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
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
