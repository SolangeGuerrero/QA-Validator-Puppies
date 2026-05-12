import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import './i18n/index'
import './styles/globals.css'

// Initialize theme before render to prevent flash
try {
  const stored = JSON.parse(localStorage.getItem('purina-theme') ?? '{}')
  if (stored?.state?.theme === 'dark') document.documentElement.classList.add('dark')
} catch { /* ignore */ }

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: (failureCount, error) => {
        if ((error as Error)?.message === 'Not authenticated') return false
        if ((error as Error)?.message?.startsWith('HTTP 4')) return false
        return failureCount < 1
      },
    },
  },
})

const router = createRouter({
  routeTree,
  context: { queryClient },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
