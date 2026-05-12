import { useQuery } from '@tanstack/react-query'
import { CheckCircle, ScanEye, AlertTriangle, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { KPICard } from './KPICard'
import { ValidationChart } from './ValidationChart'
import { ComplianceGauge } from './ComplianceGauge'
import { AIInsightsCard } from './AIInsightsCard'
import { ErrorDistribution } from './ErrorDistribution'
import { TopIssuesRanking } from './TopIssuesRanking'

interface DashboardMetrics {
  totalValidations: number
  completedValidations: number
  recentValidations: number
  averageComplianceScore: number
  passRate: number
  issuesByCategory: Array<{ category: string; count: number }>
  monthlyData: Array<{ month: string; count: number }>
  topIssues: Array<{ title: string; severity: string; count: number }>
}

const EMPTY_METRICS: DashboardMetrics = {
  totalValidations: 0,
  completedValidations: 0,
  recentValidations: 0,
  averageComplianceScore: 0,
  passRate: 0,
  issuesByCategory: [],
  monthlyData: [],
  topIssues: [],
}

export function Dashboard() {
  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get('/dashboard/metrics'),
    staleTime: 1000 * 60 * 5,
  })
  const { t } = useTranslation('app')

  const m = metrics ?? EMPTY_METRICS
  const sparkline = m.monthlyData.map(d => d.count)

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label={t('dashboard.kpi.totalValidations')}
          value={m.totalValidations.toLocaleString()}
          change={0}
          sparklineData={sparkline}
          icon={<ScanEye size={13} className="text-[#5E5954]" />}
        />
        <KPICard
          label={t('dashboard.kpi.avgScore')}
          value={`${m.averageComplianceScore}%`}
          change={0}
          sparklineData={sparkline.map(v => v * 0.8)}
          icon={<CheckCircle size={13} className="text-[#5E5954]" />}
        />
        <KPICard
          label={t('dashboard.kpi.issuesFound')}
          value={m.recentValidations}
          change={0}
          sparklineData={sparkline.slice().reverse()}
          icon={<AlertTriangle size={13} className="text-[#5E5954]" />}
        />
        <KPICard
          label={t('dashboard.kpi.passRate')}
          value={`${m.passRate}%`}
          change={0}
          sparklineData={sparkline.map(v => v * 0.6)}
          icon={<TrendingUp size={13} className="text-[#5E5954]" />}
          accent
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <ValidationChart data={m.monthlyData} />
        </div>
        <ComplianceGauge score={m.averageComplianceScore} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ErrorDistribution data={m.issuesByCategory} />
        <TopIssuesRanking data={m.topIssues} />
        <AIInsightsCard metrics={m} />
      </div>
    </div>
  )
}
