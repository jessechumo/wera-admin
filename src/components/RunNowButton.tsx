import { Play, RefreshCw } from 'lucide-react';
import { useRuns, useTriggerRun } from '../api/admin';
import { errorMessage } from '../api/client';
import { toast } from '../lib/toast';
import { BUTTON_PRIMARY } from './Page';

/** Starts a full fetch-and-score run; disabled while one is in flight. */
export function RunNowButton() {
  const trigger = useTriggerRun();
  const latest = useRuns(1);
  const running = latest.data?.runs[0] != null && latest.data.runs[0].status == null;
  return (
    <button disabled={running || trigger.isPending} className={BUTTON_PRIMARY}
      onClick={() => trigger.mutate(undefined, {
        onSuccess: () => toast.success('Run started. It shows up under Runs.'),
        onError: (e) => toast.error(errorMessage(e, 'Could not start a run')),
      })}>
      {running || trigger.isPending ? <RefreshCw className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
      {running ? 'Running…' : 'Run now'}
    </button>
  );
}
