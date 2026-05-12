import { createRootRouteWithContext, Outlet, redirect, useRouterState } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { useAuthStore } from '@/stores/auth'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ location }) => {
    const { isAuthenticated } = useAuthStore.getState()
    const isLoginPage = location.pathname === '/login'
    const isCallbackPage = location.pathname === '/auth/callback'
    if (!isAuthenticated && !isLoginPage && !isCallbackPage) {
      throw redirect({ to: '/login' })
    }
    if (isAuthenticated && isLoginPage) {
      throw redirect({ to: '/' })
    }
  },
  component: RootComponent,
})

function RootComponent() {
  const { isAuthenticated } = useAuthStore()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  if (!isAuthenticated || pathname === '/login') {
    return <Outlet />
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
