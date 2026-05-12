import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useValidatingStore } from '@/stores/ui'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const isValidating = useValidatingStore((s) => s.isValidating)

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA] dark:bg-[#0A0A0F]">
      <Sidebar isValidating={isValidating} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
