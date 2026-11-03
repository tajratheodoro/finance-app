'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Painel' },
  { href: '/transactions', label: 'Transações' },
  { href: '/categories', label: 'Categorias' },
  { href: '/accounts', label: 'Contas' },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1">
      {links.map(({ href, label }) => {
        const active =
          href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
