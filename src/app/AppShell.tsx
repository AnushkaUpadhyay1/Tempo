import { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import {
  Banner,
  Button,
  CommandPalette,
  Field,
  Sheet,
  TabBar,
  ToastProvider,
  useToast,
} from '../ui';
import type { Command } from '../ui';
import { copy } from './copy';
import { ShellContext } from './ShellContext';
import { StoreProvider, useNow, useStore } from '../data/StoreProvider';
import { dosesForDay } from '../data/schedule';
import { useSettings } from '../settings/SettingsProvider';
import { buzz, resolveTheme } from '../settings/settings';
import { ACCENT_NAMES } from '../lib/tokens';
import { dateKey, formatTime } from '../lib/time';
import { useRouteFocus } from '../lib/useRouteFocus';
import styles from './AppShell.module.css';

function Shell() {
  const navigate = useNavigate();
  const { data, dispatch, saved } = useStore();
  const { settings, update } = useSettings();
  const toast = useToast();
  const now = useNow();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [quick, setQuick] = useState('');
  useRouteFocus('#main');

  const today = dateKey(now);
  const todays = dosesForDay(data.medicines, data.doses, today, now);
  const due = todays.filter((d) => d.status === 'due' || d.status === 'overdue');

  // ⌘K / Ctrl+K opens the command menu from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const commands = useMemo<Command[]>(() => {
    const c = copy.commands;
    const list: Command[] = [
      {
        id: 'go-today',
        group: c.go,
        label: copy.tabs.today,
        icon: 'today',
        run: () => navigate('/'),
      },
      {
        id: 'go-meds',
        group: c.go,
        label: copy.tabs.meds,
        icon: 'pill',
        run: () => navigate('/meds'),
      },
      {
        id: 'go-cal',
        group: c.go,
        label: copy.tabs.calendar,
        icon: 'calendar',
        run: () => navigate('/calendar'),
      },
      {
        id: 'go-you',
        group: c.go,
        label: copy.tabs.you,
        icon: 'user',
        keywords: 'settings stats',
        run: () => navigate('/you'),
      },
      {
        id: 'new-med',
        group: c.actions,
        label: copy.form.addTitle,
        icon: 'plus',
        keywords: 'add medicine',
        run: () => navigate('/meds/new'),
      },
      {
        id: 'new-appt',
        group: c.actions,
        label: copy.calendar.add,
        icon: 'calendar-plus',
        keywords: 'add appointment',
        run: () => navigate('/calendar/new'),
      },
      ...due.map((d) => ({
        id: `log-${d.key}`,
        group: c.log,
        label: c.logDose(d.medicine.name),
        hint: formatTime(d.time),
        icon: 'check' as const,
        keywords: 'take dose',
        run: () => {
          dispatch({
            type: 'take-dose',
            medicineId: d.medicine.id,
            date: d.date,
            time: d.time,
            takenAt: new Date().toISOString(),
          });
          buzz(settings);
          toast.show({ message: copy.today.loggedToast(d.medicine.name) });
        },
      })),
      ...data.medicines.map((m) => ({
        id: `med-${m.id}`,
        group: c.meds,
        label: m.name,
        hint: m.times.map(formatTime).join(' · '),
        icon: 'pill' as const,
        keywords: m.purpose,
        run: () => navigate(`/meds/${m.id}`),
      })),
      {
        id: 'theme',
        group: c.appearance,
        label: c.toggleTheme,
        icon: 'contrast',
        keywords: 'dark mode light mode',
        run: () => update({ theme: resolveTheme(settings.theme) === 'dark' ? 'light' : 'dark' }),
      },
      ...ACCENT_NAMES.map((a) => ({
        id: `accent-${a}`,
        group: c.appearance,
        label: c.accent(copy.you.accents[a]),
        icon: 'sparkle' as const,
        keywords: 'colour color',
        run: () => update({ accent: a }),
      })),
    ];
    return list;
  }, [navigate, due, data.medicines, dispatch, settings, update, toast]);

  const shell = useMemo(
    () => ({ openPalette: () => setPaletteOpen(true), openAdd: () => setAddOpen(true) }),
    [],
  );

  return (
    <ShellContext.Provider value={shell}>
      <div className={styles.shell}>
        <a href="#main" className="t-skip">
          {copy.app.skip}
        </a>
        <main id="main" className={styles.main} tabIndex={-1}>
          {!saved && <Banner tone="warning" title={copy.app.notSaved} />}
          <Outlet />
        </main>
        <TabBar
          label={copy.app.nav}
          tabs={[
            { to: '/', label: copy.tabs.today, icon: 'today', end: true, badge: due.length },
            { to: '/meds', label: copy.tabs.meds, icon: 'pill' },
            { to: '/calendar', label: copy.tabs.calendar, icon: 'calendar' },
            { to: '/you', label: copy.tabs.you, icon: 'user' },
          ]}
          action={{ label: copy.app.add, icon: 'plus', onClick: () => setAddOpen(true) }}
        />
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          commands={commands}
        />
        <Sheet open={addOpen} onClose={() => setAddOpen(false)} title={copy.app.add}>
          <form
            className={styles.quick}
            onSubmit={(e) => {
              e.preventDefault();
              setAddOpen(false);
              navigate('/meds/new', { state: { quick } });
              setQuick('');
            }}
          >
            <Field
              label={copy.form.quick}
              hint={copy.form.quickHint}
              value={quick}
              onChange={setQuick}
              optional
              autoComplete="off"
            />
            <Button type="submit" icon="bolt" block disabled={!quick.trim()}>
              {copy.form.quickApply}
            </Button>
          </form>
          <div className={styles.addRow}>
            <Button
              variant="secondary"
              icon="pill"
              onClick={() => {
                setAddOpen(false);
                navigate('/meds/new');
              }}
            >
              {copy.form.addTitle}
            </Button>
            <Button
              variant="secondary"
              icon="calendar-plus"
              onClick={() => {
                setAddOpen(false);
                navigate('/calendar/new');
              }}
            >
              {copy.calendar.add}
            </Button>
          </div>
        </Sheet>
      </div>
    </ShellContext.Provider>
  );
}

export default function AppShell() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  );
}
