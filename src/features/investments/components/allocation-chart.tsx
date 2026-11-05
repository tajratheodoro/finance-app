'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatBrl } from '@/lib/money'

type Slice = {
  kind: string
  label: string
  valueCents: number
  percent: number
}

// Five kinds, five chart tokens. The legend names every slice, so color is never the only cue.
const FILLS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function AllocationChart({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, s) => sum + s.valueCents, 0)

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[13rem_minmax(0,1fr)]">
      <div className="relative mx-auto h-52 w-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="valueCents"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((s, i) => (
                <Cell key={s.kind} fill={FILLS[i % FILLS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatBrl(Number(value))}
              contentStyle={{
                background: 'var(--popover)',
                color: 'var(--popover-foreground)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                fontSize: 13,
              }}
              itemStyle={{ color: 'var(--popover-foreground)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="font-semibold tabular-nums">{formatBrl(total)}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-3 text-sm">
        {data.map((s, i) => (
          <li key={s.kind} className="flex items-center gap-3">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: FILLS[i % FILLS.length] }}
            />
            <span className="min-w-0 flex-1 truncate">{s.label}</span>
            <span className="text-muted-foreground tabular-nums">
              {s.percent.toFixed(1).replace('.', ',')}%
            </span>
            <span className="w-28 text-right font-medium tabular-nums">
              {formatBrl(s.valueCents)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
