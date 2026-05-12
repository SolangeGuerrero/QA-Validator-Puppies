import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface TopIssue {
  title: string
  severity: string
  count: number
}

interface TopIssuesRankingProps {
  data: TopIssue[]
}

export function TopIssuesRanking({ data }: TopIssuesRankingProps) {
  const { t } = useTranslation('app')

  return (
    <div className="bg-white rounded-xl p-5 border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <p className="font-mono text-[10px] text-[#5E5954] tracking-widest mb-1">{t('dashboard.topIssues.label')}</p>
      <p className="text-[#0A0A0F] font-semibold mb-4">{t('dashboard.topIssues.title')}</p>

      {data.length === 0 ? (
        <p className="text-sm text-[#5E5954] text-center py-4">{t('dashboard.topIssues.noData')}</p>
      ) : (
        <div className="space-y-0">
          {data.map((issue, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2.5 border-b border-[#FAFAFA] last:border-0"
            >
              <span className="font-mono text-[10px] text-[#5E5954] w-4 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#0A0A0F] truncate">{issue.title}</p>
              </div>
              <div className={cn(
                'text-[9px] font-mono px-2 py-0.5 rounded-full shrink-0',
                issue.severity === 'critical' && 'bg-[#FEECEC] text-[#D32F2F]',
                issue.severity === 'warning' && 'bg-[#FFF3E0] text-[#F57C00]',
                issue.severity === 'info' && 'bg-[#E3F2FD] text-[#1565C0]',
              )}>
                {issue.severity}
              </div>
              <span className="font-mono text-xs text-[#5E5954] w-6 text-right shrink-0">{issue.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
