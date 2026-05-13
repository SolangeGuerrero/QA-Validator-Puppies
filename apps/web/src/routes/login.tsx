import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Sparkles, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { login, register, loginWithGoogle, isLoading } = useAuthStore()
  const { t } = useTranslation('app')
  // Registration is hidden by default — surfaced only via /login?register=1
  const registerEnabled = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('register') === '1'
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mode === 'register' && registerEnabled) {
      const err = await register(email, password, name)
      if (err) {
        setError(err)
      } else {
        setRegistered(true)
      }
      return
    }
    const err = await login(email, password)
    if (err) {
      setError(err)
    } else {
      navigate({ to: '/' })
    }
  }

  const switchMode = (next: 'login' | 'register') => {
    setMode(next)
    setError(null)
    setRegistered(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — dark hero with radial gradient orbs */}
      <div className="hidden lg:flex w-[45%] bg-[#0A0A0F] flex-col justify-between p-12 relative overflow-hidden">
        {/* Radial gradient orbs — coral top-left, violet bottom-right */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `
            radial-gradient(60% 50% at 15% 20%, rgba(255, 92, 57, 0.35) 0%, transparent 60%),
            radial-gradient(50% 50% at 85% 85%, rgba(139, 92, 246, 0.35) 0%, transparent 60%)
          `,
        }} />
        {/* Subtle noise grain for texture */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '3px 3px',
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #FF5C39 0%, #8B5CF6 100%)' }}>
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[#FAFAFA] font-bold text-lg tracking-tight">Puppies</p>
              <p className="text-[#9CA3AF] text-[10px] font-mono tracking-[0.2em]">QA VALIDATOR</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <p className="font-mono text-[10px] text-[#8B5CF6] tracking-widest mb-3">+ AI COMPLIANCE PLATFORM</p>
            <h2 className="text-[#FAFAFA] text-3xl font-light leading-tight">
              {t('login.tagline')}<br />
              <span className="text-[#A78BFA]">{t('login.taglineHighlight')}</span>
            </h2>
            <p className="text-[#5E5954] text-sm mt-4 leading-relaxed max-w-xs">
              {t('login.taglineDesc')}
            </p>
          </div>

          <div className="space-y-3">
            {[
              { key: 'brand' },
              { key: 'legal' },
              { key: 'regulatory' },
            ].map(({ key }) => (
              <div key={key} className="flex items-start gap-3 bg-white/[0.03] rounded-lg p-3">
                <div className="w-1 h-1 rounded-full bg-[#8B5CF6] mt-2 shrink-0" />
                <div>
                  <p className="text-[#c5c1b9] text-xs font-medium">{t(`login.features.${key}.label`)}</p>
                  <p className="text-[#5E5954] text-[11px] leading-relaxed">{t(`login.features.${key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[#3A3A38] text-[11px]">© 2026 Puppies S.A. — Demo project</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 bg-[#FAFAFA] flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #FF5C39 0%, #8B5CF6 100%)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-[#0A0A0F]">Puppies QA</span>
          </div>

          <div className="mb-8">
            <h1 className="text-[#0A0A0F] text-2xl font-semibold">
              {mode === 'login' ? t('login.welcome') : 'Crear cuenta'}
            </h1>
            <p className="text-[#8C8782] text-sm mt-1">
              {mode === 'login' ? t('login.signIn') : 'Completá tus datos para registrarte'}
            </p>
          </div>

          {registered ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 size={36} className="text-[#2E7D32]" />
              <p className="text-[#0A0A0F] font-semibold">¡Cuenta creada!</p>
              <p className="text-[#8C8782] text-sm">Revisá tu email para confirmar tu cuenta y luego iniciá sesión.</p>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="mt-2 text-sm text-[#FF5C39] font-medium hover:underline"
              >
                Ir al inicio de sesión
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-[#D32F2F]">
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                  </div>
                )}

                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#5E5954]">Nombre completo</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre"
                      required
                      className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#0A0A0F] text-sm placeholder:text-[#C0BDB6] outline-none focus:border-[#FF5C39] focus:ring-2 focus:ring-[#FF5C39]/10 transition-all"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#5E5954]">{t('login.email')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@puppies.dev"
                    required
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[#0A0A0F] text-sm placeholder:text-[#C0BDB6] outline-none focus:border-[#FF5C39] focus:ring-2 focus:ring-[#FF5C39]/10 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#5E5954]">{t('login.password')}</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={mode === 'register' ? 8 : undefined}
                      className="w-full h-10 px-3 pr-10 rounded-lg border border-[#E5E7EB] bg-white text-[#0A0A0F] text-sm placeholder:text-[#C0BDB6] outline-none focus:border-[#FF5C39] focus:ring-2 focus:ring-[#FF5C39]/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8782] hover:text-[#5E5954]"
                    >
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C39]/20 hover:shadow-[#8B5CF6]/30 hover:-translate-y-px active:translate-y-0"
                  style={{ background: 'linear-gradient(135deg, #FF5C39 0%, #8B5CF6 100%)' }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('login.submitting')}
                    </>
                  ) : mode === 'login' ? t('login.submit') : 'Crear cuenta'}
                </button>
              </form>

              {/* Demo mode quick access — only shown when VITE_DEMO_MODE=true */}
              {import.meta.env.VITE_DEMO_MODE === 'true' && mode === 'login' && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={async () => {
                    setError(null)
                    const err = await login('demo@puppies.dev', 'Demo2026!')
                    if (err) setError(err)
                    else navigate({ to: '/' })
                  }}
                  className="w-full h-10 mt-3 border-2 border-dashed border-[#FF5C39]/30 hover:border-[#FF5C39]/60 hover:bg-[#FF5C39]/[0.04] text-[#FF5C39] text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} />
                  Try the demo
                </button>
              )}

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E7EB]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#FAFAFA] px-3 text-[11px] text-[#8C8782]">{t('common.or')}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={async () => { setError(null); const err = await loginWithGoogle(); if (err) setError(err) }}
                className="w-full h-11 border border-[#E5E7EB] bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed text-[#0A0A0F] text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </button>

              {registerEnabled && (
                <p className="text-center text-xs text-[#8C8782] mt-5">
                  {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
                  <button
                    type="button"
                    onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                    className="text-[#FF5C39] font-medium hover:underline"
                  >
                    {mode === 'login' ? 'Registrarse' : 'Iniciar sesión'}
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
