const API_BASE_URL = '/api'

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

async function handleResponse(response) {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      data?.detail || `HTTP error! status: ${response.status}`,
      response.status,
      data
    )
  }

  return data
}

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function get(url, params = {}) {
  const queryString = new URLSearchParams(params).toString()
  const fullUrl = queryString ? `${url}?${queryString}` : url

  const response = await fetch(`${API_BASE_URL}${fullUrl}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  })

  return handleResponse(response)
}

async function post(url, body) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  })

  return handleResponse(response)
}

async function patch(url, body) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  })

  return handleResponse(response)
}

async function del(url) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  })

  if (response.status === 204) {
    return null
  }

  return handleResponse(response)
}

// Auth API
export const authApi = {
  register: (data) => post('/auth/register', data),
  login: (data) => post('/auth/login', data),
  me: () => get('/auth/me'),
}

// Expenses API
export const expensesApi = {
  list: (params) => get('/expenses', params),
  create: (data) => post('/expenses', data),
  get: (id) => get(`/expenses/${id}`),
  update: (id, data) => patch(`/expenses/${id}`, data),
  delete: (id) => del(`/expenses/${id}`),
}

// Categories API
export const categoriesApi = {
  list: () => get('/categories'),
  create: (data) => post('/categories', data),
  update: (id, data) => patch(`/categories/${id}`, data),
  delete: (id) => del(`/categories/${id}`),
}

// Analytics API
export const analyticsApi = {
  monthlySummary: () => get('/analytics/monthly-summary'),
  categoryBreakdown: () => get('/analytics/category-breakdown'),
  dashboardSummary: () => get('/analytics/dashboard-summary'),
}

export { ApiError }
