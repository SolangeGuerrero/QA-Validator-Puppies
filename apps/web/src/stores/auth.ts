import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazy init — no crash si las env vars no están configuradas todavía
let _client: SupabaseClient | null = null
function getClient(): SupabaseClient {
  if (!_client) {
    const url = import.meta.env.VITE_INSFORGE_URL
    const key = import.meta.env.VITE_INSFORGE_ANON_KEY
    if (!url || !key) {
      throw new Error('Configure VITE_INSFORGE_URL y VITE_INSFORGE_ANON_KEY en apps/web/.env')
    }
    _client = createClient(url, key)
  }
  return _client
}

interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
}

// Comma-separated list of email domains allowed via Google OAuth. Empty = allow all (demo mode).
// In production, set VITE_ALLOWED_DOMAINS=acme.com,other.com to restrict.
const ALLOWED_DOMAINS = (import.meta.env.VITE_ALLOWED_DOMAINS ?? '')
  .split(',')
  .map((d: string) => d.trim().toLowerCase())
  .filter(Boolean)

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<string | null>
  register: (email: string, password: string, name: string) => Promise<string | null>
  loginWithGoogle: () => Promise<string | null>
  handleOAuthCallback: () => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  setUser: (user: AuthUser, token: string) => void
  refreshSession: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data, error } = await getClient().auth.signInWithPassword({ email, password })
          if (error) {
            set({ isLoading: false })
            return error.message
          }
          if (data.user && data.session) {
            set({
              user: {
                id: data.user.id,
                email: data.user.email!,
                name: data.user.user_metadata?.name ?? email.split('@')[0],
                role: data.user.user_metadata?.role ?? 'analyst',
                avatar: data.user.user_metadata?.avatar_url,
              },
              token: data.session.access_token,
              isAuthenticated: true,
              isLoading: false,
            })
          }
          return null
        } catch {
          set({ isLoading: false })
          return 'Authentication failed'
        }
      },
      register: async (email, password, name) => {
        set({ isLoading: true })
        try {
          const { error } = await getClient().auth.signUp({
            email,
            password,
            options: { data: { name } },
          })
          set({ isLoading: false })
          if (error) return error.message
          return null
        } catch {
          set({ isLoading: false })
          return 'Registration failed'
        }
      },
      loginWithGoogle: async () => {
        const { error } = await getClient().auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) return error.message
        return null
      },
      handleOAuthCallback: async () => {
        try {
          const { data: { session }, error } = await getClient().auth.getSession()
          if (error || !session) return { ok: false, error: error?.message ?? 'No session' }

          const email = session.user.email ?? ''
          const domain = email.split('@')[1]?.toLowerCase() ?? ''
          if (!ALLOWED_DOMAINS.includes(domain)) {
            await getClient().auth.signOut()
            return { ok: false, error: `Dominio no autorizado: @${domain}` }
          }

          const apiUrl = import.meta.env.VITE_API_URL
          const res = await fetch(`${apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          if (!res.ok) return { ok: false, error: 'Failed to register user' }
          const dbUser = await res.json()

          set({
            user: {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              role: dbUser.role,
              avatar: session.user.user_metadata?.avatar_url,
            },
            token: session.access_token,
            isAuthenticated: true,
          })
          return { ok: true }
        } catch (err) {
          return { ok: false, error: String(err) }
        }
      },
      logout: async () => {
        try { await getClient().auth.signOut() } catch { /* no-op if not configured */ }
        set({ user: null, token: null, isAuthenticated: false })
      },
      setUser: (user, token) => set({ user, token, isAuthenticated: true }),
      refreshSession: async () => {
        try {
          const { data, error } = await getClient().auth.refreshSession()
          if (error || !data.session) return false
          set({ token: data.session.access_token, isAuthenticated: true })
          return true
        } catch {
          return false
        }
      },
    }),
    {
      name: 'purina-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
