import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { tenantsApi, paymentsApi, waLink, SUPPORT_WHATSAPP } from '../../api'
import { PURCHASE_CHANNELS, channelIsReady, DEFAULT_PURCHASE_BUTTON_TEXT, purchaseButtonText } from '../../channels'
import { useAuth } from '../../store/AuthContext'
import { useTenant } from '../../store/TenantContext'
import { Alert, Card, Field, Spinner } from '../ui'

function EditSection({ title, description, children }) {
  return (
    <section className="tenant-edit-section">
      <div className="tenant-edit-section-heading">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      {children}
    </section>
  )
}

export default function StoresManager() {
  const { user } = useAuth()
  const { openUpdates, hasNews } = useOutletContext() || {}
  const { stores, current, currentTenant, select, reload, loading, error: loadError } = useTenant()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0)

  useEffect(() => {
    if (!user?.is_superuser) return undefined

    let mounted = true
    const loadPendingPayments = async () => {
      try {
        const payments = await paymentsApi.list()
        if (mounted) {
          setPendingPaymentsCount(payments.filter((payment) => payment.status === 'pending').length)
        }
      } catch {
        // El aviso es auxiliar; la pantalla de pagos conserva su manejo de errores.
      }
    }

    loadPendingPayments()
    const interval = window.setInterval(loadPendingPayments, 60_000)
    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [user?.is_superuser])

  useEffect(() => {
    if (!loading) reload()
    // eslint-disable-next-line
  }, [])

  const startEdit = (t) => {
    setEditing(t.id)
    setForm({
      name: t.name,
      description: t.description || '',
      sale_text: t.sale_text || 'Productos con ofertas',
      featured_products_text: t.featured_products_text || 'Productos destacados',
      whatsapp: t.whatsapp || '',
      instagram_url: t.instagram_url || '',
      facebook_url: t.facebook_url || '',
      tiktok_url: t.tiktok_url || '',
      linkedin_url: t.linkedin_url || '',
      purchase_channels: Array.isArray(t.purchase_channels) ? t.purchase_channels : [],
      purchase_button_text: t.purchase_button_text || '',
    })
    setLogoFile(null)
    setError('')
    setOk('')
  }

  const cancelEdit = () => {
    setEditing(null)
    setForm(null)
    setLogoFile(null)
  }

  const toggleChannel = (key) => {
    if (!channelIsReady(key, form)) return
    setForm((f) => {
      const current = f.purchase_channels || []
      const next = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key]
      return { ...f, purchase_channels: next }
    })
  }

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    setBusy(true)
    try {
      // Solo guardamos canales que hoy tengan un destino válido (por si el
      // usuario borró el número o el enlace sin desactivar el interruptor).
      const payload = {
        ...form,
        sale_text: String(form.sale_text || '').trim() || 'Productos con ofertas',
        featured_products_text: String(form.featured_products_text || '').trim() || 'Productos destacados',
        purchase_button_text: String(form.purchase_button_text || '').trim() || DEFAULT_PURCHASE_BUTTON_TEXT,
        purchase_channels: (form.purchase_channels || []).filter((k) => channelIsReady(k, form)),
      }
      await tenantsApi.update(editing, payload, logoFile)
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
          <form onSubmit={save} className="tenant-edit-form">
            <EditSection title="Información" description="Los datos principales que identifican tu tienda.">
              <div className="tenant-edit-grid">
                <Field label="Nombre *">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="Descripción">
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Field>
                <Field label="Número de WhatsApp" hint="Usalo con código de país, por ejemplo +502…">
                  <input value={form.whatsapp} placeholder="+50212345678" onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                </Field>
                <Field label="Logo">
                  <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                </Field>
              </div>
              {stores.find((t) => t.id === editing)?.logo && (
                <div className="tenant-current-logo">
                  <span className="field-label">Logo actual</span>
                  <img src={stores.find((t) => t.id === editing).logo} alt="Logo actual de la tienda" />
                </div>
              )}
            </EditSection>

            <EditSection title="Presentación" description="Personalizá los títulos de las secciones que ven tus clientes.">
              <div className="tenant-edit-grid">
                <Field label="Título del carrusel de ofertas" hint="Aparece encima de las fotos de ofertas. Máximo 40 caracteres.">
                  <input value={form.sale_text} maxLength={40} onChange={(e) => setForm({ ...form, sale_text: e.target.value })} />
                </Field>
                <Field label="Título de productos destacados" hint="Encabezado de la selección destacada. Máximo 40 caracteres.">
                  <input value={form.featured_products_text} maxLength={40} onChange={(e) => setForm({ ...form, featured_products_text: e.target.value })} />
                </Field>
              </div>
            </EditSection>

            <EditSection title="Redes sociales" description="Agregá los perfiles donde tus clientes pueden encontrarte. Todos son opcionales.">
              <div className="tenant-edit-grid">
                <Field label="Instagram">
                  <input type="url" value={form.instagram_url} placeholder="https://instagram.com/tu-cuenta" onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} />
                </Field>
                <Field label="Facebook">
                  <input type="url" value={form.facebook_url} placeholder="https://facebook.com/tu-pagina" onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} />
                </Field>
                <Field label="TikTok">
                  <input type="url" value={form.tiktok_url} placeholder="https://tiktok.com/@tu-cuenta" onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })} />
                </Field>
                <Field label="LinkedIn">
                  <input type="url" value={form.linkedin_url} placeholder="https://linkedin.com/in/tu-perfil" onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
                </Field>
              </div>
            </EditSection>

            <EditSection title="Pedidos y canales" description="Elegí dónde recibir pedidos y personalizá el texto de tus botones.">
              <div className="channels-block">
                <div className="channel-list">
                  {PURCHASE_CHANNELS.map((c) => {
                    const ready = channelIsReady(c.key, form)
                    const active = ready && (form.purchase_channels || []).includes(c.key)
                    return (
                      <div className="channel-row" key={c.key}>
                        <div className="channel-info">
                          <span className="channel-name">{c.label}</span>
                          {!ready && <span className="channel-note warn">Falta {c.hint} para activarlo.</span>}
                        </div>
                        <label className={`switch${ready ? '' : ' disabled'}`}>
                          <input type="checkbox" checked={active} disabled={!ready} onChange={() => toggleChannel(c.key)} />
                          <span className="switch-track"><span className="switch-thumb" /></span>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="purchase-button-text-block">
                <Field label="Texto de los botones de compra" hint="Se verá, por ejemplo, como «Comprar por WhatsApp».">
                  <input value={form.purchase_button_text} maxLength={40} placeholder={DEFAULT_PURCHASE_BUTTON_TEXT} onChange={(e) => setForm({ ...form, purchase_button_text: e.target.value })} />
                </Field>
                <p className="channel-preview">
                  Vista previa: <b>{purchaseButtonText(form)} {PURCHASE_CHANNELS.find((c) => (form.purchase_channels || []).includes(c.key))?.label || 'WhatsApp'}</b>
                </p>
              </div>
            </EditSection>

            <div className="tenant-edit-actions">
              <button className="btn" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
              <button type="button" className="btn ghost" onClick={cancelEdit}>Cancelar</button>
            </div>
          </form>
        </Card>
      )}

      {!user?.is_superuser && currentTenant && !currentTenant.subscription && (
        <div className="notice warn">
          <p className="notice-text">
            Tu tienda <b>{currentTenant.name}</b> está en espera de activación. Mandanos un WhatsApp y la activamos de inmediato.
          </p>
          <div className="btn-group">
            <a
              className="btn small"
              href={waLink(SUPPORT_WHATSAPP, `Hola LibreLabs, soy ${currentTenant.name}. Me gustaría activar mi cuenta.`)}
              target="_blank"
              rel="noreferrer"
            >
              Me gustaría activar mi cuenta
            </a>
          </div>
        </div>
      )}

      {user?.is_superuser && pendingPaymentsCount > 0 && (
        <div className="notice warn">
          <p className="notice-text">
            Hay <b>{pendingPaymentsCount} pago{pendingPaymentsCount === 1 ? '' : 's'} pendiente{pendingPaymentsCount === 1 ? '' : 's'}</b> por revisar.
          </p>
          <Link className="btn small" to="/admin/pagos">
            Revisar pagos
          </Link>
        </div>
      )}

      <Card
        title={`Tus tiendas (${stores.length})`}
        actions={
          openUpdates && (
            <button type="button" className="btn small ghost updates-link" onClick={openUpdates}>
              Ver Novedades
              {hasNews && <span className="updates-tag">Nuevo</span>}
            </button>
          )
        }
      >
        <Alert>{loadError}</Alert>
        <Alert kind="ok">{ok}</Alert>
        <Alert>{error}</Alert>
        {stores.length === 0 && <p className="muted">No tienes tiendas.</p>}
        {stores.map((t) => (
          <div className="row-item store-row" key={t.id}>
            <div className="row-item-main">
              <div className="store-fields">
                <span className="store-field-label">Nombre</span>
                <b>{t.name}</b>
                {t.description && (
                  <>
                    <span className="store-field-label">Descripción</span>
                    <span>{t.description}</span>
                  </>
                )}
                {t.sale_text && (
                  <>
                    <span className="store-field-label">Título de ofertas</span>
                    <span>{t.sale_text}</span>
                  </>
                )}
                {t.featured_products_text && (
                  <>
                    <span className="store-field-label">Título de destacados</span>
                    <span>{t.featured_products_text}</span>
                  </>
                )}
                {t.whatsapp && (
                  <>
                    <span className="store-field-label">Número de WhatsApp</span>
                    <span>{t.whatsapp}</span>
                  </>
                )}
                {t.instagram_url && (
                  <>
                    <span className="store-field-label">Instagram</span>
                    <a href={t.instagram_url} target="_blank" rel="noreferrer">{t.instagram_url}</a>
                  </>
                )}
                {t.facebook_url && (
                  <>
                    <span className="store-field-label">Facebook</span>
                    <a href={t.facebook_url} target="_blank" rel="noreferrer">{t.facebook_url}</a>
                  </>
                )}
                {t.tiktok_url && (
                  <>
                    <span className="store-field-label">TikTok</span>
                    <a href={t.tiktok_url} target="_blank" rel="noreferrer">{t.tiktok_url}</a>
                  </>
                )}
                {t.linkedin_url && (
                  <>
                    <span className="store-field-label">LinkedIn</span>
                    <a href={t.linkedin_url} target="_blank" rel="noreferrer">{t.linkedin_url}</a>
                  </>
                )}
                {t.purchase_channels?.length > 0 && (
                  <>
                    <span className="store-field-label">Canales de compra</span>
                    <span>
                      {PURCHASE_CHANNELS.filter((c) => t.purchase_channels.includes(c.key))
                        .map((c) => c.label)
                        .join(', ')}
                    </span>
                  </>
                )}
                {t.purchase_button_text && (
                  <>
                    <span className="store-field-label">Texto de compra</span>
                    <span>{t.purchase_button_text}</span>
                  </>
                )}
              </div>
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
