import { Navigate, RouteObject } from 'react-router-dom'
import { ProtectedRoute } from '../shared/components/ProtectedRoute'
import { SignInPage } from '../features/auth/pages/SignInPage'
import { EventsListPage } from '../features/events/pages/EventsListPage'
import { CreateEventPage } from '../features/events/pages/CreateEventPage'
import { EventDetailPage } from '../features/events/pages/EventDetailPage'
import { BoothFormPage } from '../features/booths/components/BoothFormPage'
import { CreateBoothPage } from '../features/exhibitorBooths/pages/CreateBoothPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/events" />,
  },
  {
    path: '/signin',
    element: <SignInPage />,
  },
  {
    path: '/events',
    element: (
      <ProtectedRoute>
        <EventsListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/events/new',
    element: (
      <ProtectedRoute>
        <CreateEventPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/events/:id',
    element: (
      <ProtectedRoute>
        <EventDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/events/:eventId/booths/new',
    element: (
      <ProtectedRoute>
        <CreateBoothPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/events/:id/booths/scan',
    element: (
      <ProtectedRoute>
        <BoothFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
]
