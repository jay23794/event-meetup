import { Navigate, RouteObject } from 'react-router-dom'
import { ProtectedRoute } from '../shared/components/ProtectedRoute'
import { SignInPage } from '../features/auth/pages/SignInPage'
import { HomeChooserPage } from '../features/home/pages/HomeChooserPage'
import { ExhibitorHomePage } from '../features/exhibitorBooths/pages/ExhibitorHomePage'
import { VisitorHomePage } from '../features/visitor/pages/VisitorHomePage'
import { PublicBoothPage } from '../features/exhibitorBooths/pages/PublicBoothPage'
import { CreateEventPage } from '../features/events/pages/CreateEventPage'
import { EventDetailPage } from '../features/events/pages/EventDetailPage'
import { BoothFormPage } from '../features/booths/components/BoothFormPage'
import { CreateBoothPage } from '../features/exhibitorBooths/pages/CreateBoothPage'
import { BoothQRPage } from '../features/exhibitorBooths/pages/BoothQRPage'
import { PrivacyPolicyPage } from '../features/legal/pages/PrivacyPolicyPage'
import { TermsPage } from '../features/legal/pages/TermsPage'

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
    path: '/privacy-policy',
    element: <PrivacyPolicyPage />,
  },
  {
    path: '/terms',
    element: <TermsPage />,
  },
  // Exhibitor routes
  {
    path: '/exhibitor',
    element: (
      <ProtectedRoute>
        <ExhibitorHomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/exhibitor/:qrId',
    element: <PublicBoothPage />,
  },
  {
    path: '/exhibitor/events/new',
    element: (
      <ProtectedRoute>
        <CreateEventPage isExhibitor />
      </ProtectedRoute>
    ),
  },
  {
    path: '/exhibitor/events/:id',
    element: (
      <ProtectedRoute>
        <EventDetailPage isExhibitor />
      </ProtectedRoute>
    ),
  },
  {
    path: '/exhibitor/events/:eventId/booths/new',
    element: (
      <ProtectedRoute>
        <CreateBoothPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/exhibitor/events/:eventId/booths/:boothId/qr',
    element: (
      <ProtectedRoute>
        <BoothQRPage />
      </ProtectedRoute>
    ),
  },
  // Visitor routes
  {
    path: '/visitor',
    element: (
      <ProtectedRoute>
        <VisitorHomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/visitor/events/new',
    element: (
      <ProtectedRoute>
        <CreateEventPage isExhibitor={false} />
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
    path: '*',
    element: <Navigate to="/" />,
  },
]
