import { useQuery } from '@tanstack/react-query'
import {
  Bot, CheckCircle2, XCircle, AlertCircle, Zap,
  Tag, Scale, Type, ShieldCheck, Hash, AlignLeft, ListOrdered,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Provider {
  id: string
  name: string
  model: string
  origin: string
  configured: boolean
  active: boolean
}

interface AgentsStatus {
  activeProvider: string
  providers: Provider[]
  stats: {
    completedValidations: number
    avgScore: number
    topCategory: string | null
    totalIssuesFound: number
  }
}

// ─── Static: what the model actually checks ───────────────────────────────────

const CATEGORIES = [
  {
    id: 'ingredient',
    icon: ListOrdered,
    label: 'Lista de ingredientes',
    color: '#FF5C39',
    checks: [
      'Cada ingrediente verificado letra por letra vs. documento',
      'Orden descendente por peso (reglamentario SENASA)',
      'Alérgenos en cursiva / destacados según normativa argentina',
      'Terminología exacta: "colorante" vs "color", "proteína cruda" vs "bruta"',
      'Sin ingredientes omitidos o agregados respecto al documento',
    ],
  },
  {
    id: 'nutrition',
    icon: Tag,
    label: 'Tabla nutricional',
    color: '#1565C0',
    checks: [
      'Cada valor numérico verificado vs. documento (calorías, proteínas, grasas, etc.)',
      'Unidades correctas (%, g, kcal) y su posición',
      'Base de cálculo (100g, 100ml, por porción) coincide con documento',
      'Humedad máxima y cenizas declarados si corresponde',
    ],
  },
  {
    id: 'codes',
    icon: Hash,
    label: 'Códigos y registros',
    color: '#8B5CF6',
    checks: [
      'Número SENASA presente y exacto',
      'Código EAN / código de barras presente',
      'Número de material SAP presente y correcto',
      'Códigos ZPCK / FERT presentes si el documento lo requiere',
    ],
  },
  {
    id: 'legal',
    icon: Scale,
    label: 'Declaraciones legales',
    color: '#D32F2F',
    checks: [
      'Nombre y dirección del fabricante presentes y exactos',
      'Declaración de peso neto: valor, unidad y posición',
      'Instrucciones de conservación coinciden con documento',
      'Formato "Consumir antes de:" según especificación',
      'Cada texto legal verificado palabra por palabra',
    ],
  },
  {
    id: 'brand',
    icon: ShieldCheck,
    label: 'Marca y producto',
    color: '#4527A0',
    checks: [
      'Nombre del producto coincide exactamente con el documento',
      'Descriptor de variante / sabor coincide',
      'Etapa de vida (cachorro, adulto, senior) coincide',
      'Sub-brand correctamente subordinado al master brand',
    ],
  },
  {
    id: 'formatting',
    icon: Type,
    label: 'Formato y tipografía',
    color: '#F57C00',
    checks: [
      'Cursiva aplicada donde el documento lo requiere',
      'Mayúsculas en los lugares requeridos por normativa',
      'Tamaño de fuente mínimo en textos legales',
      'Advertencias: si el texto es ilegible o muy pequeño, se reporta',
    ],
  },
  {
    id: 'missing',
    icon: AlignLeft,
    label: 'Elementos faltantes',
    color: '#2E7D32',
    checks: [
      'Todo elemento requerido por el documento que no aparece en el arte',
      'Verificación exhaustiva: sello, logo, registro, texto obligatorio',
      'Reportado como issue crítico si es requerimiento reglamentario',
    ],
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProviderCard({ provider }: { provider: Provider }) {
  const { t } = useTranslation('app')

  const statusIcon = provider.active
    ? <CheckCircle2 size={14} className="text-[#2E7D32] shrink-0" />
    : provider.configured
      ? <AlertCircle size={14} className="text-[#F57C00] shrink-0" />
      : <XCircle size={14} className="text-[#8C8782] shrink-0" />

  const statusLabel = provider.active
    ? t('agents.status.active')
    : provider.configured
      ? t('agents.status.configured')
      : t('agents.status.noKey')
  const statusColor = provider.active ? 'text-[#2E7D32]' : provider.configured ? 'text-[#F57C00]' : 'text-[#8C8782]'
  const statusBg = provider.active ? 'bg-[#E8F5E9]' : provider.configured ? 'bg-[#FFF3E0]' : 'bg-[#FAFAFA]'

  return (
    <div className={cn(
      'bg-white rounded-2xl border p-5 transition-all',
      provider.active
        ? 'border-[#FF5C39]/30 shadow-[0_0_0_1px_rgba(227,0,15,0.08),0_2px_8px_rgba(0,0,0,0.06)]'
        : 'border-[#E5E7EB] opacity-70',
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot size={15} className={provider.active ? 'text-[#FF5C39]' : 'text-[#8C8782]'} />
          <p className="font-semibold text-sm text-[#0A0A0F]">{provider.name}</p>
        </div>
        {provider.active && (
          <span className="text-[8px] font-mono font-bold bg-[#FF5C39] text-white px-2 py-0.5 rounded-full tracking-widest">
            {t('agents.status.active').toUpperCase()}
          </span>
        )}
      </div>

      <p className="font-mono text-[10px] text-[#5E5954] mb-1">{provider.model}</p>
      <p className="text-[10px] text-[#8C8782] mb-4">{provider.origin}</p>

      <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold', statusBg, statusColor)}>
        {statusIcon}
        {statusLabel}
      </div>
    </div>
  )
}

function CategoryCard({ cat }: { cat: typeof CATEGORIES[number] }) {
  const Icon = cat.icon
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-sm transition-all">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
          <Icon size={14} style={{ color: cat.color }} />
        </div>
        <p className="font-semibold text-sm text-[#0A0A0F]">{cat.label}</p>
        <span className="ml-auto font-mono text-[9px] text-[#8C8782]">{cat.checks.length} checks</span>
      </div>
      <ul className="space-y-1.5">
        {cat.checks.map(check => (
          <li key={check} className="flex items-start gap-2">
            <CheckCircle2 size={10} className="shrink-0 mt-0.5" style={{ color: cat.color }} />
            <span className="text-[11px] text-[#3D3A35] leading-snug">{check}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AgentsPage() {
  const { data, isLoading } = useQuery<AgentsStatus>({
    queryKey: ['agents-status'],
    queryFn: () => api.get('/agents'),
    staleTime: 1000 * 30,
  })
  const { t } = useTranslation('app')

  const totalChecks = CATEGORIES.reduce((s, c) => s + c.checks.length, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FF5C39]/10 flex items-center justify-center">
            <Bot size={18} className="text-[#FF5C39]" />
          </div>
          <div>
            <h1 className="text-[#0A0A0F] text-2xl font-bold">{t('agents.title')}</h1>
            <p className="text-[#5E5954] text-sm mt-0.5">
              {t('agents.subtitle', { count: totalChecks })}
            </p>
          </div>
        </div>

        {/* Stats pills */}
        {data && data.stats.completedValidations > 0 && (
          <div className="flex items-center gap-2">
            {[
              { label: t('agents.stats.validations'), value: data.stats.completedValidations },
              { label: t('agents.stats.avgScore'), value: `${data.stats.avgScore}%` },
              { label: t('agents.stats.issuesFound'), value: data.stats.totalIssuesFound },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-center shadow-sm">
                <p className="font-mono text-[9px] text-[#5E5954] tracking-widest">{label.toUpperCase()}</p>
                <p className="text-sm font-bold text-[#0A0A0F] mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Architecture note */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-[#0A0A0F] border border-white/[0.06]">
        <Zap size={14} className="text-[#8B5CF6] shrink-0 mt-0.5" />
        <p className="text-xs text-[#c5c1b9] leading-relaxed">
          <span className="text-white font-semibold">{t('agents.architecture.label')}</span>{' '}
          {t('agents.architecture.desc')}
        </p>
      </div>

      {/* Providers */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <p className="font-mono text-[10px] text-[#8B5CF6] tracking-widest">{t('agents.providers')}</p>
          <div className="h-px flex-1 bg-[#F3F4F6]" />
        </div>
        {isLoading ? (
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-[#FAFAFA] rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {data?.providers.map(p => <ProviderCard key={p.id} provider={p} />)}
          </div>
        )}
        <p className="text-[10px] text-[#8C8782] mt-3">
          {t('agents.changeProvider')} <code className="bg-[#FAFAFA] px-1 rounded text-[#3D3A35]">AI_PROVIDER</code> {t('agents.changeProviderSuffix')} <code className="bg-[#FAFAFA] px-1 rounded text-[#3D3A35]">apps/api/.env</code>.
        </p>
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <p className="font-mono text-[10px] text-[#8B5CF6] tracking-widest">{t('agents.categories', { count: totalChecks })}</p>
          <div className="h-px flex-1 bg-[#F3F4F6]" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {CATEGORIES.map(cat => <CategoryCard key={cat.id} cat={cat} />)}
        </div>
      </section>
    </div>
  )
}
