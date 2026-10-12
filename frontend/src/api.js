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

export async function api(path, { method = 'GET', body, form = false, auth = true } = {}) {
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

const formDataFrom = (data, files = {}) => {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data || {})) {
    if (value !== undefined && value !== null && value !== '') fd.append(key, value)
  }
  for (const [key, file] of Object.entries(files)) {
    if (file) fd.append(key, file)
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
  products: {
    list: (tenantId) => api(`/catalog/tenants/${tenantId}/products/`),
    create: (tenantId, data, file) =>
      api(`/catalog/tenants/${tenantId}/products/`, {
        method: 'POST',
        body: file ? formDataFrom(data, { image: file }) : data,
        form: !!file,
      }),
    update: (tenantId, id, data, file) =>
      api(`/catalog/tenants/${tenantId}/products/${id}/`, {
        method: 'PATCH',
        body: file ? formDataFrom(data, { image: file }) : data,
        form: !!file,
      }),
    remove: (tenantId, id) =>
      api(`/catalog/tenants/${tenantId}/products/${id}/`, { method: 'DELETE' }),
  },
}

// Teléfono temporal de soporte (el de LibreLabs está roto por ahora).
export const SUPPORT_WHATSAPP = '+50239085258'

// Cuenta a la que se paga por transferencia/depósito. Reemplazar por los datos reales.
export const PAYMENT_ACCOUNT = 'la cuenta inicial de LibreLabs'

// Precio de la suscripción mensual en quetzales.
export const SUBSCRIPTION_PRICE = 100

export const formatPrice = (value) => {
  const amount = Number(value)
  if (Number.isNaN(amount)) return `Q ${value}`
  return `Q ${amount.toFixed(2)}`
}

export const waLink = (phone, message) => {
  const digits = String(phone || '').replace(/[^\d]/g, '')
  if (!digits) return '#'
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
