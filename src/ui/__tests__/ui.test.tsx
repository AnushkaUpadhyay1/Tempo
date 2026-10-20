import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import {
  Button,
  ChipGroup,
  CommandPalette,
  Field,
  ProgressRing,
  Segmented,
  Sheet,
  SwipeAction,
  Switch,
  TabBar,
} from '..';
import type { Command } from '..';
import { expectNoAxeViolations } from '../../test/axe';

describe('Button and Field', () => {
  it('defaults to type="button"', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('links a field to its hint and error', () => {
    render(<Field label="Name" hint="As on the box." error="Give it a name." />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveAccessibleDescription('As on the box. Give it a name.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('ChipGroup', () => {
  function Chips({ multiple = false }) {
    const [v, setV] = useState<string | string[]>(multiple ? [] : 'tablet');
    return (
      <ChipGroup
        legend="Form"
        multiple={multiple}
        value={v}
        onChange={setV}
        options={[
          { value: 'tablet', label: 'Tablet' },
          { value: 'capsule', label: 'Capsule' },
        ]}
      />
    );
  }

  it('behaves as a radio group', async () => {
    render(<Chips />);
    expect(screen.getByRole('group', { name: 'Form' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Tablet' })).toBeChecked();
    await userEvent.click(screen.getByText('Capsule'));
    expect(screen.getByRole('radio', { name: 'Capsule' })).toBeChecked();
  });

  it('allows several choices when multiple', async () => {
    render(<Chips multiple />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Tablet' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Capsule' }));
    expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(2);
  });
});

describe('Segmented and Switch', () => {
  it('is a radio group with roving focus and arrow keys', async () => {
    function Seg() {
      const [v, setV] = useState<'a' | 'b' | 'c'>('a');
      return (
        <Segmented
          label="Theme"
          value={v}
          onChange={setV}
          options={[
            { value: 'a', label: 'Auto' },
            { value: 'b', label: 'Light' },
            { value: 'c', label: 'Dark' },
          ]}
        />
      );
    }
    render(<Seg />);
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument();
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Auto' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Auto' })).toHaveAttribute('tabindex', '-1');
  });

  it('switch reports its state', async () => {
    function S() {
      const [on, setOn] = useState(false);
      return <Switch label="Haptics" description="A tiny buzz." checked={on} onChange={setOn} />;
    }
    render(<S />);
    const sw = screen.getByRole('switch', { name: 'Haptics' });
    expect(sw).toHaveAccessibleDescription('A tiny buzz.');
    await userEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });
});

describe('Sheet', () => {
  function Demo() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Delete</Button>
        <Sheet
          open={open}
          onClose={() => setOpen(false)}
          title="Delete Sertraline?"
          description="You cannot undo it."
          footer={
            <Button data-autofocus="" variant="secondary" onClick={() => setOpen(false)}>
              Keep it
            </Button>
          }
        />
      </>
    );
  }

  it('opens as a named dialog, focuses the safe choice, and returns focus', async () => {
    render(<Demo />);
    const opener = screen.getByRole('button', { name: 'Delete' });
    await userEvent.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Delete Sertraline?' });
    expect(dialog).toHaveAccessibleDescription('You cannot undo it.');
    expect(screen.getByRole('button', { name: 'Keep it' })).toHaveFocus();
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('has no axe violations when open', async () => {
    const { container } = render(<Demo />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await expectNoAxeViolations(container);
  });
});

describe('SwipeAction', () => {
  it('runs the action after a long enough touch swipe, not a short one', () => {
    const onSwipe = vi.fn();
    render(
      <SwipeAction onSwipe={onSwipe} hint="Logged">
        <div data-testid="row">Sertraline</div>
      </SwipeAction>,
    );
    const row = screen.getByTestId('row').parentElement!;
    const swipe = (dx: number) => {
      fireEvent.pointerDown(row, { pointerId: 1, pointerType: 'touch', clientX: 10, clientY: 10 });
      fireEvent.pointerMove(row, {
        pointerId: 1,
        pointerType: 'touch',
        clientX: 10 + dx,
        clientY: 12,
      });
      fireEvent.pointerUp(row, { pointerId: 1, pointerType: 'touch' });
    };
    swipe(40);
    expect(onSwipe).not.toHaveBeenCalled();
    swipe(130);
    expect(onSwipe).toHaveBeenCalledTimes(1);
  });

  it('ignores vertical scrolling', () => {
    const onSwipe = vi.fn();
    render(
      <SwipeAction onSwipe={onSwipe} hint="Logged">
        <div data-testid="row">Row</div>
      </SwipeAction>,
    );
    const row = screen.getByTestId('row').parentElement!;
    fireEvent.pointerDown(row, { pointerId: 1, pointerType: 'touch', clientX: 10, clientY: 10 });
    fireEvent.pointerMove(row, { pointerId: 1, pointerType: 'touch', clientX: 30, clientY: 200 });
    fireEvent.pointerMove(row, { pointerId: 1, pointerType: 'touch', clientX: 200, clientY: 210 });
    fireEvent.pointerUp(row, { pointerId: 1, pointerType: 'touch' });
    expect(onSwipe).not.toHaveBeenCalled();
  });
});

describe('ProgressRing and TabBar', () => {
  it('exposes the ring as a meter with spoken value', () => {
    render(<ProgressRing value={3} max={4} label="Doses logged today" valueText="3 of 4 logged" />);
    const meter = screen.getByRole('meter', { name: 'Doses logged today' });
    expect(meter).toHaveAttribute('aria-valuenow', '3');
    expect(meter).toHaveAttribute('aria-valuetext', '3 of 4 logged');
  });

  it('marks the current tab and names the action button', async () => {
    const onAdd = vi.fn();
    const { container } = render(
      <MemoryRouter initialEntries={['/meds']}>
        <TabBar
          label="Main"
          tabs={[
            { to: '/', label: 'Today', icon: 'today', end: true, badge: 2 },
            { to: '/meds', label: 'Meds', icon: 'pill' },
            { to: '/calendar', label: 'Calendar', icon: 'calendar' },
            { to: '/you', label: 'You', icon: 'user' },
          ]}
          action={{ label: 'Add', icon: 'plus', onClick: onAdd }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Meds' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Today\s?, 2 due/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onAdd).toHaveBeenCalled();
    await expectNoAxeViolations(container);
  });
});

describe('CommandPalette', () => {
  const run = vi.fn();
  const commands: Command[] = [
    { id: '1', group: 'Go to', label: 'Today', icon: 'today', run },
    { id: '2', group: 'Go to', label: 'Calendar', icon: 'calendar', run },
    { id: '3', group: 'Meds', label: 'Sertraline 50 mg', icon: 'pill', keywords: 'mood', run },
  ];

  function Demo() {
    const [open, setOpen] = useState(true);
    return <CommandPalette open={open} onClose={() => setOpen(false)} commands={commands} />;
  }

  it('filters as you type and runs the active result with Enter', async () => {
    run.mockClear();
    render(<Demo />);
    const input = screen.getByRole('combobox', { name: 'Search commands and medicines' });
    expect(input).toHaveFocus();
    expect(screen.getAllByRole('option')).toHaveLength(3);
    await userEvent.type(input, 'mood');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option').id);
    await userEvent.keyboard('{Enter}');
    expect(run).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('moves the active option with arrow keys', async () => {
    render(<Demo />);
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Calendar' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(screen.getByRole('option', { name: 'Sertraline 50 mg' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('says when nothing matches', async () => {
    render(<Demo />);
    await userEvent.type(screen.getByRole('combobox'), 'zzz');
    expect(screen.getByRole('status')).toHaveTextContent('Nothing matches');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Demo />);
    await expectNoAxeViolations(container);
  });
});
