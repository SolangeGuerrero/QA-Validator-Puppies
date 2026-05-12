import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from '@tanstack/react-router'
import {
  Plus,
  ChevronDown,
  ChevronRight,
  BarChart3,
  FileText,
  Download,
  Loader2,
  ExternalLink,
  Shield,
  BookOpen,
  CheckCircle2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn, downloadBlob } from '@/lib/utils'
import { api } from '@/lib/api'
import type { ValidationListItem } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandSummary {
  brand: string
  productCount: number
  assetCount: number
  avgScore: number | null
}

// ─── Static config (rules are product config, not DB data) ───────────────────

interface Rule {
  id: string
  category: string
  title: string
  description: string
  severity: 'critical' | 'warning' | 'info'
  method: 'auto' | 'manual'
}

const RULES: Rule[] = [
  // Ingredientes
  {
    id: 'r1',
    category: 'Ingredientes',
    title: 'Lista de ingredientes verificada letra por letra',
    description: 'Cada ingrediente del arte debe coincidir exactamente con el documento de referencia: ortografía, mayúsculas y orden.',
    severity: 'critical',
    method: 'auto',
  },
  {
    id: 'r2',
    category: 'Ingredientes',
    title: 'Orden descendente por peso (SENASA)',
    description: 'Los ingredientes deben listarse de mayor a menor según su peso, tal como requiere la normativa argentina.',
    severity: 'critical',
    method: 'auto',
  },
  {
    id: 'r3',
    category: 'Ingredientes',
    title: 'Alérgenos destacados en cursiva',
    description: 'Según la normativa argentina, los ingredientes alérgenos deben estar resaltados (cursiva o negrita).',
    severity: 'critical',
    method: 'auto',
  },
  {
    id: 'r4',
    category: 'Ingredientes',
    title: 'Terminología exacta vs. documento',
    description: 'Verificar diferencias sutiles: "proteína cruda" vs "bruta", "colorante" vs "color", etc.',
    severity: 'warning',
    method: 'auto',
  },
  // Nutrición
  {
    id: 'r5',
    category: 'Nutrición',
    title: 'Valores nutricionales exactos',
    description: 'Cada valor de la tabla nutricional (proteínas, grasas, carbohidratos, humedad, cenizas) debe coincidir exactamente con el documento.',
    severity: 'critical',
    method: 'auto',
  },
  {
    id: 'r6',
    category: 'Nutrición',
    title: 'Unidades y base de cálculo correctas',
    description: 'Verificar unidades (%, g, kcal) y base (100g, 100ml, por porción) contra el documento.',
    severity: 'warning',
    method: 'auto',
  },
  // Códigos
  {
    id: 'r7',
    category: 'Códigos',
    title: 'Número SENASA presente y exacto',
    description: 'El número de registro SENASA debe estar presente en el arte y coincidir exactamente con el documento.',
    severity: 'critical',
    method: 'auto',
  },
  {
    id: 'r8',
    category: 'Códigos',
    title: 'Código EAN / código de barras presente',
    description: 'El código EAN debe aparecer en el arte.',
    severity: 'critical',
    method: 'auto',
  },
  {
    id: 'r9',
    category: 'Códigos',
    title: 'Número de material SAP correcto',
    description: 'El código de material SAP (número interno) debe coincidir con el documento.',
    severity: 'warning',
    method: 'auto',
  },
  // Legal
  {
    id: 'r10',
    category: 'Legal',
    title: 'Nombre y dirección del fabricante',
    description: 'Razón social y domicilio del fabricante/importador deben estar presentes y ser exactos.',
    severity: 'critical',
    method: 'auto',
  },
  {
    id: 'r11',
    category: 'Legal',
    title: 'Declaración de peso neto',
    description: 'El peso neto declarado, su unidad y su posición en el envase deben coincidir con el documento.',
    severity: 'critical',
    method: 'auto',
  },
  {
    id: 'r12',
    category: 'Legal',
    title: 'Instrucciones de conservación',
    description: 'Las instrucciones de almacenamiento deben coincidir con las especificadas en el documento.',
    severity: 'warning',
    method: 'auto',
  },
  // Marca
  {
    id: 'r13',
    category: 'Marca',
    title: 'Nombre del producto exacto',
    description: 'El nombre del producto en el arte debe coincidir ortográficamente con el documento de referencia.',
    severity: 'critical',
    method: 'auto',
  },
  {
    id: 'r14',
    category: 'Marca',
    title: 'Etapa de vida y variante correctas',
    description: 'Descriptores como "Cachorro", "Adulto", "Senior" y el sabor/variante deben coincidir con el documento.',
    severity: 'critical',
    method: 'auto',
  },
  // Formato
  {
    id: 'r15',
    category: 'Formato',
    title: 'Cursiva donde el documento lo requiere',
    description: 'Los textos que el documento indica en cursiva deben aparecer en cursiva en el arte.',
    severity: 'warning',
    method: 'auto',
  },
  {
    id: 'r16',
    category: 'Formato',
    title: 'Tamaño mínimo de fuente en textos legales',
    description: 'Los textos reglamentarios deben ser legibles; si son demasiado pequeños se reporta como advertencia.',
    severity: 'warning',
    method: 'auto',
  },
]

const CATEGORY_ORDER = ['Ingredientes', 'Nutrición', 'Códigos', 'Legal', 'Marca', 'Formato']

const BRAND_COLORS = ['#FF5C39', '#1565C0', '#4527A0', '#AD1457', '#2E7D32', '#F57C00', '#0097A7']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBrandColor(index: number) {
  return BRAND_COLORS[index % BRAND_COLORS.length]
}

function getBrandInitials(brand: string) {
  return brand.split(' ').map(w => w[0] ?? '').join('').substring(0, 2).toUpperCase()
}

function scoreColor(score: number) {
  if (score >= 85) return { text: 'text-[#2E7D32]', bg: 'bg-[#E8F5E9]' }
  if (score >= 75) return { text: 'text-[#F57C00]', bg: 'bg-[#FFF3E0]' }
  return { text: 'text-[#D32F2F]', bg: 'bg-[#FEECEC]' }
}

function scoreFill(score: number) {
  if (score >= 85) return '#2E7D32'
  if (score >= 75) return '#F57C00'
  return '#D32F2F'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const SEVERITY_STYLES = {
  critical: { dot: 'bg-[#D32F2F]', badge: 'bg-[#FEECEC] text-[#D32F2F]' },
  warning:  { dot: 'bg-[#F57C00]', badge: 'bg-[#FFF3E0] text-[#F57C00]' },
  info:     { dot: 'bg-[#1565C0]', badge: 'bg-[#E3F2FD] text-[#1565C0]' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] text-[#8B5CF6] tracking-[0.15em] uppercase">
      {children}
    </p>
  )
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#FAFAFA] text-[#6B6760] font-mono text-[10px] font-semibold min-w-[22px]">
      {count}
    </span>
  )
}

// ─── Section: Brands ─────────────────────────────────────────────────────────

function BrandsSection() {
  const navigate = useNavigate()
  const { t } = useTranslation('app')
  const { data: brands = [], isLoading } = useQuery<BrandSummary[]>({
    queryKey: ['product-brands'],
    queryFn: () => api.get('/products/brands'),
  })

  return (
    <section className="border-t border-[#F3F4F6] pt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#8B5CF6]" />
            <SectionLabel>{t('library.brands.title')}</SectionLabel>
          </div>
          <CountBadge count={brands.length} />
          <h2 className="text-[#0F0F0D] text-xl font-bold">{t('library.brands.title').toUpperCase()}</h2>
        </div>
        <button
          onClick={() => navigate({ to: '/products' })}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#FF5C39] hover:bg-[#E54E2A] text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-[#FF5C39]/20"
        >
          <Plus size={14} strokeWidth={2.5} />
          {t('products.addProduct')}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-52 bg-[#FAFAFA] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <p className="text-sm text-[#6B6760] py-8 text-center">
          {t('library.brands.noData')}
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {brands.map((brand, idx) => {
            const color = getBrandColor(idx)
            const initials = getBrandInitials(brand.brand)
            const score = brand.avgScore
            const sc = score !== null ? scoreColor(score) : { text: 'text-[#6B6760]', bg: 'bg-[#FAFAFA]' }

            return (
              <div
                key={brand.brand}
                onClick={() => navigate({ to: '/products' })}
                className="group bg-white rounded-2xl border border-[#F3F4F6] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer"
              >
                <div className="h-2 w-full" style={{ backgroundColor: color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm select-none"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', sc.bg, sc.text)}>
                      {score !== null ? `${score}%` : '—'}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#0F0F0D] text-sm mb-1 leading-snug">{brand.brand}</h3>
                  <p className="text-[#6B6760] text-xs leading-relaxed mb-4">
                    {brand.productCount} {t('library.brands.products')}
                  </p>

                  {score !== null && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-[#6B6760] tracking-widest">COMPLIANCE</span>
                        <span className={cn('text-xs font-bold', sc.text)}>{score}%</span>
                      </div>
                      <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${score}%`, backgroundColor: scoreFill(score) }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-[#FAFAFA] flex items-center justify-between">
                    <span className="font-mono text-[9px] text-[#6B6760]">{brand.assetCount} {t('library.brands.assets').toUpperCase()}</span>
                    <span className="text-[10px] text-[#6B6760] group-hover:text-[#FF5C39] transition-colors font-semibold">
                      {t('library.brands.viewProducts')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ─── Section: Validation Rules ────────────────────────────────────────────────

function RulesSection() {
  const { t } = useTranslation('app')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORY_ORDER)
  )

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) {
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }

  const totalRules = RULES.length
  const categoryCounts = CATEGORY_ORDER.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = RULES.filter(r => r.category === cat).length
    return acc
  }, {})
  const maxCount = Math.max(...Object.values(categoryCounts))

  return (
    <section className="border-t border-[#F3F4F6] pt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#8B5CF6]" />
            <SectionLabel>{t('library.rules.title')}</SectionLabel>
          </div>
          <CountBadge count={totalRules} />
          <h2 className="text-[#0F0F0D] text-xl font-bold">{t('library.rules.title').toUpperCase()}</h2>
        </div>
        <span className="text-xs text-[#6B6760] font-mono">{t('library.rules.activeRules', { count: RULES.length })}</span>
      </div>

      <div className="bg-[#FAFAFA] rounded-2xl p-5 mb-6">
        <p className="font-mono text-[10px] text-[#8B5CF6] tracking-[0.15em] mb-4">DISTRIBUCIÓN POR CATEGORÍA</p>
        <div className="space-y-3">
          {CATEGORY_ORDER.map((cat) => {
            const count = categoryCounts[cat] ?? 0
            const pct = Math.round((count / maxCount) * 100)
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-[#3D3A35] w-24 shrink-0">{cat}</span>
                <div className="flex-1 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: '#8B5CF6' }}
                  />
                </div>
                <span className="font-mono text-[10px] text-[#6B6760] w-14 text-right">
                  {count}/{totalRules}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        {CATEGORY_ORDER.filter((cat) => RULES.some((r) => r.category === cat)).map((category) => {
          const categoryRules = RULES.filter((r) => r.category === category)
          const isOpen = expandedCategories.has(category)

          return (
            <div key={category} className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#FFFFFF] transition-colors text-left"
              >
                {isOpen ? (
                  <ChevronDown size={14} className="text-[#6B6760] shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-[#6B6760] shrink-0" />
                )}
                <span className="font-mono text-[10px] text-[#8B5CF6] tracking-[0.15em] uppercase">
                  {category}
                </span>
                <CountBadge count={categoryRules.length} />
                <span className="flex-1" />
                <span className="text-[10px] text-[#6B6760]">
                  {isOpen ? t('common.close') : t('common.view')}
                </span>
              </button>

              {isOpen && (
                <div className="divide-y divide-[#FAFAFA] border-t border-[#F3F4F6]">
                  {categoryRules.map((rule) => {
                    const sev = SEVERITY_STYLES[rule.severity]
                    return (
                      <div
                        key={rule.id}
                        className="px-5 py-3.5 flex items-start gap-3 hover:bg-[#FFFFFF] transition-colors"
                      >
                        <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', sev.dot)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-[#0F0F0D] leading-snug flex-1">
                              {rule.title}
                            </p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold capitalize', sev.badge)}>
                                {rule.severity}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#FAFAFA] text-[#6B6760]">
                                {rule.method === 'auto' ? 'Auto' : 'Manual'}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-[#6B6760] leading-relaxed mt-0.5">{rule.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Section: Reports ────────────────────────────────────────────────────────

function ReportsSection() {
  const { t } = useTranslation('app')
  const { data: validations = [], isLoading } = useQuery<ValidationListItem[]>({
    queryKey: ['validations-library'],
    queryFn: () => api.get('/validations?limit=20'),
  })
  const [exportingAll, setExportingAll] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const completed = validations.filter(v => v.status === 'completed')

  async function downloadOne(id: string, fileName: string) {
    setDownloadingId(id)
    try {
      const blob = await api.download(`/validations/${id}/report`)
      downloadBlob(blob, `reporte-${fileName.replace(/\.[^.]+$/, '')}.pdf`)
    } catch (err) {
      console.error('[download]', err)
      alert('No se pudo generar el PDF. Revisá los logs de la API.')
    } finally {
      setDownloadingId(null)
    }
  }

  async function exportAll() {
    if (completed.length === 0) {
      alert('No hay validaciones completadas para exportar. Ejecutá una validación primero.')
      return
    }
    setExportingAll(true)
    let exported = 0
    try {
      for (const v of completed) {
        try {
          const blob = await api.download(`/validations/${v.id}/report`)
          downloadBlob(blob, `reporte-${(v.asset?.fileName ?? v.id).replace(/\.[^.]+$/, '')}.pdf`)
          exported++
          await new Promise(r => setTimeout(r, 500))
        } catch (err) {
          console.error(`[export] validation ${v.id}:`, err)
        }
      }
      if (exported === 0) alert('No se pudo generar ningún PDF. Revisá los logs de la API.')
    } finally {
      setExportingAll(false)
    }
  }

  return (
    <section className="border-t border-[#F3F4F6] pt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-[#8B5CF6]" />
            <SectionLabel>{t('library.reports.title')}</SectionLabel>
          </div>
          <CountBadge count={completed.length} />
          <h2 className="text-[#0F0F0D] text-xl font-bold">{t('library.reports.title').toUpperCase()}</h2>
        </div>
        <button
          onClick={exportAll}
          disabled={exportingAll}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#FAFAFA] disabled:opacity-50 disabled:cursor-not-allowed text-[#0F0F0D] text-sm font-semibold rounded-xl border border-[#F3F4F6] transition-all shadow-sm"
        >
          {exportingAll ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          {exportingAll ? `${t('common.loading')} ${completed.length}...` : t('library.reports.exportAll')}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_80px_110px_90px_80px] gap-4 px-5 py-3 bg-[#FAFAFA] border-b border-[#F3F4F6]">
          {[t('library.reports.table.art'), 'Marca', 'Score', t('library.reports.table.score'), t('library.reports.table.date'), ''].map((col) => (
            <span key={col} className="font-mono text-[10px] text-[#8B5CF6] tracking-[0.15em] uppercase">
              {col}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-[#6B6760] text-sm">{t('common.loading')}</div>
        ) : validations.length === 0 ? (
          <div className="p-8 text-center text-[#6B6760] text-sm">
            {t('library.reports.noReports')}
          </div>
        ) : (
          <div className="divide-y divide-[#FAFAFA]">
            {validations.map((v) => {
              const score = v.complianceScore
              const sc = score !== null ? scoreColor(score) : { text: 'text-[#6B6760]', bg: '' }
              const isCompleted = v.status === 'completed'
              const brandName = v.asset?.product?.brand ?? '—'
              const fileName = v.asset?.fileName ?? 'Untitled'

              return (
                <Link
                  key={v.id}
                  to="/validations/$validationId"
                  params={{ validationId: v.id }}
                  className="grid grid-cols-[1fr_140px_80px_110px_90px_80px] gap-4 px-5 py-4 items-center hover:bg-[#FFFFFF] transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2
                      size={14}
                      className={isCompleted ? 'text-[#2E7D32] shrink-0' : 'text-[#F57C00] shrink-0'}
                    />
                    <span className="text-sm font-semibold text-[#0F0F0D] truncate">{fileName}</span>
                  </div>

                  <span className="text-sm text-[#3D3A35] truncate">
                    {brandName}
                    {v.user && <span className="text-[10px] text-[#8C8782] ml-1">· {v.user.name}</span>}
                  </span>

                  <span className={cn('text-sm font-bold', sc.text)}>
                    {score !== null ? `${score}%` : '—'}
                  </span>

                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit',
                      isCompleted ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF3E0] text-[#F57C00]'
                    )}
                  >
                    {isCompleted
                    ? t('library.reports.status.completed')
                    : v.status === 'failed'
                      ? t('library.reports.status.failed')
                      : t('library.reports.status.processing')}
                  </span>

                  <span className="text-xs text-[#6B6760] font-mono">{formatDate(v.createdAt)}</span>

                  <div className="flex items-center gap-2" onClick={e => e.preventDefault()}>
                    <span className="flex items-center gap-1 text-xs text-[#6B6760] group-hover:text-[#FF5C39] font-semibold transition-colors cursor-pointer"
                      onClick={e => { e.preventDefault(); e.stopPropagation(); window.location.href = `/validations/${v.id}` }}
                    >
                      {t('library.reports.view')} <ExternalLink size={11} />
                    </span>
                    {isCompleted && (
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); downloadOne(v.id, v.asset?.fileName ?? v.id) }}
                        disabled={downloadingId === v.id}
                        className="p-1 rounded text-[#6B6760] hover:text-[#8B5CF6] hover:bg-[#FAFAFA] transition-colors disabled:opacity-50"
                        title={t('validation.download')}
                      >
                        {downloadingId === v.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <Download size={12} />
                        }
                      </button>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LibraryPage() {
  const { t } = useTranslation('app')
  const { data: brands = [] } = useQuery<BrandSummary[]>({
    queryKey: ['product-brands'],
    queryFn: () => api.get('/products/brands'),
  })
  const { data: validations = [] } = useQuery<ValidationListItem[]>({
    queryKey: ['validations-library'],
    queryFn: () => api.get('/validations?limit=20'),
  })

  return (
    <div className="min-h-full bg-white px-6 py-8 space-y-0 animate-fade-in-up">
      <header className="pb-8">
        <div className="flex items-center gap-2 mb-3">
          <SectionLabel>Puppies QA</SectionLabel>
          <span className="text-[#F3F4F6] select-none">—</span>
          <SectionLabel>{t('nav.library')}</SectionLabel>
        </div>

        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[#0F0F0D] text-3xl font-bold tracking-tight leading-none mb-2">
              Puppies QA{' '}
              <span className="text-[#8B5CF6]">— {t('nav.library')}</span>
            </h1>
            <p className="text-[#3D3A35] text-sm leading-relaxed max-w-lg">
              {t('topbar.brands.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {[
              { icon: Shield,    label: t('library.brands.title'),  count: brands.length },
              { icon: BookOpen,  label: t('library.rules.title'),   count: RULES.length },
              { icon: BarChart3, label: t('library.reports.title'), count: validations.filter(v => v.status === 'completed').length },
            ].map(({ icon: Icon, label, count }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#FAFAFA] rounded-xl border border-[#F3F4F6]"
              >
                <Icon size={14} className="text-[#8B5CF6]" />
                <span className="text-[#0F0F0D] text-sm font-bold">{count}</span>
                <span className="text-[#6B6760] text-xs font-mono tracking-wide">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="space-y-10">
        <BrandsSection />
        <RulesSection />
        <ReportsSection />
      </div>
    </div>
  )
}
