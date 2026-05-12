import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface KPICardProps {
  label: string
  value: string | number
  change?: number
  sparklineData?: number[]
  icon?: React.ReactNode
  accent?: boolean
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-[2px] h-8 w-full">
      {data.map((v, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 rounded-[1px] transition-all',
            i === data.length - 1 ? 'bg-[#A78BFA]' : 'bg-[#8B5CF6]/20',
          )}
          style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
        />
      ))}
    </div>
  )
}

export function KPICard({ label, value, change, sparklineData, icon, accent }: KPICardProps) {
  const { t } = useTranslation('app')
  const isPositive = (change ?? 0) >= 0

  return (
    <div className={cn(
      'bg-white rounded-xl p-5 border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
      accent && 'bg-[#0A0A0F] border-[#2A2A28]',
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className={cn(
          'font-mono text-[10px] tracking-widest uppercase',
          accent ? 'text-[#5E5954]' : 'text-[#5E5954]',
        )}>{label}</p>
        {icon && (
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center',
            accent ? 'bg-white/[0.06]' : 'bg-[#FAFAFA]',
          )}>
            {icon}
          </div>
        )}
      </div>

      <p className={cn(
        'text-2xl font-semibold mb-1',
        accent ? 'text-[#FAFAFA]' : 'text-[#0A0A0F]',
      )}>{value}</p>

      {change !== undefined && (
        <p className={cn(
          'text-xs mb-3',
          isPositive ? 'text-[#2E7D32]' : 'text-[#D32F2F]',
        )}>
          {isPositive ? '+' : ''}{change}{t('common.vsLastMonth')}
        </p>
      )}

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3">
          <Sparkline data={sparklineData} />
        </div>
      )}
    </div>
  )
}
