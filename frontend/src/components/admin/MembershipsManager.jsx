import { useEffect, useState } from 'react'
import { membershipsApi } from '../../api'
import { Alert, Card, Field, Row, Spinner } from '../ui'

const EMPTY = { user: '', role: 'STAFF' }

export default function MembershipsManager() {
  const [list, setList] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [failed, setFailed] = useState(false)

  const load = () => {
    membershipsApi
      .list()
      .then(setList)
      .catch(() => setFailed(true))
  }

  useEffect(load, [])

  const create = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    try {
      await membershipsApi.create({ user: Number(form.user), role: form.role })
      setForm(EMPTY)
      setOk('Miembro agregado.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (m) => {
    if (!window.confirm(`¿Eliminar la membresía del usuario #${m.user}?`)) return
    setError('')
    setOk('')
    try {
      await membershipsApi.remove(m.id)
      setOk('Membresía eliminada.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!failed && list === null) return <Spinner />

  if (failed) {
    return (
      <Card title="Miembros de la tienda">
        <Alert>
          Solo puedes administrar los miembros del tenant de la petición (según el Host). Abre este panel
          en el dominio de tu tienda.
        </Alert>
        <button className="btn" onClick={load}>Reintentar</button>
      </Card>
    )
  }

  return (
    <div className="stack">
      <Card title="Agregar miembro">
        <form onSubmit={create} className="row add-row">
          <Field label="ID de usuario *">
            <input
              type="number"
              value={form.user}
              onChange={(e) => setForm({ ...form, user: e.target.value })}
            />
          </Field>
          <Field label="Rol">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="OWNER">OWNER</option>
              <option value="STAFF">STAFF</option>
            </select>
          </Field>
          <button className="btn">Agregar</button>
        </form>
        <div className="stack small">
          <Alert kind="ok">{ok}</Alert>
          <Alert>{error}</Alert>
        </div>
      </Card>

      <Card title={`Miembros (${list.length})`}>
        {list.length === 0 && <p className="muted">No hay miembros.</p>}
        {list.map((m) => (
          <div className="row-item" key={m.id}>
            <div className="row-item-main">
              <b>Usuario #{m.user}</b>
              <span className={m.role === 'OWNER' ? 'chip' : 'chip muted-span'}>{m.role}</span>
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