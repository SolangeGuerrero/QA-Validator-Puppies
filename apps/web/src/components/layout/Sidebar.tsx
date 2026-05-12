import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
import { LayoutDashboard, ScanEye, Package, Library, Settings, LogOut, Bot } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'

const NAV_ITEMS = [
  { icon: LayoutDashboard, key: 'nav.dashboard',  to: '/' as const },
  { icon: ScanEye,         key: 'nav.analysis',   to: '/upload' as const },
  { icon: Package,         key: 'nav.products',   to: '/products' as const },
  { icon: Library,         key: 'nav.library',    to: '/brands' as const },
  { icon: Bot,             key: 'nav.agents',     to: '/agents' as const },
  { icon: Settings,        key: 'nav.settings',   to: '/settings' as const },
]

interface SidebarProps {
  isValidating?: boolean
}

export function Sidebar({ isValidating }: SidebarProps) {
  const { pathname } = useRouterState({ select: (s) => s.location })
  const { user, logout } = useAuthStore()
  const { t } = useTranslation('app')
  const navigate = useNavigate()

  return (
    <aside className="w-[240px] shrink-0 h-screen bg-[#0A0A0F] flex flex-col border-r border-white/[0.04] sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <img src="/puppies-logo.svg" alt="Puppies" className="w-full h-auto object-contain" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {isValidating && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FF5C39]/10 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C39] animate-pulse" />
            <span className="font-mono text-[10px] text-[#FF5C39] tracking-widest">AI PROCESSING</span>
          </div>
        )}

        {NAV_ITEMS.map(({ icon: Icon, key, to }) => {
          const isActive = to === '/'
            ? pathname === '/'
            : pathname.startsWith(to)

          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#FF5C39]/10 text-[#FF5C39]'
                  : 'text-[#9C9690] hover:text-[#D4D0C8] hover:bg-white/[0.05]',
              )}
            >
              <Icon size={16} className="shrink-0" />
              {t(key)}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-[#8B5CF6]/30 flex items-center justify-center shrink-0">
            <span className="text-[#A78BFA] text-xs font-semibold">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#D4D0C8] text-xs font-medium truncate">{user?.name}</p>
            <p className="text-[#7A7672] text-[10px] truncate">{user?.email}</p>
          </div>
          <button
            onClick={async () => { await logout(); navigate({ to: '/login' }) }}
            className="text-[#7A7672] hover:text-[#D4D0C8] transition-colors"
            title={t('common.logout')}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
