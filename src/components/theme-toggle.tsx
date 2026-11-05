'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

const noop = () => () => {}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // false on the server and during hydration, true afterwards: avoids a theme mismatch.
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
  const dark = resolvedTheme === 'dark'

  if (!mounted) return <span aria-hidden className="size-11 shrink-0" />

  return (
    <button
      type="button"
      aria-label="Alternar tema"
      title={dark ? 'Usar tema claro' : 'Usar tema escuro'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}
