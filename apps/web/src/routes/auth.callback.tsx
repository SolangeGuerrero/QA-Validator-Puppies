import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  const navigate = useNavigate()
  const { handleOAuthCallback } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    handleOAuthCallback().then(({ ok, error }) => {
      if (ok) {
        navigate({ to: '/' })
      } else {
        setError(error ?? 'Authentication failed')
        setTimeout(() => navigate({ to: '/login' }), 3000)
      }
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0F' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      {error ? (
        <div style={{ textAlign: 'center', fontFamily: 'monospace' }}>
          <p style={{ color: '#FF5C39', marginBottom: 8 }}>{error}</p>
          <p style={{ color: '#5E5954', fontSize: 12 }}>Redirigiendo al login...</p>
        </div>
      ) : (
        <div style={{ width: 32, height: 32, border: '3px solid rgba(245,242,233,0.15)', borderTopColor: '#FAFAFA', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      )}
    </div>
  )
}
