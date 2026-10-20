import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Banner, Button, ChipGroup, Field, Icon, IconButton, Pill, useToast } from '../ui';
import { copy } from '../app/copy';
import { useStore } from '../data/StoreProvider';
import { parseQuickAdd } from '../data/quickAdd';
import type { QuickAddResult } from '../data/quickAdd';
import {
  PRESET_TIMES,
  applyQuickAdd,
  clearMedDraft,
  draftKey,
  draftToMed,
  emptyMedDraft,
  loadMedDraft,
  medToDraft,
  saveMedDraft,
  validateMed,
} from '../data/medForm';
import type { MedDraft, MedErrors } from '../data/medForm';
import { DOSE_UNITS, FOOD_RULES } from '../data/types';
import type { DoseUnit, FoodRule } from '../data/types';
import { formatTime } from '../lib/time';
import { usePageTitle } from '../lib/usePageTitle';
import { NumberField } from '../components/NumberField';
import s from './screen.module.css';
import local from './MedFormScreen.module.css';

const f = copy.form;

export default function MedFormScreen() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, dispatch } = useStore();
  const existing = id ? data.medicines.find((m) => m.id === id) : undefined;
  const key = draftKey(existing?.id);
  const incomingQuick = (location.state as { quick?: string } | null)?.quick ?? '';

  const [init] = useState(() => {
    const stored = incomingQuick ? null : loadMedDraft(key);
    const base = stored ?? (existing ? medToDraft(existing) : emptyMedDraft());
    const parsed = incomingQuick ? parseQuickAdd(incomingQuick) : null;
    return { draft: parsed ? applyQuickAdd(base, parsed) : base, restored: !!stored, parsed };
  });
  const [draft, setDraft] = useState<MedDraft>(init.draft);
  const [restored, setRestored] = useState(init.restored);
  const [quick, setQuick] = useState(incomingQuick);
  const [parsed, setParsed] = useState<QuickAddResult | null>(init.parsed);
  const [errors, setErrors] = useState<MedErrors>({});
  const summary = useRef<HTMLDivElement>(null);
  usePageTitle(existing ? f.editTitle : f.addTitle, 'Tempo');

  useEffect(() => saveMedDraft(key, draft), [key, draft]);

  if (id && !existing) {
    return (
      <div className={s.page}>
        <h1 className={s.title}>{copy.notFound.title}</h1>
        <p>{copy.meds.notFound}</p>
      </div>
    );
  }

  const set = (patch: Partial<MedDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setErrors({});
  };
  const presets = draft.times.filter((t) => PRESET_TIMES.some((p) => p.value === t));
  const custom = draft.times.filter((t) => !PRESET_TIMES.some((p) => p.value === t));

  const save = () => {
    const found = validateMed(draft);
    setErrors(found);
    if (Object.keys(found).length) {
      window.requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    const med = draftToMed(draft, existing);
    dispatch({ type: 'save-medicine', medicine: med });
    clearMedDraft(key);
    toast.show({ message: f.saved(med.name) });
    navigate(`/meds/${med.id}`, { replace: true });
  };

  return (
    <div className={s.page}>
      <Link to={existing ? `/meds/${existing.id}` : '/meds'} className={s.back}>
        <Icon name="chevron-left" size="sm" />
        {existing ? existing.name : copy.meds.back}
      </Link>
      <h1 className={s.title}>{existing ? f.editTitle : f.addTitle}</h1>

      {restored && (
        <Banner
          title={f.draft}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                clearMedDraft(key);
                setDraft(existing ? medToDraft(existing) : emptyMedDraft());
                setRestored(false);
              }}
            >
              {f.discard}
            </Button>
          }
        />
      )}

      {!existing && (
        <form
          className={local.quick}
          onSubmit={(e) => {
            e.preventDefault();
            const result = parseQuickAdd(quick);
            setParsed(result);
            setDraft((d) => applyQuickAdd(d, result));
          }}
        >
          <Field
            label={f.quick}
            hint={f.quickHint}
            value={quick}
            onChange={setQuick}
            optional
            autoComplete="off"
          />
          <Button type="submit" variant="secondary" icon="bolt" disabled={!quick.trim()}>
            {f.quickApply}
          </Button>
          <div role="status" className={local.understood}>
            {parsed &&
              (parsed.understood.length || parsed.name ? (
                <>
                  <span className={s.muted}>{f.understood}:</span>
                  {parsed.name && <Pill tone="accent" icon="pill" label={parsed.name} />}
                  {parsed.understood.map((u) => (
                    <Pill key={u} tone="accent" icon="check" label={u} />
                  ))}
                </>
              ) : (
                <span className={s.muted}>{f.quickNothing}</span>
              ))}
          </div>
        </form>
      )}

      <form
        className={s.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        {Object.keys(errors).length > 0 && (
          <div ref={summary} tabIndex={-1}>
            <Banner tone="danger" title={f.errors} live="assertive">
              <ul>
                {Object.values(errors).map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Banner>
          </div>
        )}
        <section className={s.card} aria-labelledby="what-h">
          <h2 id="what-h" className="t-sr-only">
            {f.name}
          </h2>
          <Field
            label={f.name}
            hint={f.nameHint}
            value={draft.name}
            error={errors.name}
            onChange={(name) => set({ name })}
            autoComplete="off"
          />
          <Field
            label={f.purpose}
            optional
            value={draft.purpose}
            onChange={(purpose) => set({ purpose })}
          />
        </section>

        <section className={s.card} aria-label={f.amount}>
          <NumberField
            label={f.amount}
            value={draft.doseAmount}
            min={1}
            max={20}
            error={errors.doseAmount}
            onChange={(doseAmount) => set({ doseAmount })}
          />
          <ChipGroup
            legend={f.unit}
            value={draft.doseUnit}
            onChange={(v) => set({ doseUnit: v as DoseUnit })}
            options={DOSE_UNITS.map((u) => ({ value: u, label: f.units[u] }))}
          />
        </section>

        <section className={s.card} aria-label={f.times}>
          <ChipGroup
            legend={f.times}
            hint={f.timesHint}
            multiple
            error={errors.times}
            value={presets}
            onChange={(v) => set({ times: [...(v as string[]), ...custom].sort() })}
            options={PRESET_TIMES.map((p) => ({
              value: p.value,
              label: p.label,
              detail: formatTime(p.value),
            }))}
          />
          {custom.map((t, i) => (
            <div key={`${t}-${i}`} className={local.timeRow}>
              <Field
                label={f.customTime(i + 1)}
                type="time"
                value={t}
                onChange={(value) =>
                  set({ times: [...presets, ...custom.map((c, j) => (j === i ? value : c))] })
                }
              />
              <IconButton
                icon="trash"
                label={f.removeTime(formatTime(t))}
                onClick={() => set({ times: [...presets, ...custom.filter((_, j) => j !== i)] })}
              />
            </div>
          ))}
          <div>
            <Button
              variant="ghost"
              icon="plus"
              onClick={() => set({ times: [...draft.times, '09:30'] })}
            >
              {f.addTime}
            </Button>
          </div>
        </section>

        <section className={s.card} aria-label={f.food}>
          <ChipGroup
            legend={f.food}
            value={draft.food}
            error={errors.food}
            onChange={(v) => set({ food: v as FoodRule })}
            options={FOOD_RULES.map((r) => ({ value: r, label: f.foods[r], icon: 'food' }))}
          />
        </section>

        <section className={`${s.card} ${local.pair}`} aria-label={copy.meds.supply}>
          <NumberField
            label={f.quantity}
            value={draft.quantity}
            onChange={(quantity) => set({ quantity })}
          />
          <NumberField
            label={f.refillAt}
            value={draft.refillAt}
            max={200}
            onChange={(refillAt) => set({ refillAt })}
          />
        </section>

        <div className={s.formActions}>
          <Button
            variant="ghost"
            onClick={() => {
              clearMedDraft(key);
              navigate(existing ? `/meds/${existing.id}` : '/meds');
            }}
          >
            {f.cancel}
          </Button>
          <Button type="submit" size="lg" icon="check">
            {f.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
