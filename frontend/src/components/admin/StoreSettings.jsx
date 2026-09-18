import { useEffect, useMemo, useState } from 'react'
import { tenantsApi, waLink } from '../../api'
import { useAdmin } from '../../store/AdminContext'
import { Alert, Card, Field, Row } from '../ui'

function StoreLink({ store }) {
  const domain = (store?.domains || []).find((d) => d.is_primary)?.domain
  const [copied, setCopied] = useState(false)

  if (!domain) return null

  const port = window.location.port ? `:${window.location.port}` : ''
  const url = `${window.location.protocol}//${domain}${port}/`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="share-link">
      <div className="share-link-url">
        <span className="muted">Link de tu tienda para compartir:</span>
        <code>{url}</code>
      </div>
      <button className="btn" onClick={copy}>{copied ? '¡Copiado!' : 'Copiar link de la tienda'}</button>
    </div>
  )
}

export default function StoreSettings() {
  const { stores, reload, activeTenant } = useAdmin()
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState({ name: '', description: '', phone: '', email: '' })
  const [logoFile, setLogoFile] = useState(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const selected = useMemo(
    () => stores.find((s) => s.id === Number(selectedId)),
    [stores, selectedId],
  )

  useEffect(() => {
    if (stores.length === 0) return
    const current = stores.find((s) => s.id === Number(selectedId))
    if (current) return
    const fallback = activeTenant || stores[0]
    if (fallback) setSelectedId(String(fallback.id))
  }, [stores, selectedId, activeTenant])

  useEffect(() => {
    if (selected) {
      setForm({
        name: selected.name || '',
        description: selected.description || '',
        phone: selected.phone || '',
        email: selected.email || '',
      })
      setLogoFile(null)
    }
  }, [selected])

  const save = async (e) => {
    e.preventDefault()
    setErr('')
    setMsg('')
    setBusy(true)
    try {
      await tenantsApi.update(selectedId, form, logoFile)
      setMsg('Cambios guardados. La tienda pública se actualizó.')
      await reload()
    } catch (error) {
      setErr(error.message)
    } finally {
      setBusy(false)
    }
  }

  if (stores.length === 0) {
    return (
      <Card title="Mi tienda">
        <p className="muted">Aún no tienes tiendas. Ve a “Tiendas” para crearlas.</p>
      </Card>
    )
  }

  const preview = waLink(form.phone, `Hola ${form.name || 'tienda'}, tengo una consulta.`)

  return (
    <div className="stack">
      <Card title="Mi tienda">
        <Row>
          <Field label="Tienda">
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        </Row>

        <form className="grid2" onSubmit={save}>
          <Field label="Nombre comercial *">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email de contacto">
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Teléfono (WhatsApp) *" hint="Formato: +50212345678">
            <input value={form.phone} placeholder="+50212345678" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Descripción">
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Logo (opcional, requiere Cloudinary)">
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0] || null)} />
          </Field>
          <div className="row align-end">
            <button className="btn" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>

        <div className="stack small">
          <Alert kind="ok">{msg}</Alert>
          <Alert>{err}</Alert>
        </div>
      </Card>

      <Card title="Tu tienda pública">
        <div className="kv">
          <span>Nombre</span><b>{form.name || '—'}</b>
          <span>WhatsApp</span><b>{form.phone || '—'}</b>
          <span>Descripción</span><b>{form.description || '—'}</b>
        </div>
        <p className="muted">
          Los clientes ven tu catálogo en el dominio de tu tienda y piden por WhatsApp. Este link es el
          que puedes compartir para que la gente vea tus productos y categorías:
        </p>
        <StoreLink store={selected} />
        <div className="chips">
          {(selected?.domains || []).map((d) => (
            <span className="chip" key={d.domain}>{d.domain}</span>
          ))}
        </div>
        {form.phone && (
          <a className="btn-outline inline" href={preview} target="_blank" rel="noreferrer">
            Probar botón de WhatsApp ({form.phone})
          </a>
        )}
      </Card>
    </div>
  )
}