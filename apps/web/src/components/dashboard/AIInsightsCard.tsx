import { TrendingUp, AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface DashboardMetrics {
  totalValidations: number
  averageComplianceScore: number
  passRate: number
  issuesByCategory: Array<{ category: string; count: number }>
  topIssues: Array<{ title: string; severity: string; count: number }>
}

export function AIInsightsCard({ metrics }: { metrics: DashboardMetrics }) {
  const { t } = useTranslation('app')
  const { issuesByCategory, topIssues, passRate, averageComplianceScore, totalValidations } = metrics

  if (totalValidations === 0) {
    return (
      <div className="bg-[#0A0A0F] rounded-xl p-5 border border-white/[0.04]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-3 rounded-full bg-[#8B5CF6]" />
          <p className="font-mono text-[10px] text-[#8B5CF6] tracking-widest">{t('dashboard.insights.label')}</p>
        </div>
        <p className="text-[#6B6760] text-xs text-center py-8">
          {t('dashboard.insights.empty')}
        </p>
      </div>
    )
  }

  const insights: { icon: typeof AlertTriangle; color: string; text: string }[] = []

  const topCategory = [...issuesByCategory].sort((a, b) => b.count - a.count)[0]
  if (topCategory) {
    insights.push({
      icon: AlertTriangle,
      color: '#F57C00',
      text: `${topCategory.category.charAt(0).toUpperCase() + topCategory.category.slice(1)} issues are the most common — accounting for the largest share of flagged items.`,
    })
  }

  if (passRate > 0) {
    const isGood = passRate >= 80
    insights.push({
      icon: isGood ? TrendingUp : AlertTriangle,
      color: isGood ? '#2E7D32' : '#D32F2F',
      text: `${passRate}% of validations pass. ${isGood ? 'Quality standards are being met.' : 'Consider reviewing brand guidelines with your agency.'}`,
    })
  }

  const topIssue = topIssues[0]
  if (topIssue) {
    insights.push({
      icon: Zap,
      color: '#A78BFA',
      text: `Most recurring: "${topIssue.title}" (${topIssue.count} occurrence${topIssue.count !== 1 ? 's' : ''}).`,
    })
  }

  if (averageComplianceScore > 0 && insights.length < 3) {
    insights.push({
      icon: CheckCircle,
      color: averageComplianceScore >= 80 ? '#2E7D32' : '#F57C00',
      text: `Average compliance score is ${averageComplianceScore}% across all validated creatives.`,
    })
  }

  return (
    <div className="bg-[#0A0A0F] rounded-xl p-5 border border-white/[0.04]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-3 rounded-full bg-[#8B5CF6]" />
        <p className="font-mono text-[10px] text-[#8B5CF6] tracking-widest">{t('dashboard.insights.label')}</p>
        <CheckCircle size={11} className="text-[#8B5CF6] ml-auto" />
      </div>

      <div className="space-y-2.5">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="flex gap-3 items-start bg-white/[0.04] rounded-lg p-3 transition-colors hover:bg-white/[0.06]"
          >
            <insight.icon size={13} className="shrink-0 mt-0.5" style={{ color: insight.color }} />
            <p className="text-[#c5c1b9] text-[11px] leading-relaxed font-sans">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
