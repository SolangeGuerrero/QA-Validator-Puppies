import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  Settings, Users, Shield,
  Plus, Trash2, Check, X, ChevronDown, AlertCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'admin' | 'manager' | 'reviewer' | 'viewer'
type Tab  = 'general' | 'users'

interface User {
  id: string
  name: string
  email: string
  role: Role
  status: 'active' | 'pending'
  lastActive: string
}

const ROLE_META: Record<Role, { color: string; bg: string }> = {
  admin:    { color: '#D32F2F', bg: '#FEECEC' },
  manager:  { color: '#F57C00', bg: '#FFF3E0' },
  reviewer: { color: '#1565C0', bg: '#E3F2FD' },
  viewer:   { color: '#5E5954', bg: '#FAFAFA' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleSelect({
  value,
  onChange,
}: {
  value: Role
  onChange: (r: Role) => void
}) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation('app')
  const m = ROLE_META[value]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-[#3D3A35] hover:border-[#5E5954] transition-all"
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
        {t(`settings.users.roles.${value}.label`)}
        <ChevronDown size={11} className={cn('transition-transform', open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 w-56 bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden">
          {(Object.keys(ROLE_META) as Role[]).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => { onChange(r); setOpen(false) }}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#FFFFFF] transition-colors text-left border-b border-[#FAFAFA] last:border-0"
            >
              <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: ROLE_META[r].color }} />
              <div>
                <p className="text-xs font-semibold text-[#0A0A0F]">{t(`settings.users.roles.${r}.label`)}</p>
                <p className="text-[10px] text-[#5E5954] leading-snug">{t(`settings.users.roles.${r}.desc`)}</p>
              </div>
              {r === value && <Check size={13} className="ml-auto text-[#2E7D32] shrink-0 mt-0.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── General tab ─────────────────────────────────────────────────────────────

function GeneralTab() {
  const { t } = useTranslation('app')
  const orgFields = [
    { key: 'company', value: 'Puppies S.A. PetCare' },
    { key: 'country', value: 'Argentina' },
    { key: 'timezone', value: 'America/Argentina/Buenos_Aires' },
    { key: 'lang', value: 'Español (AR)' },
  ]
  const scoreFields = [
    { key: 'high', value: '80', color: '#2E7D32', bg: '#E8F5E9' },
    { key: 'mid',  value: '60', color: '#F57C00', bg: '#FFF3E0' },
    { key: 'low',  value: '0',  color: '#D32F2F', bg: '#FEECEC' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <p className="font-semibold text-[#0A0A0F] mb-4">{t('settings.general.org')}</p>
        <div className="grid grid-cols-2 gap-4">
          {orgFields.map(({ key, value }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-[10px] font-mono text-[#8B5CF6] tracking-widest">
                {t(`settings.general.fields.${key}`).toUpperCase()}
              </label>
              <input
                defaultValue={value}
                className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#0A0A0F] outline-none focus:border-[#FF5C39] focus:ring-2 focus:ring-[#FF5C39]/10 transition-all"
              />
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button className="px-5 h-9 bg-[#FF5C39] hover:bg-[#E54E2A] text-white text-sm font-medium rounded-xl transition-all">
            {t('common.save')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <p className="font-semibold text-[#0A0A0F] mb-1">{t('settings.general.score.title')}</p>
        <p className="text-xs text-[#5E5954] mb-4">{t('settings.general.score.subtitle')}</p>
        <div className="grid grid-cols-3 gap-4">
          {scoreFields.map(({ key, value, color, bg }) => (
            <div key={key} className="rounded-xl p-4" style={{ backgroundColor: bg }}>
              <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color }}>
                {t(`settings.general.score.${key}`).toUpperCase()}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue={value}
                  className="w-16 h-8 px-2 rounded-lg border bg-white text-sm font-semibold outline-none text-center"
                  style={{ borderColor: color, color }}
                />
                <span className="text-sm font-semibold" style={{ color }}>%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Users tab ────────────────────────────────────────────────────────────────

interface ApiUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

function UsersTab() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('app')
  const { data: apiUsers = [] } = useQuery<ApiUser[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/auth/users'),
  })

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('reviewer')
  const [inviteError, setInviteError] = useState<string | null>(null)

  const inviteMutation = useMutation({
    mutationFn: (payload: { email: string; role: Role }) =>
      api.post('/auth/invites', payload),
    onSuccess: () => {
      setInviteEmail('')
      setShowInvite(false)
      setInviteError(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: Error) => setInviteError(err.message),
  })

  const users: User[] = apiUsers.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: (u.role as Role) in ROLE_META ? (u.role as Role) : 'viewer',
    status: 'active' as const,
    lastActive: '—',
  }))

  const updateRole = (id: string, role: Role) => {
    queryClient.setQueryData<ApiUser[]>(['users'], prev =>
      prev?.map(u => u.id === id ? { ...u, role } : u) ?? prev
    )
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/auth/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: (err: Error) => alert(err.message || 'Failed to delete user'),
  })

  const removeUser = (id: string) => {
    const u = users.find(x => x.id === id)
    if (!u) return
    if (!confirm(`Eliminar a ${u.name} (${u.email})?`)) return
    deleteMutation.mutate(id)
  }

  return (
    <div className="space-y-4">
      {/* Role definitions */}
      <div className="grid grid-cols-4 gap-3">
        {(Object.keys(ROLE_META) as Role[]).map(role => {
          const m = ROLE_META[role]
          return (
            <div key={role} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={13} style={{ color: m.color }} />
                <span className="font-semibold text-sm text-[#0A0A0F]">{t(`settings.users.roles.${role}.label`)}</span>
              </div>
              <p className="text-[10px] text-[#5E5954] leading-relaxed">{t(`settings.users.roles.${role}.desc`)}</p>
              <p className="font-mono text-[10px] mt-2" style={{ color: m.color }}>
                {users.filter(u => u.role === role).length} {t('settings.users.members')}
              </p>
            </div>
          )
        })}
      </div>

      {/* Users table — no overflow-hidden so role-select dropdown can escape */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB]">
        <div className="px-5 py-4 border-b border-[#FAFAFA] flex items-center justify-between rounded-t-2xl">
          <div>
            <p className="font-semibold text-[#0A0A0F]">{t('settings.users.team')}</p>
            <p className="text-xs text-[#5E5954]">{users.length} {t('settings.users.members')}</p>
          </div>
          <button
            onClick={() => setShowInvite(v => !v)}
            className="flex items-center gap-2 px-4 h-9 bg-[#FF5C39] hover:bg-[#E54E2A] text-white text-sm font-medium rounded-xl transition-all"
          >
            <Plus size={14} /> {t('settings.users.inviteBtn')}
          </button>
        </div>

        {/* Invite form */}
        {showInvite && (
          <div className="px-5 py-4 bg-[#FFFFFF] border-b border-[#FAFAFA] space-y-3">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-mono text-[#8B5CF6] tracking-widest">{t('settings.users.inviteLabel')}</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#0A0A0F] outline-none focus:border-[#FF5C39] focus:ring-2 focus:ring-[#FF5C39]/10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[#8B5CF6] tracking-widest">{t('settings.users.roleLabel')}</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as Role)}
                  className="h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#0A0A0F] outline-none appearance-none cursor-pointer"
                >
                  {(Object.keys(ROLE_META) as Role[]).map(r => (
                    <option key={r} value={r}>{t(`settings.users.roles.${r}.label`)}</option>
                  ))}
                </select>
              </div>
              <button
                disabled={inviteMutation.isPending}
                onClick={() => {
                  if (!inviteEmail) return
                  setInviteError(null)
                  inviteMutation.mutate({ email: inviteEmail, role: inviteRole })
                }}
                className="h-9 px-4 bg-[#0A0A0F] hover:bg-[#3D3A35] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2"
              >
                <Check size={13} /> {inviteMutation.isPending ? '...' : t('settings.users.invite')}
              </button>
              <button
                onClick={() => { setShowInvite(false); setInviteError(null) }}
                className="h-9 w-9 rounded-xl border border-[#E5E7EB] text-[#5E5954] hover:bg-[#FAFAFA] flex items-center justify-center transition-all"
              >
                <X size={13} />
              </button>
            </div>
            {inviteError && (
              <div className="flex items-center gap-2 text-xs text-[#D32F2F]">
                <AlertCircle size={13} className="shrink-0" /> {inviteError}
              </div>
            )}
          </div>
        )}

        {/* Table header */}
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-5 py-2.5 border-b border-[#FAFAFA] bg-[#FFFFFF]">
          {[
            t('settings.users.table.user'),
            t('settings.users.table.email'),
            t('settings.users.table.role'),
            t('settings.users.table.lastActive'),
            '',
          ].map(h => (
            <p key={h} className="font-mono text-[9px] text-[#8B5CF6] tracking-widest">{h.toUpperCase()}</p>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#FAFAFA]">
          {users.map(u => (
            <div key={u.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-[#FFFFFF] transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center shrink-0">
                  <span className="text-[#8B5CF6] text-xs font-semibold">{u.name.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#0A0A0F] truncate">{u.name}</p>
                  {u.status === 'pending' && (
                    <span className="text-[9px] font-mono text-[#F57C00]">{t('settings.users.pending')}</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#5E5954] truncate">{u.email}</p>
              <RoleSelect value={u.role} onChange={r => updateRole(u.id, r)} />
              <p className="text-xs text-[#5E5954]">{u.lastActive}</p>
              <button
                onClick={() => removeUser(u.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8C8782] hover:text-[#D32F2F] hover:bg-[#FEECEC] transition-all"
                title={t('common.delete')}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main SettingsPage ────────────────────────────────────────────────────────

const TABS: { id: Tab; icon: React.ElementType }[] = [
  { id: 'general', icon: Settings },
  { id: 'users',   icon: Users    },
]

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('general')
  const { t } = useTranslation('app')

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[#0A0A0F] flex items-center justify-center">
          <Settings size={17} className="text-[#8B5CF6]" />
        </div>
        <div>
          <h1 className="text-[#0A0A0F] text-2xl font-bold">{t('settings.title')}</h1>
          <p className="text-[#5E5954] text-sm mt-0.5">{t('settings.subtitle')}</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-0 bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden w-fit mb-6">
        {TABS.map(({ id, icon: Icon }, idx) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all',
              idx > 0 ? 'border-l border-[#E5E7EB]' : '',
              tab === id
                ? 'bg-[#0A0A0F] text-[#c5c1b9]'
                : 'text-[#5E5954] hover:bg-[#FAFAFA] hover:text-[#3D3A35]',
            )}
          >
            <Icon size={14} />
            {t(`settings.tabs.${id}`)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'general' && <GeneralTab />}
      {tab === 'users'   && <UsersTab />}
    </div>
  )
}
