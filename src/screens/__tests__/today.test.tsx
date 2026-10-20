import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../../test/renderApp';
import { expectNoAxeViolations } from '../../test/axe';
import { DATA_KEY } from '../../data/storage';

// Wednesday 21 October 2026, 10:00 AM: the 8:30 doses are overdue, the rest are later.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 21, 10, 0));
});
afterEach(() => vi.useRealTimers());

const stored = () => JSON.parse(localStorage.getItem(DATA_KEY) ?? 'null');
const logButton = (name: string, time = '8:30 AM') =>
  screen.findByRole('button', { name: new RegExp(`^Log\\s?: ${name}, ${time}$`) });

describe('Today', () => {
  it('shows progress, streak, the week and doses grouped by time of day', async () => {
    renderApp('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Morning, Riley' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Doses logged today' })).toHaveAttribute(
      'aria-valuetext',
      '0 of 4 logged',
    );
    expect(screen.getByText('8-day streak')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Last 7 days' }).children).toHaveLength(7);
    for (const period of ['Morning', 'Afternoon', 'Night']) {
      expect(
        screen.getByRole('heading', { level: 2, name: new RegExp(`^${period}`) }),
      ).toBeInTheDocument();
    }
    expect(screen.getByText('2 overdue')).toBeInTheDocument();
    expect(screen.getAllByText(/Was due 8:30 AM\./)).toHaveLength(2);
  });

  it('logs a dose with one tap, keeps it saved, and offers Undo', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(await logButton('Sertraline 50 mg'));
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '1 of 4 logged');
    expect(screen.getByRole('group', { name: 'Notification' })).toHaveTextContent(
      'Sertraline 50 mg logged',
    );
    expect(
      stored().doses.some(
        (d: { medicineId: string; date: string }) =>
          d.medicineId === 'med-sertraline' && d.date === '2026-10-21',
      ),
    ).toBe(true);
    expect(stored().medicines.find((m: { id: string }) => m.id === 'med-sertraline').quantity).toBe(
      20,
    );

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '0 of 4 logged');
    expect(stored().medicines.find((m: { id: string }) => m.id === 'med-sertraline').quantity).toBe(
      21,
    );
  });

  it('can be unlogged later from the row itself', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(await logButton('Vitamin D 1000 IU'));
    await user.click(screen.getByRole('button', { name: 'Close notification' }));
    await user.click(screen.getByRole('button', { name: 'Undo log: Vitamin D 1000 IU, 8:30 AM' }));
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '0 of 4 logged');
  });

  it('logs a dose with a swipe as well as the button', async () => {
    renderApp('/');
    const button = await logButton('Ferrous fumarate 210 mg', '1:00 PM');
    // Swipe on the row itself, not on the button inside it.
    const row = button.parentElement!;
    fireEvent.pointerDown(row, { pointerId: 3, pointerType: 'touch', clientX: 10, clientY: 10 });
    fireEvent.pointerMove(row, { pointerId: 3, pointerType: 'touch', clientX: 150, clientY: 12 });
    fireEvent.pointerUp(row, { pointerId: 3, pointerType: 'touch' });
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '1 of 4 logged');
  });

  it('celebrates calmly when everything is logged and extends the streak', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await screen.findByRole('heading', { level: 1 });
    for (const b of screen.getAllByRole('button', { name: /^Log\s?:/ })) await user.click(b);
    expect(screen.getByText('All done for today')).toBeInTheDocument();
    expect(screen.getByText('9-day streak')).toBeInTheDocument();
  });

  it('shows due doses on the Today tab badge', async () => {
    renderApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: /Today\s?, 2 due/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('opens the command menu with Ctrl+K and logs a due dose from it', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await screen.findByRole('heading', { level: 1 });
    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByRole('combobox');
    await user.type(input, 'log sertraline');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '1 of 4 logged');
  });

  it('has no axe violations', async () => {
    const { container } = renderApp('/');
    await screen.findByRole('heading', { level: 1 });
    await expectNoAxeViolations(container);
  });
});
