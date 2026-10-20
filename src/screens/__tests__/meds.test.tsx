import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../../test/renderApp';
import { expectNoAxeViolations } from '../../test/axe';
import { DATA_KEY } from '../../data/storage';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 21, 10, 0));
});
afterEach(() => vi.useRealTimers());

const stored = () => JSON.parse(localStorage.getItem(DATA_KEY) ?? 'null');

describe('Meds', () => {
  it('lists meds with schedule, supply and low-stock status, and filters them', async () => {
    const user = userEvent.setup();
    renderApp('/meds');
    const list = await screen.findByRole('list', { name: 'Meds' });
    expect(within(list).getAllByRole('link')).toHaveLength(4);
    expect(within(list).getByText('Low')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Supply: Cetirizine 10 mg' })).toHaveAttribute(
      'aria-valuetext',
      '5 days',
    );
    await user.type(screen.getByRole('searchbox', { name: 'Filter meds' }), 'mood');
    expect(within(list).getAllByRole('link')).toHaveLength(1);
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.getByText('No meds match “zzz”.')).toHaveAttribute('role', 'status');
  });

  it('adds a med from the quick-add sheet in the tab bar', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(await screen.findByRole('button', { name: 'Add' }));
    const sheet = screen.getByRole('dialog', { name: 'Add' });
    await user.type(
      within(sheet).getByRole('textbox', { name: 'Quick add · optional' }),
      'melatonin 3mg at 10:30pm',
    );
    await user.click(within(sheet).getByRole('button', { name: 'Fill in the form' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'New med' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Melatonin 3 mg');
    expect(screen.getByLabelText('Exact time 1')).toHaveValue('22:30');
    expect(screen.getByText('at 22:30')).toBeInTheDocument();

    // Food is a real question with no default.
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Pick one.');
    await user.click(screen.getByRole('radio', { name: 'Any time' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Melatonin 3 mg' }),
    ).toBeInTheDocument();
    const saved = stored().medicines.find((m: { name: string }) => m.name === 'Melatonin 3 mg');
    expect(saved).toMatchObject({ times: ['22:30'], food: 'any', doseAmount: 1, demo: false });
    expect(localStorage.getItem('tempo.draft.new')).toBeNull();
  });

  it('validates the full form and saves presets and custom times', async () => {
    const user = userEvent.setup();
    renderApp('/meds/new');
    await screen.findByRole('heading', { level: 1, name: 'New med' });
    await user.click(screen.getByRole('checkbox', { name: /Morning/ }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Give it a name.');
    expect(alert).toHaveTextContent('Pick at least one time.');
    expect(alert).toHaveTextContent('Pick one.');
    // Focus moves to the error summary one frame after saving.
    await waitFor(() => expect(alert.parentElement).toHaveFocus());

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Omeprazole 20 mg');
    await user.click(screen.getByRole('checkbox', { name: /Evening/ }));
    await user.click(screen.getByRole('button', { name: 'Add a time' }));
    await user.click(screen.getByRole('radio', { name: 'Before food' }));
    await user.click(screen.getByRole('button', { name: 'More amount each time' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Omeprazole 20 mg' }),
    ).toBeInTheDocument();
    expect(
      stored().medicines.find((m: { name: string }) => m.name === 'Omeprazole 20 mg'),
    ).toMatchObject({
      times: ['09:30', '19:00'],
      food: 'empty-stomach',
      doseAmount: 2,
    });
  });

  it('restores a draft after leaving the form', async () => {
    const user = userEvent.setup();
    const first = renderApp('/meds/new');
    await user.type(await screen.findByRole('textbox', { name: 'Name' }), 'Half typed');
    first.unmount();
    renderApp('/meds/new');
    expect(
      await screen.findByText('Draft restored. Pick up where you left off.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Half typed');
    await user.click(screen.getByRole('button', { name: 'Discard draft' }));
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('');
  });

  it('shows per-med stats, records a refill, edits and deletes', async () => {
    const user = userEvent.setup();
    renderApp('/meds/med-cetirizine');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Cetirizine 10 mg' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/30-day \(\d+\/\d+\)/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Refilled' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Add to supply' }),
    );
    expect(stored().medicines.find((m: { id: string }) => m.id === 'med-cetirizine').quantity).toBe(
      33,
    );

    await user.click(screen.getByRole('link', { name: 'Edit' }));
    // After navigation, focus moves to the new page heading one frame later.
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Edit med' });
    await waitFor(() => expect(h1).toHaveFocus());
    const name = screen.getByRole('textbox', { name: 'Name' });
    await user.clear(name);
    await user.type(name, 'Cetirizine 10 mg tablets');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const renamed = await screen.findByRole('heading', {
      level: 1,
      name: 'Cetirizine 10 mg tablets',
    });
    await waitFor(() => expect(renamed).toHaveFocus());

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete Cetirizine 10 mg tablets?' });
    expect(within(dialog).getByRole('button', { name: 'Keep it' })).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Meds' })).toBeInTheDocument();
    expect(stored().medicines.some((m: { id: string }) => m.id === 'med-cetirizine')).toBe(false);
  });

  it('has no axe violations on the list and the form', async () => {
    const list = renderApp('/meds');
    await screen.findByRole('heading', { level: 1 });
    await expectNoAxeViolations(list.container);
    list.unmount();
    const form = renderApp('/meds/new');
    await screen.findByRole('heading', { level: 1 });
    await expectNoAxeViolations(form.container);
  });
});
