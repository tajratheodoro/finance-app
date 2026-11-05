import type { AccountType } from '@/generated/prisma/client'

export const typeLabels: Record<AccountType, string> = {
  CHECKING: 'Conta corrente',
  WALLET: 'Carteira',
  SAVINGS: 'Poupança',
}

export type BrandStyle = {
  /** Card surface and main text color. */
  surface: string
  /** Secondary text on that surface (type label, captions). */
  muted: string
  /** Small decorative chip block. */
  chip: string
  /** Text set as the bank's wordmark, or null for no wordmark. */
  wordmark: string | null
  wordmarkClass: string
}

// Known banks. Colors stay inside the palette (color-mix over the six hexes) and
// do not follow the theme, because a bank card looks the same in light and dark.
// Plain text only: no logos or trademark artwork.
const BRANDS: Record<string, BrandStyle> = {
  nubank: {
    surface:
      'bg-[color-mix(in_srgb,#522b5b_55%,#2b124c)] text-[#fbe4d8] border border-[color-mix(in_srgb,#dfb6b2_18%,transparent)]',
    muted: 'text-[#dfb6b2]',
    chip: 'bg-[color-mix(in_srgb,#dfb6b2_45%,#522b5b)]',
    wordmark: 'nubank',
    wordmarkClass: 'text-2xl font-bold lowercase tracking-tight',
  },
  caixa: {
    surface:
      'bg-[#dfb6b2] text-[#190019] border border-[color-mix(in_srgb,#522b5b_18%,transparent)]',
    muted: 'text-[#522b5b]',
    chip: 'bg-[color-mix(in_srgb,#854f6c_45%,#dfb6b2)]',
    wordmark: 'CAIXA',
    wordmarkClass: 'text-xl font-bold tracking-wide',
  },
}

// Accounts without a known bank follow the theme tokens, one tone per type.
const FALLBACK: Record<AccountType, Omit<BrandStyle, 'wordmark'>> = {
  CHECKING: {
    surface: 'bg-primary text-primary-foreground',
    muted: 'text-primary-foreground/75',
    chip: 'bg-primary-foreground/25',
    wordmarkClass: 'text-lg font-semibold',
  },
  SAVINGS: {
    surface: 'bg-secondary text-secondary-foreground',
    muted: 'text-muted-foreground',
    chip: 'bg-secondary-foreground/15',
    wordmarkClass: 'text-lg font-semibold',
  },
  WALLET: {
    surface: 'bg-card text-card-foreground border border-border',
    muted: 'text-muted-foreground',
    chip: 'bg-muted',
    wordmarkClass: 'text-lg font-semibold',
  },
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

export function getBrandStyle(
  institution: string | null | undefined,
  type: AccountType,
): BrandStyle {
  const name = institution?.trim()
  if (!name) return { ...FALLBACK[type], wordmark: null }
  return BRANDS[normalize(name)] ?? { ...FALLBACK[type], wordmark: name }
}
