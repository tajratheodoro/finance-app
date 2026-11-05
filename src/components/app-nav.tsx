'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeftRight,
  ChartLine,
  LayoutDashboard,
  Plus,
  Tags,
  WalletCards,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

// `short` is the label under the icon in the mobile pill, where width is tight.
const links = [
  { href: '/', label: 'Painel', short: 'Painel', icon: LayoutDashboard },
  {
    href: '/transactions',
    label: 'Transações',
    short: 'Extrato',
    icon: ArrowLeftRight,
  },
  { href: '/categories', label: 'Categorias', short: 'Categorias', icon: Tags },
  { href: '/accounts', label: 'Contas', short: 'Contas', icon: WalletCards },
  {
    href: '/investments',
    label: 'Investimentos',
    short: 'Investir',
    icon: ChartLine,
  },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function AppNav() {
  const pathname = usePathname()
  const activeIndex = links.findIndex(({ href }) => isActive(pathname, href))
  const registrarActive = isActive(pathname, '/registrar')

  return (
    <>
      <header>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className={cn(
              'mr-auto rounded-full text-lg font-semibold tracking-tight',
              focusRing,
            )}
          >
            Finanças
          </Link>

          <nav
            aria-label="Navegação principal"
            className="order-last hidden w-full sm:block lg:order-none lg:w-auto"
          >
            <ul className="flex gap-1">
              {links.map(({ href, label }) => {
                const active = isActive(pathname, href)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'inline-flex h-11 items-center rounded-full px-4 text-sm font-medium transition-colors',
                        focusRing,
                        active
                          ? 'bg-secondary text-secondary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/registrar"
              aria-current={registrarActive ? 'page' : undefined}
              className={cn(
                'hidden h-11 items-center gap-1.5 rounded-full bg-primary pr-5 pl-4 text-sm font-semibold text-primary-foreground transition-[opacity,transform] duration-150 ease-out hover:opacity-90 active:scale-[0.97] sm:inline-flex',
                focusRing,
              )}
            >
              <Plus aria-hidden className="size-4" />
              Registrar
            </Link>
          </div>
        </div>
      </header>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden"
      >
        <div className="mx-auto flex max-w-md items-center gap-2">
          <div className="relative min-w-0 flex-1 rounded-full border border-border bg-card p-1 shadow-lg">
            <span
              aria-hidden
              className={cn(
                'absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/5)] rounded-full bg-secondary transition-[transform,opacity] duration-200 ease-out',
                activeIndex === -1 && 'opacity-0',
              )}
              style={{
                transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
              }}
            />
            <ul className="grid grid-cols-5">
              {links.map(({ href, short, icon: Icon }) => {
                const active = isActive(pathname, href)
                return (
                  <li key={href} className="relative min-w-0">
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex h-14 flex-col items-center justify-center gap-1 rounded-full text-[0.625rem] leading-none font-medium transition-colors',
                        focusRing,
                        active
                          ? 'text-secondary-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      <Icon aria-hidden className="size-5" />
                      <span className="max-w-full truncate">{short}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
          <Link
            href="/registrar"
            aria-current={registrarActive ? 'page' : undefined}
            className={cn(
              'flex size-[3.75rem] shrink-0 flex-col items-center justify-center gap-1 rounded-full bg-primary text-[0.625rem] leading-none font-semibold text-primary-foreground shadow-lg transition-transform duration-150 ease-out active:scale-[0.96]',
              focusRing,
            )}
          >
            <Plus aria-hidden className="size-5" />
            Registrar
          </Link>
        </div>
      </nav>
    </>
  )
}
