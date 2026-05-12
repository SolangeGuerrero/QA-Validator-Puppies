import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'
import { scoreColor, formatScore } from '@/lib/utils'

interface ComplianceGaugeProps {
  score: number
}

export function ComplianceGauge({ score }: ComplianceGaugeProps) {
  const { t } = useTranslation('app')
  const color = scoreColor(score)
  const data = [{ value: score, fill: color }]

  return (
    <div className="bg-white rounded-xl p-5 border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col">
      <p className="font-mono text-[10px] text-[#5E5954] tracking-widest mb-4">{t('dashboard.gauge.label')}</p>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="70%"
              outerRadius="100%"
              data={data}
              startAngle={210}
              endAngle={-30}
              barSize={10}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={5}
                background={{ fill: '#FAFAFA' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[#0A0A0F]">{score}%</span>
            <span className="text-[10px] text-[#5E5954] font-mono">{formatScore(score).toUpperCase()}</span>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          {[
            { key: 'dashboard.gauge.critical', color: '#D32F2F' },
            { key: 'dashboard.gauge.warning', color: '#F57C00' },
            { key: 'dashboard.gauge.passed', color: '#2E7D32' },
          ].map(({ key, color: c }) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
              <span className="text-[10px] text-[#5E5954]">{t(key)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
