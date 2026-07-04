import { supabase } from '@/lib/supabase'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  meta?: {
    requestId?: string
    timestamp?: string
    version?: string
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  return headers
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return {
        data: null,
        error: errorData?.error?.message ?? `HTTP ${response.status}`,
      }
    }

    const json = await response.json()
    return { data: json.data ?? json, error: null, meta: json.meta }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
