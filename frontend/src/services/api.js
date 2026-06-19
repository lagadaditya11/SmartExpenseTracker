const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000)

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.requestId = data?.request_id
  }
}

function getCookie(name) {
  const prefix = `${encodeURIComponent(name)}=`
  const item = document.cookie.split('; ').find((cookie) => cookie.startsWith(prefix))
  return item ? decodeURIComponent(item.slice(prefix.length)) : null
}

async function parseResponse(response) {
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(
      data?.message || data?.detail || `Request failed with status ${response.status}`,
      response.status,
      data,
    )
  }
  return data
}

async function request(path, options = {}, allowRefresh = true) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const method = options.method || 'GET'
  const csrfToken = getCookie('csrf_token')
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(method)
      ? { 'X-CSRF-Token': csrfToken }
      : {}),
    ...options.headers,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method,
      headers,
      credentials: 'include',
      signal: controller.signal,
    })

    if (response.status === 401 && allowRefresh && !path.startsWith('/auth/')) {
      try {
        await request('/auth/refresh', { method: 'POST' }, false)
        return request(path, options, false)
      } catch (refreshError) {
        window.dispatchEvent(new Event('auth:unauthorized'))
        throw refreshError
      }
    }

    return await parseResponse(response)
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('The request timed out. Please try again.', 0, null)
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function get(url, params = {}) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  const queryString = new URLSearchParams(entries).toString()
  return request(queryString ? `${url}?${queryString}` : url)
}

const post = (url, body) => request(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
const patch = (url, body) => request(url, { method: 'PATCH', body: JSON.stringify(body) })
const del = (url) => request(url, { method: 'DELETE' })

export const authApi = {
  register: (data) => post('/auth/register', data),
  login: (data) => post('/auth/login', data),
  logout: () => post('/auth/logout'),
  me: () => get('/auth/me'),
}

export const expensesApi = {
  list: (params) => get('/expenses', params),
  create: (data) => post('/expenses', data),
  get: (id) => get(`/expenses/${id}`),
  update: (id, data) => patch(`/expenses/${id}`, data),
  delete: (id) => del(`/expenses/${id}`),
}

export const categoriesApi = {
  list: () => get('/categories'),
  create: (data) => post('/categories', data),
  update: (id, data) => patch(`/categories/${id}`, data),
  delete: (id) => del(`/categories/${id}`),
}

export const analyticsApi = {
  monthlySummary: () => get('/analytics/monthly-summary'),
  categoryBreakdown: () => get('/analytics/category-breakdown'),
  dashboardSummary: () => get('/analytics/dashboard-summary'),
}

export { ApiError }
