import { Navigate, RouteObject } from 'react-router-dom'
import { ProtectedRoute } from '../shared/components/ProtectedRoute'
import { SignInPage } from '../features/auth/pages/SignInPage'
import { HomeChooserPage } from '../features/home/pages/HomeChooserPage'
import { VisitorHomePage } from '../features/visitor/pages/VisitorHomePage'
import { EventsListPage } from '../features/events/pages/EventsListPage'
import { CreateEventPage } from '../features/events/pages/CreateEventPage'
import { EventDetailPage } from '../features/events/pages/EventDetailPage'
import { BoothFormPage } from '../features/booths/components/BoothFormPage'
import { CreateBoothPage } from '../features/exhibitorBooths/pages/CreateBoothPage'
import { BoothQRPage } from '../features/exhibitorBooths/pages/BoothQRPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <HomeChooserPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/signin',
    element: <SignInPage />,
  },
  {
    path: '/visitor',
    element: (
      <ProtectedRoute>
        <VisitorHomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/visitor/events/:id/scan',
    element: (
      <ProtectedRoute>
        <BoothFormPage />
      </ProtectedRoute>
    ),
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
    path: '/events/:eventId/booths/:boothId/qr',
    element: (
      <ProtectedRoute>
        <BoothQRPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
]
