import { useRef, useState } from 'react';
import { Banner, Button, ChipGroup, Field, Segmented, Sheet, Switch, useToast } from '../ui';
import { copy } from '../app/copy';
import { useNow, useStore } from '../data/StoreProvider';
import { adherence, currentStreak, longestStreak, recentDays } from '../data/stats';
import { parseTempoData } from '../data/validate';
import { DEMO_PROFILE } from '../data/demoData';
import { useSettings } from '../settings/SettingsProvider';
import { TEXT_SCALES } from '../settings/settings';
import type { ThemePreference } from '../settings/settings';
import { ACCENT_NAMES, semanticColor } from '../lib/tokens';
import type { AccentName, TokenFile } from '../lib/tokens';
import rawTokens from '../../tokens/tokens.json';
import { dateKey } from '../lib/time';
import { downloadFile } from '../lib/ics';
import { readFileText } from '../lib/readFile';
import { usePageTitle } from '../lib/usePageTitle';
import { PageHeader } from '../components/PageHeader';
import { Heatmap } from '../components/Heatmap';
import s from './screen.module.css';

const y = copy.you;
const tokens = rawTokens as unknown as TokenFile;
type ShareResult = 'shared' | 'cancelled' | 'copied' | 'copy-failed' | null;

export default function YouScreen() {
  usePageTitle(y.title, 'Tempo');
  const { data, dispatch, resetDemo } = useStore();
  const { settings, update } = useSettings();
  const toast = useToast();
  const now = useNow();
  const today = dateKey(now);
  const month = adherence(data.medicines, data.doses, now, 30);
  const week = adherence(data.medicines, data.doses, now, 7);
  const streak = currentStreak(data.medicines, data.doses, now);
  const best = longestStreak(data.medicines, data.doses, now);
  const [message, setMessage] = useState(() => y.buddyMessage(week.taken, week.scheduled, streak));
  const [result, setResult] = useState<ShareResult>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const share = async () => {
    try {
      await navigator.share({ text: message });
      setResult('shared');
    } catch {
      setResult('cancelled');
    }
  };
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setResult('copied');
    } catch {
      setResult('copy-failed');
    }
  };
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    setImportError('');
    try {
      const parsed = parseTempoData(JSON.parse(await readFileText(file)), DEMO_PROFILE);
      if (!parsed) throw new Error('not a backup');
      dispatch({ type: 'reset', data: parsed.data });
      toast.show({ message: y.imported(parsed.data.medicines.length), icon: 'upload' });
    } catch {
      setImportError(y.importFailed);
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <div className={s.page}>
      <PageHeader eyebrow={`${data.profile.name} · ${copy.app.demo}`} title={y.title} />

      <section className={s.section} aria-labelledby="stats-h">
        <h2 id="stats-h" className={s.sectionTitle}>
          {y.stats}
        </h2>
        <div className={s.tiles}>
          <div className={s.tile}>
            <span className={s.tileValue}>
              {month.percent === null ? '—' : `${month.percent}%`}
            </span>
            <span className={s.tileLabel}>{y.adherence}</span>
          </div>
          <div className={s.tile}>
            <span className={s.tileValue}>{streak}</span>
            <span className={s.tileLabel}>
              {y.streak} ({y.days(streak)})
            </span>
          </div>
          <div className={s.tile}>
            <span className={s.tileValue}>{best}</span>
            <span className={s.tileLabel}>
              {y.best} ({y.days(best)})
            </span>
          </div>
        </div>
        <div className={s.card}>
          <h3 className={s.sectionTitle}>
            {y.heatmap}
            <span className={s.sectionMeta}>{y.heatmapHint}</span>
          </h3>
          <Heatmap days={recentDays(data.medicines, data.doses, now, 28)} today={today} />
        </div>
      </section>

      <section className={s.card} aria-labelledby="buddy-h">
        <h2 id="buddy-h" className={s.sectionTitle}>
          {y.buddy}
        </h2>
        <p className={s.muted}>{y.buddyBody(data.profile.buddyName)}</p>
        <Field
          label={y.messageLabel}
          multiline
          value={message}
          onChange={(v) => {
            setMessage(v);
            setResult(null);
          }}
        />
        <div className={s.row}>
          {canShare && (
            <Button icon="share" onClick={share} disabled={!message.trim()}>
              {y.share}
            </Button>
          )}
          <Button
            variant={canShare ? 'secondary' : 'primary'}
            icon="copy"
            onClick={copyText}
            disabled={!message.trim()}
          >
            {y.copy}
          </Button>
        </div>
        <div role="status" aria-live="polite">
          {result && (
            <Banner
              tone={result === 'copied' || result === 'shared' ? 'success' : 'info'}
              title={
                {
                  shared: y.shared,
                  cancelled: y.shareCancelled,
                  copied: y.copied,
                  'copy-failed': y.copyFailed,
                }[result]
              }
            />
          )}
        </div>
      </section>

      <section className={s.card} aria-labelledby="look-h">
        <h2 id="look-h" className={s.sectionTitle}>
          {y.appearance}
        </h2>
        <Segmented<ThemePreference>
          label={y.theme}
          value={settings.theme}
          onChange={(theme) => update({ theme })}
          options={[
            { value: 'system', label: y.themes.system, icon: 'contrast' },
            { value: 'light', label: y.themes.light, icon: 'sun' },
            { value: 'dark', label: y.themes.dark, icon: 'moon' },
          ]}
        />
        <ChipGroup
          legend={y.accent}
          value={settings.accent}
          onChange={(v) => update({ accent: v as AccentName })}
          options={ACCENT_NAMES.map((a) => ({
            value: a,
            label: y.accents[a],
            swatch: semanticColor(tokens, 'dark', a, 'accent.fill'),
          }))}
        />
        <Segmented
          label={y.textSize}
          value={String(settings.textScale)}
          onChange={(v) => update({ textScale: Number(v) })}
          options={TEXT_SCALES.map((t) => ({ value: String(t), label: y.textSizes[t] }))}
        />
        <Switch
          label={y.motion}
          description={y.motionHint}
          checked={settings.reducedMotion}
          onChange={(reducedMotion) => update({ reducedMotion })}
        />
        <Switch
          label={y.haptics}
          description={y.hapticsHint}
          checked={settings.haptics}
          onChange={(haptics) => update({ haptics })}
        />
      </section>

      <section className={s.card} aria-labelledby="data-h">
        <h2 id="data-h" className={s.sectionTitle}>
          {y.data}
        </h2>
        <p className={s.muted}>{y.dataBody}</p>
        <div className={s.row}>
          <Button
            variant="secondary"
            icon="download"
            onClick={() => {
              if (
                downloadFile(
                  `tempo-backup-${today}.json`,
                  JSON.stringify(data, null, 2),
                  'application/json',
                )
              ) {
                toast.show({ message: y.exported, icon: 'download' });
              }
            }}
          >
            {y.export}
          </Button>
          <Button variant="secondary" icon="upload" onClick={() => fileInput.current?.click()}>
            {y.import}
          </Button>
          <Button variant="ghost" icon="refill" onClick={() => setConfirmReset(true)}>
            {y.reset}
          </Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="t-sr-only"
          tabIndex={-1}
          aria-hidden="true"
          data-testid="import-input"
          onChange={(e) => importFile(e.target.files?.[0])}
        />
        {importError && <Banner tone="danger" title={importError} live="assertive" />}
      </section>

      <section className={s.section} aria-labelledby="about-h">
        <h2 id="about-h" className={s.sectionTitle}>
          {y.about}
        </h2>
        <p className={s.muted}>{copy.app.disclaimer}</p>
        <p className={s.muted}>{copy.app.noBackground}</p>
      </section>

      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={y.resetTitle}
        description={y.resetBody}
        footer={
          <>
            <Button variant="secondary" data-autofocus="" onClick={() => setConfirmReset(false)}>
              {y.resetCancel}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetDemo();
                setConfirmReset(false);
                toast.show({ message: y.resetDone, icon: 'refill' });
              }}
            >
              {y.resetConfirm}
            </Button>
          </>
        }
      />
    </div>
  );
}
