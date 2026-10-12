import { useEffect, useState } from 'react'
import { tenantsApi } from '../../api'
import { useTenant } from '../../store/TenantContext'
import { themeStyle } from '../../theme'
import { Alert, Card, Spinner } from '../ui'

const SWATCH_KEYS = [
  { key: 'primary', label: 'Principal' },
  { key: 'secondary', label: 'Secundario' },
  { key: 'background', label: 'Fondo' },
  { key: 'text', label: 'Texto' },
]

export default function AdminAppearance() {
  const { current, currentTenant, reload, loading } = useTenant()
  const [palettes, setPalettes] = useState(null)
  const [loadingPalettes, setLoadingPalettes] = useState(true)
  const [savingKey, setSavingKey] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    let alive = true
    setLoadingPalettes(true)
    tenantsApi
      .palettes()
      .then((data) => {
        if (alive) {
          setPalettes(data)
          setError('')
        }
      })
      .catch((e) => {
        if (alive) setError(e.message)
      })
      .finally(() => {
        if (alive) setLoadingPalettes(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const selectedKey = currentTenant?.theme?.palette || null
  const preview = themeStyle(currentTenant?.theme)

  const choose = async (key) => {
    if (!current || key === selectedKey || savingKey) return
    setError('')
    setOk('')
    setSavingKey(key)
    try {
      await tenantsApi.update(current, { theme_palette: key })
      await reload()
      setOk('Paleta actualizada.')
    } catch (e) {
      // No simulamos éxito: si falla la API, se muestra el error y no se marca.
      setError(e.message)
    } finally {
      setSavingKey(null)
    }
  }

  if (loading || loadingPalettes) return <Spinner />
  if (!currentTenant) return <Card title="Apariencia"><Alert>No tienes tiendas.</Alert></Card>

  return (
    <div className="stack">
      <Card title="Personalización visual">
        <p className="muted">
          Elegí la paleta de <b>{currentTenant.name}</b>. Los cambios se aplican a su tienda pública.
        </p>

        {palettes && palettes.length > 0 && (
          <div className="palette-grid">
            {palettes.map((p) => {
              const active = p.key === selectedKey
              const saving = savingKey === p.key
              return (
                <button
                  type="button"
                  key={p.key}
                  className={`palette-card${active ? ' active' : ''}`}
                  onClick={() => choose(p.key)}
                  disabled={savingKey !== null}
                  aria-pressed={active}
                >
                  <span className="palette-preview" aria-hidden="true">
                    <span className="palette-preview-primary" style={{ background: p.primary }} />
                    <span className="palette-preview-secondary" style={{ background: p.secondary }} />
                  </span>
                  <span className="palette-card-foot">
                    <b>{p.label}</b>
                    <span className="palette-dots" aria-hidden="true">
                      {SWATCH_KEYS.map((s) => (
                        <i key={s.key} style={{ background: p[s.key] }} title={s.label} />
                      ))}
                    </span>
                  </span>
                  {active && <span className="chip active">Seleccionada</span>}
                  {saving && <span className="muted">Guardando…</span>}
                </button>
              )
            })}
          </div>
        )}

        {palettes && palettes.length === 0 && <p className="muted">No hay paletas disponibles.</p>}

        {currentTenant.theme && !selectedKey && (
          <p className="muted">
            La tienda usa colores personalizados. Elegí una paleta para reemplazarlos.
          </p>
        )}

        <div className="stack small">
          <Alert kind="ok">{ok}</Alert>
          <Alert>{error}</Alert>
        </div>
      </Card>

      <Card title="Vista previa">
        <div className="theme-preview" style={{ background: preview['--store-bg'], color: preview['--store-text'] }}>
          <div className="theme-preview-hero" style={{ background: preview['--store-primary'], color: preview['--store-on-primary'] }}>
            {currentTenant.name}
          </div>
          <p style={{ color: preview['--store-muted'] }}>Así se verán los colores en tu tienda.</p>
          <div className="theme-preview-actions">
            <span className="theme-preview-btn" style={{ background: preview['--store-primary'], color: preview['--store-on-primary'] }}>Acción</span>
            <span className="theme-preview-btn ghost" style={{ color: preview['--store-primary'], borderColor: preview['--store-primary'] }}>Secundario</span>
            <span className="theme-preview-tag" style={{ background: preview['--store-secondary'], color: preview['--store-text'] }}>Etiqueta</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
