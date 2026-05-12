import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCircle2, XCircle, Clock, Moon, Sun } from 'lucide-react'
import { useRouterState, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useValidatingStore } from '@/stores/ui'
import { useThemeStore } from '@/stores/theme'
import { cn, timeAgo } from '@/lib/utils'
import type { ValidationListItem as ValidationItem } from '@/lib/types'

// ─── TopBar ───────────────────────────────────────────────────────────────────

const ROUTE_KEY_MAP: Record<string, string> = {
  '/': 'dashboard',
  '/upload': 'upload',
  '/products': 'products',
  '/brands': 'brands',
  '/rules': 'brands',
  '/reports': 'brands',
  '/agents': 'agents',
  '/settings': 'settings',
}

export function TopBar() {
  const { pathname } = useRouterState({ select: (s) => s.location })
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('app')

  const routeKey = ROUTE_KEY_MAP[pathname]
  const pageTitle = routeKey
    ? t(`topbar.${routeKey}.title`)
    : t('topbar.fallback')
  const pageSubtitle = routeKey
    ? t(`topbar.${routeKey}.subtitle`)
    : ''

  // ── Notifications state ───────────────────────────────────────────────────
  const [open, setOpen] = useState(false)
  const [seenAt, setSeenAt] = useState<number>(() => {
    const stored = localStorage.getItem('purina-notif-seen')
    return stored ? parseInt(stored, 10) : 0
  })

  const dropdownRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const token = useAuthStore(s => s.token)
  const isValidating = useValidatingStore(s => s.isValidating)
  const { theme, toggleTheme } = useThemeStore()

  const user = useAuthStore(s => s.user)

  const { data } = useQuery<ValidationItem[]>({
    queryKey: ['notifications-feed', user?.id],
    queryFn: () => api.get(`/validations?limit=8&userId=${user?.id}`),
    enabled: !!token && !!user?.id,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 15,
  })

  const prevValidatingRef = useRef(isValidating)
  useEffect(() => {
    if (prevValidatingRef.current === true && !isValidating) {
      queryClient.invalidateQueries({ queryKey: ['notifications-feed'] })
    }
    prevValidatingRef.current = isValidating
  }, [isValidating, queryClient])

  const items = data ?? []

  const unreadCount = items.filter(v => new Date((v.completedAt ?? v.createdAt)).getTime() > seenAt).length
  const hasUnread = unreadCount > 0

  // Play a short beep when unread count increases (new notification arrived while bell closed).
  // Uses WebAudio API — no asset file needed, works offline.
  const prevUnreadRef = useRef(unreadCount)
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current && !open) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12)
        gain.gain.setValueAtTime(0.0001, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3)
        osc.connect(gain).connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      } catch {
        // Audio blocked by browser autoplay policy — silent fallback
      }
    }
    prevUnreadRef.current = unreadCount
  }, [unreadCount, open])

  const handleBellClick = () => {
    setOpen(v => {
      if (!v) {
        const now = Date.now()
        setSeenAt(now)
        localStorage.setItem('purina-notif-seen', String(now))
      }
      return !v
    })
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Language toggle ───────────────────────────────────────────────────────
  const toggleLang = () => {
    const next = i18n.language === 'es' ? 'en' : 'es'
    i18n.changeLanguage(next)
    localStorage.setItem('purina-lang', next)
  }

  const currentLang = i18n.language === 'es' ? 'ES' : 'EN'
  const otherLang = i18n.language === 'es' ? 'EN' : 'ES'

  return (
    <header className="h-16 border-b border-[#E5E7EB] dark:border-white/10 bg-[#FAFAFA]/80 dark:bg-[#0A0A0F]/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h1 className="text-[#0A0A0F] font-semibold text-base leading-tight">{pageTitle}</h1>
        {pageSubtitle && <p className="text-[#5E5954] text-xs">{pageSubtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#5E5954] hover:text-[#3D3A35] hover:bg-white/60 transition-all"
          title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="h-9 px-3 rounded-lg border border-[#E5E7EB] flex items-center gap-1 text-xs font-mono font-medium hover:bg-white/60 transition-all"
          title={`Switch to ${otherLang}`}
        >
          <span className="text-[#FF5C39] font-bold">{currentLang}</span>
          <span className="text-[#E5E7EB]">|</span>
          <span className="text-[#8C8782]">{otherLang}</span>
        </button>

        {/* Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleBellClick}
            className="w-9 h-9 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#5E5954] hover:text-[#3D3A35] hover:bg-white/60 transition-all relative"
          >
            <Bell size={18} />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF5C39] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl border border-[#E5E7EB] shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-[#FAFAFA] flex items-center justify-between">
                <p className="font-semibold text-sm text-[#0A0A0F]">{t('notifications.title')}</p>
                {items.length > 0 && (
                  <span className="font-mono text-[9px] text-[#8C8782]">{items.length}</span>
                )}
              </div>

              {/* Items */}
              <div className="max-h-[340px] overflow-y-auto divide-y divide-[#FAFAFA]">
                {items.length === 0 ? (
                  <p className="text-xs text-[#8C8782] text-center py-8">{t('notifications.empty')}</p>
                ) : (
                  items.map(v => {
                    const isCompleted = v.status === 'completed'
                    const isFailed = v.status === 'failed'
                    const isNew = new Date((v.completedAt ?? v.createdAt)).getTime() > seenAt

                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          setOpen(false)
                          navigate({ to: '/validations/$validationId', params: { validationId: v.id } })
                        }}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#FFFFFF] transition-colors text-left"
                      >
                        <div className="shrink-0 mt-0.5">
                          {isCompleted ? (
                            <CheckCircle2 size={15} className="text-[#2E7D32]" />
                          ) : isFailed ? (
                            <XCircle size={15} className="text-[#D32F2F]" />
                          ) : (
                            <Clock size={15} className="text-[#F57C00]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#0A0A0F] truncate">
                            {v.asset?.fileName ?? '—'}
                          </p>
                          <p className="text-[10px] text-[#5E5954] truncate">
                            {v.asset?.product?.name ?? '—'}
                            {v.user && <span className="text-[#8C8782]"> · {v.user.name}</span>}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn(
                              'text-[9px] font-mono',
                              isCompleted ? 'text-[#2E7D32]' : isFailed ? 'text-[#D32F2F]' : 'text-[#F57C00]',
                            )}>
                              {isCompleted
                                ? t('notifications.completed')
                                : isFailed
                                  ? t('notifications.failed')
                                  : t('notifications.processing')}
                            </span>
                            {isCompleted && v.complianceScore !== null && (
                              <span className="text-[9px] font-mono text-[#5E5954]">
                                {t('notifications.score')}: {v.complianceScore}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[9px] text-[#8C8782]">
                            {timeAgo((v.completedAt ?? v.createdAt), i18n.language)}
                          </span>
                          {isNew && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C39]" />
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="px-4 py-2.5 border-t border-[#FAFAFA]">
                  <button
                    onClick={() => { setOpen(false); navigate({ to: '/brands' }) }}
                    className="text-[10px] text-[#8B5CF6] hover:text-[#5E5954] transition-colors font-medium"
                  >
                    {t('notifications.viewAll')} →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
