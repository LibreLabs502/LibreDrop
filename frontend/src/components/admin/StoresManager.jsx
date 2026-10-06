import { useEffect, useState } from 'react'
import { tenantsApi } from '../../api'
import { Alert, Card, Field, Spinner } from '../ui'

const EMPTY = { name: '', description: '', whatsapp: '' }

export default function StoresManager() {
  const [stores, setStores] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    tenantsApi
      .list()
      .then((list) => {
        setStores(list)
        setLoadError('')
      })
      .catch((e) => setLoadError(e.message))
  }

  useEffect(load, [])

  const create = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    setBusy(true)
    try {
      await tenantsApi.create(form)
      setForm(EMPTY)
      setOk('Tienda creada.')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (t) => {
    if (!window.confirm(`¿Eliminar la tienda "${t.name}"?`)) return
    setError('')
    setOk('')
    try {
      await tenantsApi.remove(t.id)
      setOk('Tienda eliminada.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (stores === null && !loadError) return <Spinner />

  return (
    <div className="stack">
      <Card title="Crear tienda">
        <form onSubmit={create} className="grid2">
          <Field label="Nombre *">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="WhatsApp">
            <input value={form.whatsapp} placeholder="+502 1234 5678" onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </Field>
          <Field label="Descripción">
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <button className="btn" disabled={busy}>{busy ? 'Creando…' : 'Crear tienda'}</button>
        </form>
        <div className="stack small">
          <Alert kind="ok">{ok}</Alert>
          <Alert>{error}</Alert>
        </div>
      </Card>

      <Card title={`Tus tiendas (${(stores || []).length})`}>
        <Alert>{loadError}</Alert>
        {stores && stores.length === 0 && (
          <p className="muted">No tienes tiendas. Crea una con el formulario de arriba.</p>
        )}
        {(stores || []).map((t) => (
          <div className="row-item" key={t.id}>
            <div className="row-item-main">
              <b>{t.name}</b>
              <span className="muted">
                {[t.whatsapp, t.description].filter(Boolean).join(' · ') || 'Sin contacto configurado'}
              </span>
            </div>
            <span className="btn-group">
              <button className="btn small danger" onClick={() => remove(t)}>Eliminar</button>
            </span>
          </div>
        ))}
      </Card>
    </div>
  )
}
