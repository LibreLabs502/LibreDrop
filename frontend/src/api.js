const TOKEN_KEY = 'libredrop_access'
const REFRESH_KEY = 'libredrop_refresh'

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY)
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY)

export const setTokens = (tokens) => {
  if (tokens.access) localStorage.setItem(TOKEN_KEY, tokens.access)
  if (tokens.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh)
}

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

function restoreTokensFromHash() {
  const hash = window.location.hash
  if (!hash.startsWith('#t=')) return
  const params = new URLSearchParams(hash.slice(1))
  const access = params.get('t')
  const refresh = params.get('r')
  if (access) {
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
    localStorage.setItem(TOKEN_KEY, access)
    window.location.replace(window.location.pathname + window.location.search)
  }
}

restoreTokensFromHash()

export const goToTenantAdmin = (domain) => {
  if (!domain) return false
  const port = window.location.port ? `:${window.location.port}` : ''
  const access = getAccessToken()
  const hash = access ? `#t=${encodeURIComponent(access)}&r=${encodeURIComponent(getRefreshToken() || '')}` : ''
  window.location.href = `${window.location.protocol}//${domain}${port}/admin${hash}`
  return true
}

export const apiBase = () => `${window.location.protocol}//${window.location.host}/api`

export const currentHost = () => window.location.hostname

export const hostOfDomain = (domain) => String(domain).split(':')[0].toLowerCase()

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
  register: (payload) => api('/accounts/register/', { method: 'POST', body: payload, auth: false }),
  login: (username, password) =>
    api('/accounts/login/', { method: 'POST', body: { username, password }, auth: false }),
  me: () => api('/accounts/user/'),
  update: (patch) => api('/accounts/user/', { method: 'PATCH', body: patch }),
}

export const storeApi = {
  info: () => api('/store/', { auth: false }),
}

export const tenantsApi = {
  list: () => api('/tenants/'),
  create: (data, file) =>
    file
      ? api('/tenants/', { method: 'POST', body: formDataFrom(data, { logo: file }), form: true })
      : api('/tenants/', { method: 'POST', body: data }),
  update: (id, data, file) =>
    file
      ? api(`/tenants/${id}/`, { method: 'PATCH', body: formDataFrom(data, { logo: file }), form: true })
      : api(`/tenants/${id}/`, { method: 'PATCH', body: data }),
  remove: (id) => api(`/tenants/${id}/`, { method: 'DELETE' }),
}

export const domainsApi = {
  list: () => api('/domains/'),
  create: (data) => api('/domains/', { method: 'POST', body: data }),
  update: (id, data) => api(`/domains/${id}/`, { method: 'PATCH', body: data }),
  remove: (id) => api(`/domains/${id}/`, { method: 'DELETE' }),
}

export const membershipsApi = {
  list: () => api('/memberships/'),
  create: (data) => api('/memberships/', { method: 'POST', body: data }),
  remove: (id) => api(`/memberships/${id}/`, { method: 'DELETE' }),
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

export const catalogApi = {
  categories: {
    list: () => api('/category/', { auth: false }),
    create: (data) => api('/category/', { method: 'POST', body: data }),
    update: (id, data) => api(`/category/${id}/`, { method: 'PATCH', body: data }),
    remove: (id) => api(`/category/${id}/`, { method: 'DELETE' }),
  },
  products: {
    list: () => api('/products/', { auth: false }),
    create: (data, file) =>
      api('/products/', {
        method: 'POST',
        body: file ? formDataFrom(data, { image: file }) : data,
        form: !!file,
      }),
    update: (id, data, file) =>
      api(`/products/${id}/`, {
        method: 'PATCH',
        body: file ? formDataFrom(data, { image: file }) : data,
        form: !!file,
      }),
    remove: (id) => api(`/products/${id}/`, { method: 'DELETE' }),
  },
}

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