import { useRoutes } from 'react-router-dom'
import { Providers } from './providers'
import { routes } from './routes'

function AppRouter() {
  return useRoutes(routes)
}

export default function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}
