import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../../test/renderApp';
import { expectNoAxeViolations } from '../../test/axe';
import { DATA_KEY } from '../../data/storage';
import { createDemoData } from '../../data/demoData';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 21, 10, 0));
  URL.createObjectURL = vi.fn(() => 'blob:test');
  URL.revokeObjectURL = vi.fn();
  // jsdom cannot follow download links; the file contents are checked through createObjectURL.
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(() => vi.useRealTimers());

const stored = () => JSON.parse(localStorage.getItem(DATA_KEY) ?? 'null');

describe('Calendar', () => {
  it('groups appointments and shows checklist progress', async () => {
    renderApp('/calendar');
    const week = await screen.findByRole('region', { name: 'Next 7 days' });
    expect(within(week).getByRole('link', { name: 'Dentist check-up' })).toBeInTheDocument();
    expect(within(week).getByText('1/3 packed')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Later' })).getByRole('link', {
        name: 'Physio session',
      }),
    ).toBeInTheDocument();
  });

  it('validates and adds an appointment', async () => {
    const user = userEvent.setup();
    renderApp('/calendar/new');
    const h1 = await screen.findByRole('heading', { level: 1, name: 'New appointment' });
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Say what it is.');
    expect(alert).toHaveTextContent('Add a place.');
    await waitFor(() => expect(alert.parentElement).toHaveFocus());
    expect(h1).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'What' }), 'Blood test');
    await user.type(screen.getByRole('textbox', { name: 'Where' }), 'City Clinic');
    await user.click(screen.getByRole('radio', { name: /Afternoon/ }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Blood test' }),
    ).toBeInTheDocument();
    expect(
      stored().appointments.find((a: { title: string }) => a.title === 'Blood test'),
    ).toMatchObject({
      date: '2026-10-28',
      time: '13:00',
      place: 'City Clinic',
    });
  });

  it('keeps the checklist, exports to a calendar file, and deletes', async () => {
    const user = userEvent.setup();
    const first = renderApp('/calendar/appt-dentist');
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Dentist check-up' });
    await waitFor(() => expect(h1).toBeInTheDocument());
    await user.click(screen.getByRole('checkbox', { name: 'Retainer case' }));
    await user.type(screen.getByRole('textbox', { name: 'New item' }), 'Water');
    await user.click(screen.getByRole('button', { name: 'Add item' }));
    expect(screen.getByRole('checkbox', { name: 'Water' })).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Add to my calendar' }));
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    const blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/calendar');
    expect(screen.getByRole('link', { name: 'Directions (opens in a new tab)' })).toHaveAttribute(
      'href',
      expect.stringContaining('google.com/maps'),
    );
    first.unmount();

    renderApp('/calendar/appt-dentist');
    expect(await screen.findByRole('checkbox', { name: 'Retainer case' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Water' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Calendar' })).toBeInTheDocument();
    expect(stored().appointments.map((a: { id: string }) => a.id)).toEqual(['appt-physio']);
  });

  it('has no axe violations', async () => {
    const { container } = renderApp('/calendar/appt-dentist');
    await screen.findByRole('heading', { level: 1 });
    await expectNoAxeViolations(container);
  });
});

describe('You', () => {
  it('shows stats and a 4-week heatmap labelled in words', async () => {
    renderApp('/you');
    expect(await screen.findByText('Streak (8 days)')).toBeInTheDocument();
    const heatmap = screen.getByRole('list', { name: 'Last 4 weeks' });
    expect(heatmap.children).toHaveLength(28);
    expect(within(heatmap).getAllByText(/: 4 of 4 logged$/).length).toBeGreaterThan(20);
  });

  it('copies a buddy message without claiming it was sent', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderApp('/you');
    const message = await screen.findByRole('textbox', { name: 'Message' });
    expect((message as HTMLTextAreaElement).value).toMatch(
      /^This week on Tempo: \d+\/\d+ doses logged, 8-day streak/,
    );
    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalled();
    expect(await screen.findByText('Copied. Paste it wherever you like.')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/message (was )?sent/i);
  });

  it('applies theme, accent and text size everywhere and remembers them', async () => {
    const user = userEvent.setup();
    renderApp('/you');
    await user.click(await screen.findByRole('radio', { name: 'Light' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    await user.click(screen.getByRole('radio', { name: 'Violet' }));
    expect(document.documentElement).toHaveAttribute('data-accent', 'violet');
    await user.click(screen.getByRole('radio', { name: 'Larger' }));
    expect(document.documentElement.style.getPropertyValue('--t-text-scale')).toBe('1.3');
    await user.click(screen.getByRole('switch', { name: 'Reduce motion' }));
    expect(document.documentElement).toHaveAttribute('data-reduced-motion', 'true');
    expect(JSON.parse(localStorage.getItem('tempo.settings.v1')!)).toMatchObject({
      theme: 'light',
      accent: 'violet',
      textScale: 130,
      reducedMotion: true,
    });
  });

  it('exports a backup and imports it again, rejecting files that are not backups', async () => {
    const user = userEvent.setup();
    renderApp('/you');
    await user.click(await screen.findByRole('button', { name: 'Export JSON' }));
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));

    const input = screen.getByTestId('import-input') as HTMLInputElement;
    const bad = new File(['{"nope":true}'], 'bad.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [bad] } });
    expect(await screen.findByText('That file is not a Tempo backup.')).toBeInTheDocument();

    const backup = createDemoData(new Date(2026, 9, 21));
    backup.medicines = backup.medicines.slice(0, 2);
    const good = new File([JSON.stringify(backup)], 'tempo.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [good] } });
    expect(await screen.findByText('Imported 2 meds.')).toBeInTheDocument();
    expect(stored().medicines).toHaveLength(2);
  });

  it('resets the demo only after confirming', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      DATA_KEY,
      JSON.stringify({
        version: 1,
        profile: { name: 'Riley' },
        medicines: [],
        doses: [],
        appointments: [],
      }),
    );
    renderApp('/you');
    await user.click(await screen.findByRole('button', { name: 'Reset demo' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(stored().medicines).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Reset demo' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset' }));
    expect(stored().medicines).toHaveLength(4);
  });

  it('has no axe violations', async () => {
    const { container } = renderApp('/you');
    await screen.findByRole('heading', { level: 1 });
    await expectNoAxeViolations(container);
  });
});

describe('routes', () => {
  it.each([
    ['/', /Riley$/],
    ['/meds', 'Meds'],
    ['/meds/new', 'New med'],
    ['/meds/med-iron', 'Ferrous fumarate 210 mg'],
    ['/calendar', 'Calendar'],
    ['/calendar/new', 'New appointment'],
    ['/calendar/appt-physio', 'Physio session'],
    ['/you', 'You'],
    ['/nope', 'Nothing here'],
  ])('%s loads directly', async (path, heading) => {
    renderApp(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(document.title).toMatch(/Tempo/);
  });

  it('moves focus to the new heading after tab navigation', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await screen.findByRole('heading', { level: 1 });
    await user.click(
      within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', {
        name: 'Calendar',
      }),
    );
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Calendar' });
    await waitFor(() => expect(h1).toHaveFocus());
  });
});
