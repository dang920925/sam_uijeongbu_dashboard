'use client';

// ----------------------------------------------------------------------
// SCR-D15 '예매 알림' 카드 컨테이너(U37) — 로딩·오류 분기, 그 밖은 View.
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';

import { ErrorRetry } from '@/src/components/error-retry';
import { PushSettingsView } from '@/src/sections/account/view/push-settings-view';
import { usePushSettingsViewModel } from '@/src/sections/account/view/use-push-settings-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { LAYOUT } from '@/src/theme/layout-tokens';

export function PushSettingsContainer() {
  const { status, loadErrorMessage, onRetry, ...rest } =
    usePushSettingsViewModel();

  if (status === 'loading') {
    return (
      <Card
        aria-busy='true'
        aria-label={MSG_COMMON.LOADING_ARIA}
        sx={{ p: { xs: 4, md: 6 } }}
      >
        <Skeleton variant='text' width='30%' />
        <Skeleton variant='rounded' height={LAYOUT.control} />
      </Card>
    );
  }
  if (status === 'error') {
    return (
      <Card>
        <ErrorRetry message={loadErrorMessage} onRetry={onRetry} />
      </Card>
    );
  }
  return <PushSettingsView status={status} {...rest} />;
}
