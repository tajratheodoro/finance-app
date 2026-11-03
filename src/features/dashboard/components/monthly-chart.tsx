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

type MonthlyTotal = {
  label: string // YYYY-MM
  incomeCents: number
  expenseCents: number
}

// Income uses the primary ink and expenses the chart gray, so the two stay distinct in light and dark.
export function MonthlyChart({ data }: { data: MonthlyTotal[] }) {
  const chartData = data.map((month) => ({
    ...month,
    month: `${month.label.slice(5)}/${month.label.slice(2, 4)}`, // MM/YY
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ left: 0, right: 0, top: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis hide />
        <Tooltip formatter={(value) => formatBrl(Number(value))} />
        <Legend />
        <Bar
          dataKey="incomeCents"
          name="Receitas"
          fill="var(--primary)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="expenseCents"
          name="Despesas"
          fill="var(--chart-2)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
