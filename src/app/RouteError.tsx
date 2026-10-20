import { Banner, ButtonLink } from '../ui';

export function RouteError() {
  return (
    <main
      style={{
        maxWidth: '32rem',
        margin: '0 auto',
        padding: 'var(--t-space-8) var(--t-space-4)',
        display: 'grid',
        gap: 'var(--t-space-4)',
      }}
    >
      <h1>Something broke</h1>
      <Banner
        tone="danger"
        title="This screen failed to load. Check your connection and try again. Your data is safe on this device."
      />
      <ButtonLink to="/">Back to Today</ButtonLink>
    </main>
  );
}
