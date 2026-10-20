import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router';
import AppShell from './AppShell';
import { RouteError } from './RouteError';

const TodayScreen = lazy(() => import('../screens/TodayScreen'));
const MedsScreen = lazy(() => import('../screens/MedsScreen'));
const MedDetailScreen = lazy(() => import('../screens/MedDetailScreen'));
const MedFormScreen = lazy(() => import('../screens/MedFormScreen'));
const CalendarScreen = lazy(() => import('../screens/CalendarScreen'));
const AppointmentDetailScreen = lazy(() => import('../screens/AppointmentDetailScreen'));
const AppointmentFormScreen = lazy(() => import('../screens/AppointmentFormScreen'));
const YouScreen = lazy(() => import('../screens/YouScreen'));
const NotFound = lazy(() => import('../screens/NotFound'));

const page = (node: ReactNode) => (
  <Suspense fallback={<p className="t-sr-only">Loading</p>}>{node}</Suspense>
);

export const routes = [
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: page(<TodayScreen />) },
      { path: 'meds', element: page(<MedsScreen />) },
      { path: 'meds/new', element: page(<MedFormScreen />) },
      { path: 'meds/:id', element: page(<MedDetailScreen />) },
      { path: 'meds/:id/edit', element: page(<MedFormScreen />) },
      { path: 'calendar', element: page(<CalendarScreen />) },
      { path: 'calendar/new', element: page(<AppointmentFormScreen />) },
      { path: 'calendar/:id', element: page(<AppointmentDetailScreen />) },
      { path: 'calendar/:id/edit', element: page(<AppointmentFormScreen />) },
      { path: 'you', element: page(<YouScreen />) },
      { path: '*', element: page(<NotFound />) },
    ],
  },
];

export const createRouter = () => createBrowserRouter(routes);
