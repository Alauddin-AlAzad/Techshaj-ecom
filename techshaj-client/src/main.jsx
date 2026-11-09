import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1, refetchOnWindowFocus: false } },
})

// The stylesheet loads without blocking the loading logo; render the app once it is ready.
const appCss = document.querySelector('link[data-app-css]')
const cssReady = new Promise((resolve) => {
  if (!appCss || appCss.media === 'all') return resolve()
  appCss.addEventListener('load', resolve, { once: true })
  appCss.addEventListener('error', resolve, { once: true })
  setTimeout(resolve, 15000)
})

cssReady.then(() =>
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  ),
)
