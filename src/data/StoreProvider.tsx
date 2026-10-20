import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { createDemoData } from './demoData';
import { loadData, saveData } from './storage';
import type { LoadProblem } from './storage';
import { createId } from './ids';
import type { Appointment, ChecklistItem, Medicine, TempoData } from './types';

export type Action =
  | { type: 'take-dose'; medicineId: string; date: string; time: string; takenAt: string }
  | { type: 'untake-dose'; medicineId: string; date: string; time: string }
  | { type: 'save-medicine'; medicine: Medicine }
  | { type: 'delete-medicine'; id: string }
  | { type: 'save-appointment'; appointment: Appointment }
  | { type: 'delete-appointment'; id: string }
  | { type: 'toggle-checklist'; appointmentId: string; itemId: string }
  | { type: 'add-checklist'; appointmentId: string; label: string }
  | { type: 'remove-checklist'; appointmentId: string; itemId: string }
  | { type: 'reset'; data: TempoData };

const sameDose = (a: { medicineId: string; date: string; time: string }, b: typeof a) =>
  a.medicineId === b.medicineId && a.date === b.date && a.time === b.time;

const updateAppointment = (
  data: TempoData,
  id: string,
  change: (a: Appointment) => Appointment,
): TempoData => ({
  ...data,
  appointments: data.appointments.map((a) => (a.id === id ? change(a) : a)),
});

export function reducer(data: TempoData, action: Action): TempoData {
  switch (action.type) {
    case 'take-dose': {
      if (data.doses.some((d) => sameDose(d, action))) return data;
      const medicine = data.medicines.find((m) => m.id === action.medicineId);
      if (!medicine) return data;
      return {
        ...data,
        doses: [
          ...data.doses,
          {
            medicineId: action.medicineId,
            date: action.date,
            time: action.time,
            takenAt: action.takenAt,
          },
        ],
        medicines: data.medicines.map((m) =>
          m.id === medicine.id ? { ...m, quantity: Math.max(0, m.quantity - m.doseAmount) } : m,
        ),
      };
    }
    case 'untake-dose': {
      if (!data.doses.some((d) => sameDose(d, action))) return data;
      return {
        ...data,
        doses: data.doses.filter((d) => !sameDose(d, action)),
        medicines: data.medicines.map((m) =>
          m.id === action.medicineId ? { ...m, quantity: m.quantity + m.doseAmount } : m,
        ),
      };
    }
    case 'save-medicine': {
      const exists = data.medicines.some((m) => m.id === action.medicine.id);
      const medicine = { ...action.medicine, times: [...new Set(action.medicine.times)].sort() };
      return {
        ...data,
        medicines: exists
          ? data.medicines.map((m) => (m.id === medicine.id ? medicine : m))
          : [...data.medicines, medicine],
        // Forget taken-records for times this medicine no longer has.
        doses: exists
          ? data.doses.filter(
              (d) => d.medicineId !== medicine.id || medicine.times.includes(d.time),
            )
          : data.doses,
      };
    }
    case 'delete-medicine':
      return {
        ...data,
        medicines: data.medicines.filter((m) => m.id !== action.id),
        doses: data.doses.filter((d) => d.medicineId !== action.id),
      };
    case 'save-appointment': {
      const exists = data.appointments.some((a) => a.id === action.appointment.id);
      return {
        ...data,
        appointments: exists
          ? data.appointments.map((a) => (a.id === action.appointment.id ? action.appointment : a))
          : [...data.appointments, action.appointment],
      };
    }
    case 'delete-appointment':
      return { ...data, appointments: data.appointments.filter((a) => a.id !== action.id) };
    case 'toggle-checklist':
      return updateAppointment(data, action.appointmentId, (a) => ({
        ...a,
        checklist: a.checklist.map((item) =>
          item.id === action.itemId ? { ...item, done: !item.done } : item,
        ),
      }));
    case 'add-checklist': {
      const label = action.label.trim();
      if (!label) return data;
      const item: ChecklistItem = { id: createId('item'), label, done: false };
      return updateAppointment(data, action.appointmentId, (a) => ({
        ...a,
        checklist: [...a.checklist, item],
      }));
    }
    case 'remove-checklist':
      return updateAppointment(data, action.appointmentId, (a) => ({
        ...a,
        checklist: a.checklist.filter((item) => item.id !== action.itemId),
      }));
    case 'reset':
      return action.data;
  }
}

interface StoreApi {
  data: TempoData;
  dispatch: (action: Action) => void;
  /** Why the data on screen is demo data or partly recovered, for a one-time notice. */
  loadProblem: LoadProblem;
  /** How many stored records were damaged and left out on load. */
  droppedCount: number;
  dismissLoadProblem: () => void;
  /** False when the browser refused the last save. */
  saved: boolean;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => loadData());
  const [data, dispatch] = useReducer(reducer, initial.data);
  const [loadProblem, setLoadProblem] = useState<LoadProblem>(initial.problem);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setSaved(saveData(data));
  }, [data]);

  const resetDemo = useCallback(() => {
    dispatch({ type: 'reset', data: createDemoData() });
    setLoadProblem('none');
  }, []);
  const dismissLoadProblem = useCallback(() => setLoadProblem('none'), []);

  const value = useMemo(
    () => ({
      data,
      dispatch,
      loadProblem,
      droppedCount: initial.dropped,
      dismissLoadProblem,
      saved,
      resetDemo,
    }),
    [data, loadProblem, initial.dropped, dismissLoadProblem, saved, resetDemo],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside a StoreProvider');
  return context;
}

/** The current time, refreshed every 30 seconds so dose statuses move on their own. */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}
