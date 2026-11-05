'use client'

import { useEffect, useState } from 'react'
import { formatBrl } from '@/lib/money'

const DURATION_MS = 500

// Counts from zero to `cents` once on mount (ease-out cubic). Skipped when the user
// prefers reduced motion; the server-rendered text is already the final value.
export function CountUp({ cents }: { cents: number }) {
  const [shown, setShown] = useState(cents)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION_MS, 1)
      setShown(Math.round(cents * (1 - (1 - t) ** 3)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [cents])

  return <>{formatBrl(shown)}</>
}
