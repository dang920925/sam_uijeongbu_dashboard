import { paths } from '@/app/paths';
import { AppStateView } from '@/src/sections/app-state/app-state-view';
import { MSG_D00_STATE } from '@/src/shared/messages/d00';

export default function NotFound() {
  return (
    <AppStateView
      message={MSG_D00_STATE.NOT_FOUND}
      actionLabel={MSG_D00_STATE.GO_DASHBOARD}
      actionHref={paths.dashboard}
    />
  );
}
