'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

// Adds the `dark` class to <html>. Light/dark tokens live in globals.css.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
