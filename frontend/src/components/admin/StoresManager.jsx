import { useEffect, useState } from 'react'
import { tenantsApi } from '../../api'
import { useAdmin } from '../../store/AdminContext'
import { Alert, Card, Field, Row, Spinner } from '../ui'

const EMPTY = { name: '', description: '', phone: '', email: '' }

export default function StoresManager() {
  const { stores, reload, error: loadError } = useAdmin()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  const create = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    setBusy(true)
    try {
      await tenantsApi.create(form)
      setForm(EMPTY)
      setOk('Tienda creada (con su esquema propio) y asociada a tu usuario como OWNER.')
      await reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (t) => {
    if (!window.confirm(`¿Eliminar la tienda "${t.name}"? Se eliminará todo su esquema.`)) return
    setError('')
    setOk('')
    try {
      await tenantsApi.remove(t.id)
      setOk('Tienda eliminada.')
      await reload()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!stores) return <Spinner />

  return (
    <div className="stack">
      <Card title="Crear tienda">
        <form onSubmit={create} className="grid2">
          <Field label="Nombre *">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Teléfono (WhatsApp)">
            <input value={form.phone} placeholder="+502 1234 5678" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Descripción">
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <button className="btn" disabled={busy}>{busy ? 'Creando…' : 'Crear tienda'}</button>
        </form>
        <div className="stack small">
          <Alert kind="ok">{ok}</Alert>
          <Alert>{error}</Alert>
        </div>
      </Card>

      <Card title={`Tus tiendas (${stores.length})`}>
        <Alert>{loadError}</Alert>
        {stores.length === 0 && (
          <p className="muted">No tienes tiendas. Crea una con el formulario de arriba.</p>
        )}
        {stores.map((t) => (
          <div className="row-item" key={t.id}>
            <div className="row-item-main">
              <b>{t.name}</b>
              <span className="muted">
                {[t.phone, t.email].filter(Boolean).join(' · ') || 'Sin contacto configurado'}
              </span>
              <div className="chips">
                {(t.domains || []).map((d) => (
                  <span className="chip" key={d.domain}>
                    {d.domain} {d.is_primary ? '· principal' : ''}
                  </span>
                ))}
              </div>
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