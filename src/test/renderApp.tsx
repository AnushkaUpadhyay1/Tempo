import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router';
import { SettingsProvider } from '../settings/SettingsProvider';
import { ToastProvider } from '../ui';
import { routes } from '../app/routes';

export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return {
    ...render(
      <SettingsProvider>
        <RouterProvider router={router} />
      </SettingsProvider>,
    ),
    router,
  };
}

export function renderUi(ui: ReactNode) {
  return render(
    <MemoryRouter>
      <ToastProvider>{ui}</ToastProvider>
    </MemoryRouter>,
  );
}
