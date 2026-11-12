const TOKEN_KEY = 'libredrop_access'
const REFRESH_KEY = 'libredrop_refresh'
const USER_KEY = 'libredrop_user'

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY)
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY)
export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const setTokens = (tokens) => {
  if (tokens.access) localStorage.setItem(TOKEN_KEY, tokens.access)
  if (tokens.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh)
}

export const setStoredUser = (user) => {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

// URL base del API.
// - En dev: /api (Vite proxya a http://localhost:8000, ver vite.config.js).
// - En prod (Vercel): definí VITE_API_URL=https://api.tudominio.com en las
//   variables de entorno del proyecto en Vercel.
export const apiBase = () => {
  const configured = import.meta.env.VITE_API_URL
  if (configured) return configured.replace(/\/+$/, '')
  return `${window.location.protocol}//${window.location.host}/api`
}

const flattenErrors = (data) => {
  if (!data) return 'Error desconocido'
  if (typeof data === 'string') return data
  if (data.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
  if (Array.isArray(data)) return data.map(flattenErrors).join(' · ')
  const parts = []
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) parts.push(`${key}: ${value.map(flattenErrors).join(', ')}`)
    else if (value && typeof value === 'object') parts.push(`${key}: ${flattenErrors(value)}`)
    else parts.push(`${key}: ${value}`)
  }
  return parts.join(' · ')
}

export async function api(path, { method = 'GET', body, form = false, auth = true, retry = true } = {}) {
  const headers = {}
  if (auth) {
    const token = getAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let payload
  if (form) {
    payload = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const res = await fetch(apiBase() + path, { method, headers, body: payload })

  if (res.status === 401 && auth) {
    // El access token caducó: probamos renovarlo con el refresh token y
    // repetimos la petición una sola vez. Así la sesión se mantiene (p. ej.
    // el dueño puede ir a depositar y volver después a subir el comprobante).
    if (retry && (await renewAccessToken())) {
      return api(path, { method, body, form, auth, retry: false })
    }
    clearTokens()
    const err = new Error('Sesión expirada o token inválido. Vuelve a iniciar sesión.')
    err.status = 401
    throw err
  }

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const err = new Error(flattenErrors(data) || `HTTP ${res.status} ${res.statusText}`)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

export const accountsApi = {
  register: (payload) => api('/auth/register/', { method: 'POST', body: payload, auth: false }),
  login: (username, password) =>
    api('/auth/login/', { method: 'POST', body: { username, password }, auth: false }),
  refresh: (refresh) =>
    api('/auth/token/refresh/', { method: 'POST', body: { refresh }, auth: false }),
  me: () => api('/auth/me/'),
  acceptAgreement: (version) => api('/auth/agreement/accept/', { method: 'POST', body: { version } }),
}

// Renueva el access token con el refresh token (sin pedir credenciales de nuevo).
// Devuelve true si lo logró. Una sola petición compartida entre llamadas
// simultáneas para no renovar de más.
let renewPromise = null
const renewAccessToken = () => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return Promise.resolve(false)
  if (!renewPromise) {
    renewPromise = accountsApi
      .refresh(refreshToken)
      .then((tokens) => {
        setTokens(tokens)
        return Boolean(tokens?.access)
      })
      .catch(() => false)
      .finally(() => {
        renewPromise = null
      })
  }
  return renewPromise
}

// Estos campos son blank=False/nullable en el backend: un string vacío da 400.
// En JSON mandamos null (permite limpiarlos).
const OPTIONAL_BLANK_FIELDS = ['whatsapp', 'instagram_url', 'facebook_url', 'tiktok_url', 'linkedin_url']
const cleanTenantPayload = (data) => {
  const clean = { ...(data || {}) }
  for (const key of OPTIONAL_BLANK_FIELDS) {
    if (clean[key] === '') clean[key] = null
  }
  return clean
}

export const tenantsApi = {
  list: () => api('/tenants/tenant/'),
  palettes: () => api('/tenants/palettes/'),
  create: (data, file) =>
    file
      ? api('/tenants/tenant/', { method: 'POST', body: formDataFrom(data, { logo: file }), form: true })
      : api('/tenants/tenant/', { method: 'POST', body: cleanTenantPayload(data) }),
  update: (id, data, file) =>
    file
      ? api(`/tenants/tenant/${id}/`, { method: 'PATCH', body: formDataFrom(data, { logo: file }), form: true })
      : api(`/tenants/tenant/${id}/`, { method: 'PATCH', body: cleanTenantPayload(data) }),
  remove: (id) => api(`/tenants/tenant/${id}/`, { method: 'DELETE' }),
}

export const membershipsApi = {
  list: (tenantId) => api(`/tenants/tenants/${tenantId}/members/`),
  create: (tenantId, data) =>
    api(`/tenants/tenants/${tenantId}/members/`, { method: 'POST', body: data }),
  update: (tenantId, id, data) =>
    api(`/tenants/tenants/${tenantId}/members/${id}/`, { method: 'PATCH', body: data }),
  remove: (tenantId, id) => api(`/tenants/tenants/${tenantId}/members/${id}/`, { method: 'DELETE' }),
}

export const storefrontApi = {
  getStore: (slug) => api(`/public/${slug}/`, { auth: false }),
}

export const ordersApi = {
  createPublic: (slug, data) => api(`/orders/public/${slug}/`, { method: 'POST', body: data, auth: false }),
  list: (tenantId) => api(`/orders/tenants/${tenantId}/`),
  updateStatus: (tenantId, orderId, status) => api(`/orders/tenants/${tenantId}/${orderId}/status/`, { method: 'PATCH', body: { status } }),
}

const formDataFrom = (data, files = {}, keepEmpty = []) => {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data || {})) {
    if (value === undefined || value === null) continue
    if (value === '' && !keepEmpty.includes(key)) continue
    if (Array.isArray(value)) {
      // Listas (ej. purchase_channels) viajan como claves repetidas. Un arreglo
      // vacío necesita un valor para no confundirse con "sin cambios" en PATCH.
      if (value.length === 0) fd.append(key, '')
      else value.forEach((item) => fd.append(key, item))
      continue
    }
    fd.append(key, value)
  }
  for (const [key, file] of Object.entries(files)) {
    if (!file) continue
    // Varios archivos para un mismo campo (por ejemplo, fotos de producto).
    if (Array.isArray(file)) file.forEach((item) => item && fd.append(key, item))
    else fd.append(key, file)
  }
  return fd
}

export const paymentsApi = {
  list: () => api('/payments/'),
  create: (tenantId, data, file) =>
    api('/payments/', {
      method: 'POST',
      body: file
        ? formDataFrom({ ...data, tenant: tenantId }, { image: file })
        : { ...data, tenant: tenantId },
      form: !!file,
    }),
  activate: (id) => api(`/payments/${id}/activate/`, { method: 'POST' }),
}

// Datos de la cuenta bancaria de LibreDrop (fila única, editable por el
// superusuario desde el panel). Los dueños autenticados pueden leerlos.
export const billingApi = {
  get: () => api('/payments/billing/'),
  update: (data) => api('/payments/billing/', { method: 'PUT', body: data }),
}

// Precio y porcentaje vacíos viajan como null (el backend los
// acepta).
const cleanProductPayload = (data) => {
  const clean = { ...(data || {}) }
  for (const key of ['price', 'discount_percent', 'offer_ends_at']) {
    if (clean[key] === '') clean[key] = null
  }
  return clean
}

// Un producto puede tener hasta 5 fotos (image, image2 … image5). Aceptamos
// tanto un solo archivo como un objeto con las claves de cada foto.
const productFiles = (files) => {
  if (!files) return {}
  if (typeof File !== 'undefined' && files instanceof File) return { image: files }
  return files
}

const hasProductFiles = (files) => Object.values(files).some(Boolean)

const productFormBody = (data, files) =>
  formDataFrom(
    {
      ...data,
      // En multipart las relaciones vacías se representan con cadena vacía;
      // ProductSerializer la normaliza a null para poder quitarlas en PATCH.
      category: data?.category === null ? '' : data?.category,
      seasonal_category: data?.seasonal_category === null ? '' : data?.seasonal_category,
      // En multipart las listas no se interpretan como una lista JSON: el
      // backend recibe el orden de las fotos como texto y lo decodifica.
      photo_order: Array.isArray(data?.photo_order)
        ? JSON.stringify(data.photo_order)
        : data?.photo_order,
    },
    productFiles(files),
    ['price', 'discount_percent', 'offer_ends_at', 'category', 'seasonal_category'],
  )

export const catalogApi = {
  categories: {
    list: (tenantId) => api(`/catalog/tenants/${tenantId}/categories/`, { auth: true }),
    create: (tenantId, data) =>
      api(`/catalog/tenants/${tenantId}/categories/`, { method: 'POST', body: data }),
    update: (tenantId, id, data) =>
      api(`/catalog/tenants/${tenantId}/categories/${id}/`, { method: 'PATCH', body: data }),
    remove: (tenantId, id) =>
      api(`/catalog/tenants/${tenantId}/categories/${id}/`, { method: 'DELETE' }),
  },
  seasonalCategories: {
    list: (tenantId) => api(`/catalog/tenants/${tenantId}/seasonal-categories/`, { auth: true }),
    create: (tenantId, data) =>
      api(`/catalog/tenants/${tenantId}/seasonal-categories/`, { method: 'POST', body: data }),
    update: (tenantId, id, data) =>
      api(`/catalog/tenants/${tenantId}/seasonal-categories/${id}/`, { method: 'PATCH', body: data }),
    remove: (tenantId, id) =>
      api(`/catalog/tenants/${tenantId}/seasonal-categories/${id}/`, { method: 'DELETE' }),
  },
  products: {
    list: (tenantId) => api(`/catalog/tenants/${tenantId}/products/`),
    create: (tenantId, data, files) => {
      const form = hasProductFiles(productFiles(files))
      // En la creación las fotos se guardan en sus campos naturales; no hace
      // falta enviar photo_order (y algunos navegadores alteran listas en
      // multipart). El orden personalizado se conserva al editar productos.
      const productData = { ...data }
      delete productData.photo_order
      return api(`/catalog/tenants/${tenantId}/products/`, {
        method: 'POST',
        body: form ? productFormBody(productData, files) : cleanProductPayload(productData),
        form,
      })
    },
    update: (tenantId, id, data, files) => {
      const form = hasProductFiles(productFiles(files))
      return api(`/catalog/tenants/${tenantId}/products/${id}/`, {
        method: 'PATCH',
        body: form ? productFormBody(data, files) : cleanProductPayload(data),
        form,
      })
    },
    remove: (tenantId, id) =>
      api(`/catalog/tenants/${tenantId}/products/${id}/`, { method: 'DELETE' }),
    reorderFeatured: (tenantId, ids) =>
      api(`/catalog/tenants/${tenantId}/products/reorder-featured/`, {
        method: 'POST',
        body: { ids },
      }),
  },
}

// Número de WhatsApp de soporte de LibreDrop. Es un dato público (se muestra a los
// dueños para activar su cuenta), no un secreto. Formato internacional: +502 3623 7067.
export const SUPPORT_WHATSAPP = '+50236237067'

// Precio de la suscripción mensual en quetzales.
export const SUBSCRIPTION_PRICE = 100

export const formatPrice = (value) => {
  // Sin precio (null/undefined/vacío) no se muestra nada, en vez de "Q 0.00".
  if (value === null || value === undefined || value === '') return ''
  const amount = Number(value)
  if (Number.isNaN(amount)) return `Q ${value}`
  return `Q ${amount.toFixed(2)}`
}

export const waLink = (phone, message) => {
  const digits = String(phone || '').replace(/[^\d]/g, '')
  if (!digits) return '#'
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
