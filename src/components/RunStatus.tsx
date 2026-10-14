import type { RunStatus as Status } from '../api/types';
import { Badge } from './Badge';

export function RunStatus({ status }: { status: Status }) {
  if (status === 'ok') return <Badge variant="good">ok</Badge>;
  if (status === 'partial') return <Badge variant="warn">partial</Badge>;
  if (status === 'failed') return <Badge variant="bad">failed</Badge>;
  return <Badge variant="accent">running</Badge>;
}
