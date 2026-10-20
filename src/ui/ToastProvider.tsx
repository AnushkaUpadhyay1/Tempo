import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { Toast } from './Toast';
import type { ToastData, ToastOptions } from './Toast';

interface ToastApi {
  /** Show a toast. Replaces any toast already on screen. Returns its id. */
  show: (options: ToastOptions) => number;
  dismiss: (id?: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export const DEFAULT_TOAST_DURATION = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const nextId = useRef(1);

  const dismiss = useCallback((id?: number) => {
    setToast((current) => (current && (id === undefined || current.id === id) ? null : current));
  }, []);

  const show = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    setToast({ duration: DEFAULT_TOAST_DURATION, ...options, id });
    // Rewrite the live region so a repeated message is still announced.
    setAnnouncement('');
    const spoken = options.actionLabel
      ? `${options.message}. ${options.actionLabel} button available for ${Math.round((options.duration ?? DEFAULT_TOAST_DURATION) / 1000)} seconds.`
      : options.message;
    window.setTimeout(() => setAnnouncement(spoken), 50);
    return id;
  }, []);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" role="status" className="t-toast-live" style={liveStyle}>
        {announcement}
      </div>
      {toast && <Toast key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />}
    </ToastContext.Provider>
  );
}

const liveStyle = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
}

/** Runs `callback` after `ms`, pausing while `paused` is true. */
export function usePausableTimer(callback: () => void, ms: number, paused: boolean) {
  const remaining = useRef(ms);
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback;
  });
  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const timer = window.setTimeout(() => savedCallback.current(), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused]);
}
