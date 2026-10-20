import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Banner, Button, ButtonLink, Icon, Sheet, useToast } from '../ui';
import { copy } from '../app/copy';
import { useNow, useStore } from '../data/StoreProvider';
import { amountText, daysLeft, foodText, needsRefill } from '../data/schedule';
import { adherence } from '../data/stats';
import { formatTime } from '../lib/time';
import { usePageTitle } from '../lib/usePageTitle';
import { NumberField } from '../components/NumberField';
import s from './screen.module.css';

export default function MedDetailScreen() {
  const { id } = useParams();
  const { data, dispatch } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const now = useNow();
  const [confirm, setConfirm] = useState(false);
  const [refill, setRefill] = useState(false);
  const [amount, setAmount] = useState(28);
  const med = data.medicines.find((m) => m.id === id);
  usePageTitle(med?.name ?? copy.meds.notFound, 'Tempo');

  if (!med) {
    return (
      <div className={s.page}>
        <h1 className={s.title}>{copy.notFound.title}</h1>
        <p>{copy.meds.notFound}</p>
        <ButtonLink to="/meds" variant="secondary">
          {copy.meds.back}
        </ButtonLink>
      </div>
    );
  }
  const stats = adherence(data.medicines, data.doses, now, 30, med.id);

  return (
    <div className={s.page}>
      <Link to="/meds" className={s.back}>
        <Icon name="chevron-left" size="sm" />
        {copy.meds.back}
      </Link>
      <header className={s.headerText}>
        {med.purpose && <span className={s.eyebrow}>{med.purpose}</span>}
        <h1 className={s.title}>{med.name}</h1>
      </header>
      {needsRefill(med) && (
        <Banner
          tone="warning"
          title={copy.today.low(med.name, amountText(med.quantity, med.doseUnit))}
        />
      )}
      <div className={s.tiles}>
        <div className={s.tile}>
          <span className={s.tileValue}>{stats.percent === null ? '—' : `${stats.percent}%`}</span>
          <span className={s.tileLabel}>
            {copy.meds.adherence} ({stats.taken}/{stats.scheduled})
          </span>
        </div>
        <div className={s.tile}>
          <span className={s.tileValue}>{daysLeft(med)}</span>
          <span className={s.tileLabel}>{copy.meds.daysLeft}</span>
        </div>
      </div>
      <section className={s.card} aria-label={copy.meds.schedule}>
        <dl className={s.details}>
          <div>
            <dt>{copy.meds.howMuch}</dt>
            <dd>{amountText(med.doseAmount, med.doseUnit)}</dd>
          </div>
          <div>
            <dt>{copy.meds.schedule}</dt>
            <dd className="t-num">{med.times.map(formatTime).join(' · ')}</dd>
          </div>
          <div>
            <dt>{copy.meds.food}</dt>
            <dd>{foodText(med.food)}</dd>
          </div>
          <div>
            <dt>{copy.meds.supply}</dt>
            <dd>{copy.meds.left(amountText(med.quantity, med.doseUnit))}</dd>
          </div>
        </dl>
      </section>
      <div className={s.row}>
        <Button icon="refill" onClick={() => setRefill(true)}>
          {copy.meds.refill}
        </Button>
        <ButtonLink to={`/meds/${med.id}/edit`} variant="secondary" icon="edit">
          {copy.meds.edit}
        </ButtonLink>
        <Button variant="ghost" icon="trash" onClick={() => setConfirm(true)}>
          {copy.meds.delete}
        </Button>
      </div>

      <Sheet
        open={refill}
        onClose={() => setRefill(false)}
        title={copy.meds.refillTitle}
        footer={
          <Button
            onClick={() => {
              dispatch({
                type: 'save-medicine',
                medicine: { ...med, quantity: med.quantity + amount },
              });
              setRefill(false);
              toast.show({ message: copy.meds.refilled(amount) });
            }}
          >
            {copy.meds.refillSave}
          </Button>
        }
      >
        <NumberField
          label={copy.meds.refillLabel}
          value={amount}
          onChange={setAmount}
          min={1}
          max={500}
        />
      </Sheet>

      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title={copy.meds.deleteTitle(med.name)}
        description={copy.meds.deleteBody}
        footer={
          <>
            <Button variant="secondary" data-autofocus="" onClick={() => setConfirm(false)}>
              {copy.meds.keep}
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                dispatch({ type: 'delete-medicine', id: med.id });
                setConfirm(false);
                toast.show({ message: copy.meds.deleted(med.name), icon: 'trash' });
                navigate('/meds');
              }}
            >
              {copy.meds.deleteConfirm}
            </Button>
          </>
        }
      />
    </div>
  );
}
