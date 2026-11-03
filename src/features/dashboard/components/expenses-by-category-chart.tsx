'use client'

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatBrl } from '@/lib/money'

type CategoryTotal = {
  categoryId: string
  name: string
  color: string
  totalCents: number
}

// Each bar uses its category's own color, so a category keeps its color across periods.
export function ExpensesByCategoryChart({ data }: { data: CategoryTotal[] }) {
  return (
    <ResponsiveContainer width="100%" height={data.length * 48 + 16}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 88 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip formatter={(value) => formatBrl(Number(value))} />
        <Bar dataKey="totalCents" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.categoryId} fill={entry.color} />
          ))}
          <LabelList
            dataKey="totalCents"
            position="right"
            fill="var(--foreground)"
            fontSize={12}
            formatter={(value) => formatBrl(Number(value))}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
