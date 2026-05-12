import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useTranslation } from 'react-i18next'

interface DataPoint {
  month: string
  count: number
}

interface ValidationChartProps {
  data: DataPoint[]
}

export function ValidationChart({ data }: ValidationChartProps) {
  const { t } = useTranslation('app')

  return (
    <div className="bg-white rounded-xl p-5 border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="font-mono text-[10px] text-[#5E5954] tracking-widest">{t('dashboard.chart.label')}</p>
          <p className="text-[#0A0A0F] font-semibold mt-0.5">{t('dashboard.chart.title')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
          <span className="text-xs text-[#5E5954]">{t('dashboard.chart.validations')}</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-[#5E5954] text-sm">
          {t('dashboard.chart.noData')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE4" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#5E5954', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#5E5954', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                background: '#0A0A0F',
                border: 'none',
                borderRadius: 8,
                color: '#FAFAFA',
                fontSize: 12,
              }}
              cursor={{ fill: '#8B5CF6', opacity: 0.08 }}
            />
            <Bar dataKey="count" fill="#8B5CF6" radius={[3, 3, 0, 0]} name={t('dashboard.chart.validations')} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
