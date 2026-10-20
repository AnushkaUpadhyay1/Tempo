import { Banner, Button } from '../ui';
import { copy } from '../app/copy';
import { useStore } from '../data/StoreProvider';

export function LoadNotice() {
  const { loadProblem, dismissLoadProblem, droppedCount } = useStore();
  if (loadProblem === 'none') return null;
  const text = {
    'first-visit': copy.load.firstVisit,
    unreadable: copy.load.unreadable,
    'partly-unreadable': copy.load.partly(droppedCount),
    'storage-blocked': copy.load.blocked,
  }[loadProblem];
  return (
    <Banner
      tone={loadProblem === 'first-visit' ? 'info' : 'warning'}
      title={text}
      action={
        <Button variant="secondary" onClick={dismissLoadProblem}>
          {copy.load.dismiss}
        </Button>
      }
    />
  );
}
