import { AppNav } from '@/components/app-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip">
      <AppNav />
      {/* Bottom padding on mobile clears the floating nav pill plus the safe area. */}
      <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))] motion-safe:animate-in motion-safe:duration-240 motion-safe:ease-out motion-safe:fade-in motion-safe:slide-in-from-bottom-2 sm:px-6 sm:pt-6 sm:pb-12">
        {children}
      </main>
    </div>
  )
}
