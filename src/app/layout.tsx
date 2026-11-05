import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

// Xmind (Google Fonts, OFL), self-hosted so the app does not fetch fonts at runtime.
const xmind = localFont({
  variable: '--font-xmind',
  display: 'swap',
  src: [
    { path: './fonts/Xmind-400.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Xmind-500.ttf', weight: '500', style: 'normal' },
    { path: './fonts/Xmind-600.ttf', weight: '600', style: 'normal' },
    { path: './fonts/Xmind-700.ttf', weight: '700', style: 'normal' },
  ],
})

export const metadata: Metadata = {
  title: 'Finanças',
  description: 'Controle financeiro pessoal com dashboard.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      className={`${xmind.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
