'use client'

import { useId } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'

// Writes ?month=YYYY-MM. The page remounts this (key={value}) when the URL changes,
// so the input shows the period the server actually rendered.
export function PeriodPicker({ value }: { value: string }) {
  const router = useRouter()
  const id = useId()

  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        Mês
      </label>
      <Input
        id={id}
        type="month"
        defaultValue={value}
        className="h-11 w-auto min-w-48 rounded-full px-4 tabular-nums"
        onChange={(event) => {
          if (event.target.value) {
            router.push(`/?month=${event.target.value}`)
          }
        }}
      />
    </div>
  )
}
