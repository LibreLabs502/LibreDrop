import { useEffect, useState } from 'react'
import { membershipsApi, tenantsApi } from '../../api'
import { Alert, Card, Field, Spinner } from '../ui'

export default function MembershipsManager() {
  const [stores, setStores] = useState(null)
  const [tenantId, setTenantId] = useState('')
  const [list, setList] = useState(null)
  const [form, setForm] = useState({ user: '' })
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
    membershipsApi
      .list(tenantId)
      .then(setList)
      .catch((e) => setError(e.message))
  }

  useEffect(load, [tenantId])

  const create = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    try {
      await membershipsApi.create(tenantId, { user: Number(form.user) })
      setForm({ user: '' })
      setOk('Miembro agregado.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (m) => {
    if (!window.confirm(`¿Eliminar la membresía #${m.id}?`)) return
    setError('')
    setOk('')
    try {
      await membershipsApi.remove(tenantId, m.id)
      setOk('Membresía eliminada.')
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

      <Card title="Agregar miembro">
        <form onSubmit={create} className="row add-row">
          <Field label="ID de usuario *">
            <input type="number" value={form.user} onChange={(e) => setForm({ user: e.target.value })} />
          </Field>
          <button className="btn">Agregar</button>
        </form>
        <div className="stack small">
          <Alert kind="ok">{ok}</Alert>
          <Alert>{error}</Alert>
        </div>
      </Card>

      <Card title={`Miembros (${(list || []).length})`}>
        {list && list.length === 0 && <p className="muted">No hay miembros.</p>}
        {(list || []).map((m) => (
          <div className="row-item" key={m.id}>
            <div className="row-item-main">
              <b>{m.user?.username || `Usuario #${m.user?.id || m.user}`}</b>
              <span className="muted">{m.tenant?.name}</span>
            </div>
            <span className="btn-group">
              <button className="btn small danger" onClick={() => remove(m)}>Eliminar</button>
            </span>
          </div>
        ))}
      </Card>
    </div>
  )
}
