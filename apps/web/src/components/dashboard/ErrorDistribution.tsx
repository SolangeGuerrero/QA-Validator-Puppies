import { useTranslation } from 'react-i18next'

interface Category {
  category: string
  count: number
}

interface ErrorDistributionProps {
  data: Category[]
}

const CATEGORY_COLORS: Record<string, string> = {
  brand: '#FF5C39',
  legal: '#D32F2F',
  typography: '#F57C00',
  color: '#A78BFA',
  regulatory: '#8B5CF6',
  spacing: '#3D3A35',
  imagery: '#1565C0',
}

export function ErrorDistribution({ data }: ErrorDistributionProps) {
  const { t } = useTranslation('app')
  const total = data.reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="bg-white rounded-xl p-5 border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <p className="font-mono text-[10px] text-[#5E5954] tracking-widest mb-1">{t('dashboard.distribution.label')}</p>
      <p className="text-[#0A0A0F] font-semibold mb-4">{t('dashboard.distribution.title')}</p>

      {data.length === 0 ? (
        <p className="text-sm text-[#5E5954] text-center py-4">{t('dashboard.distribution.noData')}</p>
      ) : (
        <div className="space-y-3">
          {data.map(({ category, count }) => {
            const pct = Math.round((count / total) * 100)
            const color = CATEGORY_COLORS[category] ?? '#5E5954'

            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#3D3A35] capitalize">{category}</span>
                  <span className="font-mono text-[10px] text-[#5E5954]">{pct}%</span>
                </div>
                <div className="h-1.5 bg-[#FAFAFA] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
