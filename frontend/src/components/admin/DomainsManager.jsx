import { useEffect, useState } from 'react'
import { domainsApi } from '../../api'
import { Alert, Card, Field, Row, Spinner } from '../ui'

const EMPTY = { domain: '', is_primary: false }

export default function DomainsManager() {
  const [list, setList] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [failed, setFailed] = useState(false)

  const load = () => {
    domainsApi
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
      await domainsApi.create(form)
      setForm(EMPTY)
      setOk('Dominio creado.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const togglePrimary = async (d) => {
    setError('')
    setOk('')
    try {
      await domainsApi.update(d.id, { is_primary: !d.is_primary })
      setOk('Dominio actualizado.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (d) => {
    if (!window.confirm(`¿Eliminar el dominio ${d.domain}?`)) return
    setError('')
    setOk('')
    try {
      await domainsApi.remove(d.id)
      setOk('Dominio eliminado.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!failed && list === null) return <Spinner />

  if (failed) {
    return (
      <Card title="Dominios de la tienda">
        <Alert>
          Solo puedes administrar los dominios del tenant de la petición (según el Host). Abre este panel
          en el dominio de tu tienda.
        </Alert>
        <button className="btn" onClick={load}>Reintentar</button>
      </Card>
    )
  }

  return (
    <div className="stack">
      <Card title="Agregar dominio">
        <form onSubmit={create} className="row add-row">
          <Field label="Dominio *">
            <input
              value={form.domain}
              placeholder="p. ej. mitienda.localhost"
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
            />
          </Field>
          <label className="check">
            <input
              type="checkbox"
              checked={form.is_primary}
              onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
            />
            Principal
          </label>
          <button className="btn">Agregar</button>
        </form>
        <div className="stack small">
          <Alert kind="ok">{ok}</Alert>
          <Alert>{error}</Alert>
        </div>
      </Card>

      <Card title={`Dominios (${list.length})`}>
        {list.length === 0 && <p className="muted">No hay dominios.</p>}
        {list.map((d) => (
          <div className="row-item" key={d.id}>
            <div className="row-item-main">
              <b>{d.domain}</b>
              <span className={d.is_primary ? 'chip' : 'chip muted-span'}>{d.is_primary ? 'principal' : 'secundario'}</span>
            </div>
            <span className="btn-group">
              <button className="btn small" onClick={() => togglePrimary(d)}>
                {d.is_primary ? 'Quitar principal' : 'Hacer principal'}
              </button>
              <button className="btn small danger" onClick={() => remove(d)}>Eliminar</button>
            </span>
          </div>
        ))}
      </Card>
    </div>
  )
}