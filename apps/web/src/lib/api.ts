import { useAuthStore } from '@/stores/auth'

const BASE_URL = '/api'

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const { token } = useAuthStore.getState()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (res.status === 401 && !isRetry) {
    const refreshed = await useAuthStore.getState().refreshSession()
    if (refreshed) return request<T>(path, options, true)
    await useAuthStore.getState().logout()
    throw new Error('Session expired')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }

  // 204 No Content / empty body → return undefined instead of crashing on res.json()
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  download: async (path: string, method: 'GET' | 'POST' = 'POST', isRetry = false): Promise<Blob> => {
    const { token } = useAuthStore.getState()
    if (!token) throw new Error('Not authenticated')
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 401 && !isRetry) {
      const refreshed = await useAuthStore.getState().refreshSession()
      if (refreshed) return api.download(path, method, true)
      await useAuthStore.getState().logout()
      throw new Error('Session expired')
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.blob()
  },
  upload: <T>(path: string, formData: FormData) => {
    const { token } = useAuthStore.getState()
    return fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }
      return res.json() as Promise<T>
    })
  },
}
