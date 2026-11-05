'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatBrl } from '@/lib/money'
import { tooltipStyle } from './chart-style'

type MonthlyTotal = {
  label: string // YYYY-MM
  incomeCents: number
  expenseCents: number
}

const monthName = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  timeZone: 'UTC',
})

export function MonthlyChart({ data }: { data: MonthlyTotal[] }) {
  const chartData = data.map((month) => ({
    ...month,
    month: monthName.format(new Date(`${month.label}-01T00:00:00Z`)),
  }))

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ left: 0, right: 0, top: 8 }}
          barGap={2}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          />
          <YAxis hide />
          <Tooltip
            formatter={(value) => formatBrl(Number(value))}
            cursor={{ fill: 'var(--muted)' }}
            {...tooltipStyle}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 13, color: 'var(--muted-foreground)' }}
          />
          <Bar
            dataKey="incomeCents"
            name="Receitas"
            fill="var(--income)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="expenseCents"
            name="Despesas"
            fill="var(--expense)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
