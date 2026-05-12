import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

interface BrandSummary {
  brand: string
  productCount: number
  assetCount: number
  avgScore: number | null
}

const BRAND_COLORS = ['#FF5C39', '#1565C0', '#4527A0', '#AD1457', '#2E7D32', '#F57C00', '#0097A7']

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

export function BrandsPage() {
  const { data: brands = [], isLoading } = useQuery<BrandSummary[]>({
    queryKey: ['product-brands'],
    queryFn: () => api.get('/products/brands'),
  })

  const totalAssets = brands.reduce((s, b) => s + b.assetCount, 0)
  const scoredBrands = brands.filter(b => b.avgScore !== null)
  const avgScore = scoredBrands.length > 0
    ? Math.round(scoredBrands.reduce((s, b) => s + (b.avgScore ?? 0), 0) / scoredBrands.length)
    : 0

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="h-8 w-48 bg-[#FAFAFA] rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-[#FAFAFA] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] text-[#5E5954] tracking-widest mb-1">Puppies PORTFOLIO</p>
          <h1 className="text-[#0A0A0F] text-2xl font-semibold">Sub-Brands</h1>
          <p className="text-[#5E5954] text-sm mt-1">{brands.length} active brands tracked</p>
        </div>
        <div className="flex items-center gap-3">
          {[
            { label: 'Total Assets', value: String(totalAssets) },
            { label: 'Avg. Score',   value: avgScore > 0 ? `${avgScore}%` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-center shadow-sm">
              <p className="font-mono text-[9px] text-[#5E5954] tracking-widest">{label.toUpperCase()}</p>
              <p className="text-base font-bold text-[#0A0A0F] mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {brands.length === 0 ? (
        <div className="text-center py-16 text-[#5E5954]">
          <p className="text-sm">No brands found. Create a product to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {brands.map((brand, idx) => {
            const color = getBrandColor(idx)
            const initials = getBrandInitials(brand.brand)
            const score = brand.avgScore
            const sc = score !== null ? scoreColor(score) : { text: 'text-[#5E5954]', bg: 'bg-[#FAFAFA]' }

            return (
              <div
                key={brand.brand}
                className="group bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer"
              >
                <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>
                    <div className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold', sc.bg, sc.text)}>
                      {score !== null ? `${score}%` : '—'}
                    </div>
                  </div>

                  <h3 className="font-semibold text-[#0A0A0F] text-sm mb-1 leading-snug">{brand.brand}</h3>
                  <p className="text-[#5E5954] text-xs leading-relaxed mb-4">
                    {brand.productCount} product{brand.productCount !== 1 ? 's' : ''}
                  </p>

                  {score !== null && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-[#5E5954] tracking-widest">COMPLIANCE</span>
                        <span className={cn('text-xs font-bold', sc.text)}>{score}%</span>
                      </div>
                      <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${score}%`,
                            backgroundColor: score >= 85 ? '#2E7D32' : score >= 75 ? '#F57C00' : '#D32F2F',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-[#FAFAFA] flex items-center justify-between">
                    <span className="font-mono text-[9px] text-[#5E5954]">{brand.assetCount} ASSETS</span>
                    <span className="text-[10px] text-[#5E5954] group-hover:text-[#FF5C39] transition-colors font-medium">
                      View →
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
