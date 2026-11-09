import { useCallback, useEffect, useState } from 'react'
import { catalogApi, formatPrice } from '../../api'
import { discountPercent, hasOffer } from '../../pricing'
import { useTenant } from '../../store/TenantContext'
import { Alert, Card, Field, Spinner } from '../ui'

const EMPTY_CAT = { name: '' }

// El backend guarda hasta 5 fotos en image, image2 … image5. El orden visible
// se guarda aparte en `photo_order`; la primera del orden es la portada.
const PHOTO_FIELDS = [
  { key: 'image', label: 'Foto 1' },
  { key: 'image2', label: 'Foto 2' },
  { key: 'image3', label: 'Foto 3' },
  { key: 'image4', label: 'Foto 4' },
  { key: 'image5', label: 'Foto 5' },
]

const PHOTO_KEYS = PHOTO_FIELDS.map((photo) => photo.key)

const EMPTY_PROD = {
  name: '',
  description: '',
  brand: '',
  price: '',
  sales_price: '',
  discount_percent: '',
  offer_ends_at: '',
  category: '',
  seasonal_category: '',
  is_active: true,
  featured: false,
  photo_order: PHOTO_KEYS,
}

// datetime-local usa la hora local y no incluye zona horaria. Convertimos en
// ambos sentidos para que el valor que viaja al backend sea un ISO completo.
const toDateTimeInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

const fromDateTimeInput = (value) => (value ? new Date(value).toISOString() : '')

const photoOrder = (product) =>
  Array.isArray(product?.photo_order) && product.photo_order.length
    ? PHOTO_KEYS.filter((key) => product.photo_order.includes(key)).concat(
        PHOTO_KEYS.filter((key) => !product.photo_order.includes(key)),
      )
    : PHOTO_KEYS

const EMPTY_FILES = {}

function ProductPhotos({ images = {}, files = {}, order = PHOTO_KEYS, onPick }) {
  const fields = order
    .map((key) => PHOTO_FIELDS.find((photo) => photo.key === key))
    .filter(Boolean)

  return (
    <div className="product-photos">
      {fields.map((photo, index) => (
        <div className="photo-field" key={photo.key}>
          <span className="field-label">
            {index === 0 ? 'Foto 1 (portada)' : `Foto ${index + 1}`}
          </span>
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

function ToggleSwitch({ checked, onChange, label, disabled = false }) {
  return (
    <label className={`switch catalog-switch${disabled ? ' disabled' : ''}`}>
      <span>{label}</span>
      <input type="checkbox" checked={!!checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="switch-track"><span className="switch-thumb" /></span>
    </label>
  )
}

function EditModal({ title, children, onClose, onSubmit, wide = false }) {
  return (
    <div className="modal-backdrop catalog-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className={`modal catalog-edit-modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        <form onSubmit={onSubmit} className="catalog-modal-form">
          <header className="catalog-modal-heading"><span>Editar catálogo</span><h2>{title}</h2></header>
          {children}
        </form>
      </section>
    </div>
  )
}

// Valida la oferta antes de enviarla: el backend también la valida, pero así
// mostramos el error al instante y sin gastar una petición.
const isEmpty = (value) => value === '' || value === null || value === undefined

const offerError = (form) => {
  const hasPrice = !isEmpty(form.price)
  const hasSalesPrice = !isEmpty(form.sales_price)
  const hasDiscount = !isEmpty(form.discount_percent)
  const hasEnd = !isEmpty(form.offer_ends_at)
  const price = Number(form.price)
  const salesPrice = Number(form.sales_price)
  const discount = Number(form.discount_percent)

  if (hasSalesPrice) {
    if (!Number.isFinite(salesPrice) || salesPrice <= 0) {
      return 'El precio de oferta debe ser mayor que cero.'
    }
    if (hasPrice && (!Number.isFinite(price) || salesPrice >= price)) {
      return 'El precio de oferta debe ser menor que el precio normal.'
    }
  }

  if (hasDiscount) {
    if (!hasSalesPrice) {
      return 'Para usar un porcentaje de descuento, primero poné un precio de oferta.'
    }
    if (!Number.isInteger(discount) || discount < 1 || discount > 99) {
      return 'El porcentaje de descuento debe ser un número entero entre 1 y 99.'
    }
  }

  if (hasEnd && !hasSalesPrice) {
    return 'Para programar el fin de la oferta, primero poné un precio de oferta.'
  }

  return ''
}

const offerPreview = (form) => {
  if (isEmpty(form.sales_price) || offerError(form)) return ''
  const parts = []
  if (!isEmpty(form.price) && Number(form.price) > 0) {
    const percent = Math.round((1 - Number(form.sales_price) / Number(form.price)) * 100)
    parts.push(`Precio original: ${formatPrice(form.price)}`)
    if (percent > 0) parts.push(`Descuento: ${percent}%`)
  } else if (!isEmpty(form.discount_percent)) {
    parts.push(`Descuento: ${Number(form.discount_percent)}%`)
  }
  parts.push(`Precio con descuento: ${formatPrice(form.sales_price)}`)
  if (!isEmpty(form.offer_ends_at)) {
    const end = new Date(form.offer_ends_at)
    if (!Number.isNaN(end.getTime())) {
      parts.push(`Termina: ${end.toLocaleString()}`)
    }
  }
  return parts.join(' · ')
}

const productPayload = (form) => {
  const payload = { ...form }
  if (!payload.category) delete payload.category
  if (!payload.seasonal_category) delete payload.seasonal_category
  payload.offer_ends_at = fromDateTimeInput(payload.offer_ends_at)
  if (!Array.isArray(payload.photo_order) || payload.photo_order.length === 0) {
    payload.photo_order = PHOTO_KEYS
  }
  return payload
}

export default function AdminCatalog() {
  const { current, currentTenant, loading } = useTenant()
  const [categories, setCategories] = useState(null)
  const [seasonalCategories, setSeasonalCategories] = useState([])
  const [products, setProducts] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [catForm, setCatForm] = useState(EMPTY_CAT)
  const [editingCat, setEditingCat] = useState(null)
  const [catEdit, setCatEdit] = useState(EMPTY_CAT)
  const [seasonalCatForm, setSeasonalCatForm] = useState(EMPTY_CAT)
  const [editingSeasonalCat, setEditingSeasonalCat] = useState(null)
  const [seasonalCatEdit, setSeasonalCatEdit] = useState(EMPTY_CAT)
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
    catalogApi.seasonalCategories.list(current).then(setSeasonalCategories).catch((e) => setError(e.message))
    catalogApi.products.list(current).then(setProducts).catch((e) => setError(e.message))
  }, [current])

  useEffect(load, [load])

  useEffect(() => {
    if (editingCat === null && editingSeasonalCat === null && editingProd === null) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setEditingCat(null)
        setEditingSeasonalCat(null)
        setEditingProd(null)
        setError('')
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [editingCat, editingSeasonalCat, editingProd])

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

  const createSeasonalCategory = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await catalogApi.seasonalCategories.create(current, seasonalCatForm)
      setSeasonalCatForm(EMPTY_CAT)
      setOk('Categoría de temporada creada.')
      load()
    } catch (err) { setError(err.message) }
  }

  const saveSeasonalCategory = async () => {
    setError('')
    try {
      await catalogApi.seasonalCategories.update(current, editingSeasonalCat, seasonalCatEdit)
      setEditingSeasonalCat(null)
      setOk('Categoría de temporada actualizada.')
      load()
    } catch (err) { setError(err.message) }
  }

  const removeSeasonalCategory = async (category) => {
    if (!window.confirm(`¿Eliminar la categoría de temporada "${category.name}"?`)) return
    setError('')
    try {
      await catalogApi.seasonalCategories.remove(current, category.id)
      load()
    } catch (err) { setError(err.message) }
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
      const payload = productPayload(prodForm)
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
      sales_price: p.sales_price ?? '',
      discount_percent: p.discount_percent ?? '',
      offer_ends_at: toDateTimeInput(p.offer_ends_at),
      category: p.category || '',
      seasonal_category: p.seasonal_category || '',
      is_active: p.is_active,
      featured: p.featured ?? false,
      photo_order: photoOrder(p),
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
      const payload = productPayload(prodEdit)
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

  const toggleFeatured = async (p) => {
    setError('')
    try {
      await catalogApi.products.update(current, p.id, { featured: !p.featured })
      load()
    } catch (err) { setError(err.message) }
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
            <div className="row-item-main"><b>{c.name}</b></div>
            <span className="btn-group">
              <button className="btn small ghost" onClick={() => { setEditingCat(c.id); setCatEdit({ name: c.name }); setError('') }}>Editar</button>
              <button className="btn small danger" onClick={() => removeCategory(c)}>Eliminar</button>
            </span>
          </div>
        ))}
      </Card>

      <Card title={`Categorías de temporada (${seasonalCategories.length})`}>
        <form onSubmit={createSeasonalCategory} className="row add-row">
          <Field label="Nombre de la temporada *">
            <input value={seasonalCatForm.name} onChange={(e) => setSeasonalCatForm({ name: e.target.value })} placeholder="Navidad, Día de la madre…" />
          </Field>
          <button className="btn">Agregar</button>
        </form>
        {seasonalCategories.map((item) => (
          <div className="row-item" key={item.id}>
            <div className="row-item-main"><b>{item.name}</b><span className="seasonal-category-tag">Temporada</span></div>
            <span className="btn-group">
              <button type="button" className="btn small ghost" onClick={() => { setEditingSeasonalCat(item.id); setSeasonalCatEdit({ name: item.name }); setError('') }}>Editar</button>
              <button type="button" className="btn small danger" onClick={() => removeSeasonalCategory(item)}>Eliminar</button>
            </span>
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
          <Field label="Precio de oferta" hint="Dejalo vacío si el producto no está en oferta.">
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Sin oferta"
              value={prodForm.sales_price}
              onChange={(e) => setProdForm({ ...prodForm, sales_price: e.target.value })}
            />
          </Field>
          <Field label="% de descuento" hint="Solo si no cargás precio normal. Con precio normal se calcula solo.">
            <input
              type="number"
              step="1"
              min="1"
              max="99"
              placeholder="Automático"
              value={prodForm.discount_percent}
              onChange={(e) => setProdForm({ ...prodForm, discount_percent: e.target.value })}
            />
            {offerPreview(prodForm) && <span className="field-hint">{offerPreview(prodForm)}</span>}
          </Field>
          <Field label="Fin de la oferta" hint="Opcional. Después de esta fecha la oferta deja de mostrarse.">
            <input
              type="datetime-local"
              value={prodForm.offer_ends_at}
              onChange={(e) => setProdForm({ ...prodForm, offer_ends_at: e.target.value })}
            />
          </Field>

          <Field label="Categoría">
            <select value={prodForm.category} onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}>
              <option value="">Sin categoría</option>
              {(categories || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Categoría de temporada">
            <select value={prodForm.seasonal_category} onChange={(e) => setProdForm({ ...prodForm, seasonal_category: e.target.value })}>
              <option value="">Sin temporada</option>
              {seasonalCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>
          <Field label="Descripción">
            <input value={prodForm.description} onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })} />
          </Field>
          <div className="field photo-field-wide">
            <span className="field-label">Fotos (hasta 5)</span>
            <span className="field-hint">La primera foto del orden actual se usa como portada.</span>
            <ProductPhotos
              order={prodForm.photo_order}
              files={prodFiles}
              onPick={(key, file) => setProdFiles((prev) => ({ ...prev, [key]: file }))}
            />
          </div>
          <ToggleSwitch label="Activo" checked={prodForm.is_active} onChange={(value) => setProdForm({ ...prodForm, is_active: value })} />
          <ToggleSwitch label="Destacado" checked={prodForm.featured} onChange={(value) => setProdForm({ ...prodForm, featured: value })} />
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
        {filteredProducts.map((p) => {
          return (
            <div className="row-item" key={p.id}>
              <div className="row-item-main">
                <b>{p.name}</b>
                <span className="muted">
                  {[
                    p.brand,
                    hasOffer(p) && formatPrice(p.price) ? `Precio original: ${formatPrice(p.price)}` : null,
                    hasOffer(p) && discountPercent(p) > 0 ? `Descuento: ${discountPercent(p)}%` : null,
                    hasOffer(p)
                      ? `Precio con descuento: ${formatPrice(p.sales_price)}`
                      : formatPrice(p.price),
                  ].filter(Boolean).join(' · ')}
                </span>
              </div>
              <div className="catalog-product-actions">
                <ToggleSwitch label="Activo" checked={p.is_active} onChange={() => toggleActive(p)} />
                <ToggleSwitch label="Destacado" checked={p.featured} onChange={() => toggleFeatured(p)} />
                <button className="btn small ghost" onClick={() => startEditProd(p)}>Editar</button>
                <button className="btn small danger" onClick={() => removeProduct(p)}>Eliminar</button>
              </div>
            </div>
          )
        })}
      </Card>

      {editingCat !== null && (
        <EditModal title="Editar categoría" onClose={() => setEditingCat(null)} onSubmit={(event) => { event.preventDefault(); saveCategory() }}>
          <div className="catalog-modal-content">
            <Alert>{error}</Alert>
            <Field label="Nombre de la categoría *">
              <input autoFocus value={catEdit.name} onChange={(event) => setCatEdit({ ...catEdit, name: event.target.value })} />
            </Field>
            <div className="catalog-modal-actions">
              <button className="btn">Guardar cambios</button>
              <button type="button" className="btn ghost" onClick={() => setEditingCat(null)}>Cancelar</button>
            </div>
          </div>
        </EditModal>
      )}

      {editingSeasonalCat !== null && (
        <EditModal title="Editar categoría de temporada" onClose={() => setEditingSeasonalCat(null)} onSubmit={(event) => { event.preventDefault(); saveSeasonalCategory() }}>
          <div className="catalog-modal-content">
            <Alert>{error}</Alert>
            <Field label="Nombre de la temporada *">
              <input autoFocus value={seasonalCatEdit.name} onChange={(event) => setSeasonalCatEdit({ name: event.target.value })} />
            </Field>
            <div className="catalog-modal-actions">
              <button className="btn">Guardar cambios</button>
              <button type="button" className="btn ghost" onClick={() => setEditingSeasonalCat(null)}>Cancelar</button>
            </div>
          </div>
        </EditModal>
      )}

      {editingProd !== null && (
        <EditModal wide title="Editar producto" onClose={() => setEditingProd(null)} onSubmit={(event) => { event.preventDefault(); saveProduct() }}>
          <div className="catalog-modal-content">
            <Alert>{error}</Alert>
            <div className="catalog-modal-grid">
              <Field label="Nombre *"><input autoFocus value={prodEdit.name} onChange={(event) => setProdEdit({ ...prodEdit, name: event.target.value })} /></Field>
              <Field label="Marca"><input value={prodEdit.brand} onChange={(event) => setProdEdit({ ...prodEdit, brand: event.target.value })} /></Field>
              <Field label="Precio" hint="Dejalo vacío si el producto no tiene precio.">
                <input type="number" step="0.01" placeholder="Sin precio" value={prodEdit.price} onChange={(event) => setProdEdit({ ...prodEdit, price: event.target.value })} />
              </Field>
              <Field label="Precio de oferta" hint="Dejalo vacío si el producto no está en oferta.">
                <input type="number" step="0.01" min="0.01" placeholder="Sin oferta" value={prodEdit.sales_price} onChange={(event) => setProdEdit({ ...prodEdit, sales_price: event.target.value })} />
              </Field>
              <Field label="% de descuento" hint="Solo si no cargás precio normal. Con precio normal se calcula solo.">
                <input type="number" step="1" min="1" max="99" placeholder="Automático" value={prodEdit.discount_percent} onChange={(event) => setProdEdit({ ...prodEdit, discount_percent: event.target.value })} />
                {offerPreview(prodEdit) && <span className="field-hint">{offerPreview(prodEdit)}</span>}
              </Field>
              <Field label="Fin de la oferta" hint="Opcional. Después de esta fecha la oferta deja de mostrarse.">
                <input type="datetime-local" value={prodEdit.offer_ends_at} onChange={(event) => setProdEdit({ ...prodEdit, offer_ends_at: event.target.value })} />
              </Field>
              <Field label="Categoría">
                <select value={prodEdit.category} onChange={(event) => setProdEdit({ ...prodEdit, category: event.target.value })}>
                  <option value="">Sin categoría</option>{(categories || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </Field>
              <Field label="Categoría de temporada">
                <select value={prodEdit.seasonal_category} onChange={(event) => setProdEdit({ ...prodEdit, seasonal_category: event.target.value })}>
                  <option value="">Sin temporada</option>{seasonalCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </Field>
              <Field label="Descripción"><textarea rows={3} value={prodEdit.description} onChange={(event) => setProdEdit({ ...prodEdit, description: event.target.value })} /></Field>
              <div className="field photo-field-wide">
                <span className="field-label">Fotos (hasta 5)</span>
                <span className="field-hint">Podés reemplazar una foto eligiendo un archivo nuevo. Se conserva el orden actual.</span>
                <ProductPhotos
                  images={prodEditImages}
                  files={prodEditFiles}
                  order={prodEdit.photo_order}
                  onPick={(key, file) => setProdEditFiles((prev) => ({ ...prev, [key]: file }))}
                />
              </div>
              <div className="catalog-modal-toggles">
                <ToggleSwitch label="Activo" checked={prodEdit.is_active} onChange={(value) => setProdEdit({ ...prodEdit, is_active: value })} />
                <ToggleSwitch label="Destacado" checked={prodEdit.featured} onChange={(value) => setProdEdit({ ...prodEdit, featured: value })} />
              </div>
            </div>
            <div className="catalog-modal-actions">
              <button className="btn">Guardar cambios</button>
              <button type="button" className="btn ghost" onClick={() => setEditingProd(null)}>Cancelar</button>
            </div>
          </div>
        </EditModal>
      )}

      <div className="stack small">
        <Alert kind="ok">{ok}</Alert>
        <Alert>{error}</Alert>
      </div>
    </div>
  )
}
