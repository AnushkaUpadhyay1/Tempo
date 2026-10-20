import { RouterProvider } from 'react-router';
import { SettingsProvider } from '../settings/SettingsProvider';
import { createRouter } from './routes';

const router = createRouter();

export function App() {
  return (
    <SettingsProvider>
      <RouterProvider router={router} />
    </SettingsProvider>
  );
}
