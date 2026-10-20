import { ButtonLink } from '../ui';
import { copy } from '../app/copy';
import { usePageTitle } from '../lib/usePageTitle';
import s from './screen.module.css';

export default function NotFound() {
  usePageTitle(copy.notFound.title, 'Tempo');
  return (
    <div className={s.page}>
      <h1 className={s.title}>{copy.notFound.title}</h1>
      <p>{copy.notFound.body}</p>
      <ButtonLink to="/">{copy.notFound.home}</ButtonLink>
    </div>
  );
}
