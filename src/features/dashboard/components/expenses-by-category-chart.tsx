'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatBrl } from '@/lib/money'
import { tooltipStyle } from './chart-style'

type CategoryTotal = {
  categoryId: string
  name: string
  color: string
  totalCents: number
}

// Each slice uses its category's own color, so a category keeps its color across periods.
// The legend carries names and amounts, so identity never depends on color alone.
export function ExpensesByCategoryChart({ data }: { data: CategoryTotal[] }) {
  const total = data.reduce((sum, entry) => sum + entry.totalCents, 0)

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[13rem_minmax(0,1fr)]">
      <div className="relative mx-auto h-52 w-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="totalCents"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.categoryId} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatBrl(Number(value))}
              {...tooltipStyle}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="font-semibold tabular-nums">{formatBrl(total)}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-3 text-sm">
        {data.map((entry) => (
          <li key={entry.categoryId} className="flex items-center gap-3">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="min-w-0 flex-1 break-words">{entry.name}</span>
            <span className="whitespace-nowrap text-muted-foreground tabular-nums">
              {total > 0 ? Math.round((entry.totalCents / total) * 100) : 0}%
            </span>
            <span className="whitespace-nowrap text-right font-medium tabular-nums">
              {formatBrl(entry.totalCents)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
