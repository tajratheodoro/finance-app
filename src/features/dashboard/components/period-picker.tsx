'use client'

import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'

// Writes ?month=YYYY-MM. The page remounts this (key={value}) when the URL changes,
// so the input shows the period the server actually rendered.
export function PeriodPicker({ value }: { value: string }) {
  const router = useRouter()

  return (
    <Input
      type="month"
      aria-label="Mês"
      defaultValue={value}
      className="w-44"
      onChange={(event) => {
        if (event.target.value) {
          router.push(`/?month=${event.target.value}`)
        }
      }}
    />
  )
}
