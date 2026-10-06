import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tenantsApi } from '../../api'
import { useTenant } from '../../store/TenantContext'
import { Alert, Card, Field, Spinner } from '../ui'

export default function StoresManager() {
  const { stores, current, select, reload, loading, error: loadError } = useTenant()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading) reload()
    // eslint-disable-next-line
  }, [])

  const startEdit = (t) => {
    setEditing(t.id)
    setForm({ name: t.name, description: t.description || '', whatsapp: t.whatsapp || '' })
    setLogoFile(null)
    setError('')
    setOk('')
  }

  const cancelEdit = () => {
    setEditing(null)
    setForm(null)
    setLogoFile(null)
  }

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    setBusy(true)
    try {
      await tenantsApi.update(editing, form, logoFile)
      setOk('Tienda actualizada.')
      setEditing(null)
      setForm(null)
      setLogoFile(null)
      reload()
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
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="stack">
      {editing !== null && form && (
        <Card title="Actualizar tienda">
          <form onSubmit={save} className="grid2">
            <Field label="Nombre *">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="WhatsApp">
              <input value={form.whatsapp} placeholder="+50212345678" onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            </Field>
            <Field label="Descripción">
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Logo">
              <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
            </Field>
            {stores.find((t) => t.id === editing)?.logo && (
              <div className="stack small">
                <span className="muted">Logo actual:</span>
                <img src={stores.find((t) => t.id === editing).logo} alt="Logo" style={{ width: 96, borderRadius: 12 }} />
              </div>
            )}
            <div className="btn-group">
              <button className="btn" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
              <button type="button" className="btn ghost" onClick={cancelEdit}>Cancelar</button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`Tus tiendas (${stores.length})`}>
        <Alert>{loadError}</Alert>
        <Alert kind="ok">{ok}</Alert>
        <Alert>{error}</Alert>
        {stores.length === 0 && <p className="muted">No tienes tiendas.</p>}
        {stores.map((t) => (
          <div className="row-item" key={t.id}>
            <div className="row-item-main">
              <b>{t.name}</b>
              <span className="muted">
                {[t.whatsapp, t.description].filter(Boolean).join(' · ') || 'Sin contacto configurado'}
              </span>
              {t.id === current && <span className="chip">Tienda actual</span>}
            </div>
            <span className="btn-group">
              {t.id !== current && (
                <button className="btn small ghost" onClick={() => select(t.id)}>Usar</button>
              )}
              <Link className="btn small ghost" to={`/tienda/${t.slug}`} target="_blank">Ver tienda</Link>
              <button className="btn small ghost" onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/tienda/${t.slug}`)
                setOk('Enlace copiado al portapapeles.')
              }}>Compartir tienda</button>
              <button className="btn small" onClick={() => startEdit(t)}>Editar</button>
              <button className="btn small danger" onClick={() => remove(t)}>Eliminar</button>
            </span>
          </div>
        ))}
      </Card>
    </div>
  )
}
