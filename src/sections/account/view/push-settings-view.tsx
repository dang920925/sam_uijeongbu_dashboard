'use client';

// ----------------------------------------------------------------------
// SCR-D15 '예매 알림' 카드 View(U37, design §16) — props 만으로 그린다. 계정 카드와 같은 카드·간격·알림 모양을 쓴다.
// 순서: 제목·설명 → 토글 → (권한 거부·미지원·서버 꺼짐 안내) → 기기 목록 → 시험 알림 → iOS 안내(info, 항상).
// 토글은 사용 가능(ready)일 때만 켤 수 있고, 작업 중에는 모두 잠근다.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';

import { SwitchField } from '@/src/components/switch-field';
import { Typo } from '@/src/components/typo';
import { AccountAlert } from '@/src/sections/account/components/account-alert';
import { PushDeviceList } from '@/src/sections/account/components/push-device-list';
import type { PushCardStatus } from '@/src/sections/account/utils/push-card-status';
import type { PushSettingsViewModel } from '@/src/sections/account/view/use-push-settings-view-model';
import { MSG_D15_PUSH } from '@/src/shared/messages/d15-push';

type PushSettingsViewProps = Omit<
  PushSettingsViewModel,
  'status' | 'loadErrorMessage' | 'onRetry'
> & { status: Exclude<PushCardStatus, 'loading' | 'error'> };

const BLOCKED_MESSAGE: Record<
  Exclude<PushCardStatus, 'loading' | 'error' | 'ready'>,
  string
> = {
  'server-disabled': MSG_D15_PUSH.SERVER_DISABLED,
  unsupported: MSG_D15_PUSH.UNSUPPORTED,
  denied: MSG_D15_PUSH.PERMISSION_DENIED,
};

export function PushSettingsView({
  status,
  enabled,
  devices,
  isBusy,
  onToggle,
  onDeleteDevice,
  onSendTest,
}: PushSettingsViewProps) {
  const blocked = status === 'ready' ? null : BLOCKED_MESSAGE[status];
  return (
    <Card
      component='section'
      aria-labelledby='push-settings-title'
      aria-busy={isBusy}
      sx={{
        p: { xs: 4, md: 6 },
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div className='flex flex-col gap-1'>
        <Typo.Title.Bold component='h2' id='push-settings-title'>
          {MSG_D15_PUSH.TITLE}
        </Typo.Title.Bold>
        <Typo.Badge.Regular color='text.secondary'>
          {MSG_D15_PUSH.DESCRIPTION}
        </Typo.Badge.Regular>
      </div>

      <SwitchField
        label={MSG_D15_PUSH.TOGGLE}
        checked={enabled}
        disabled={isBusy || (blocked !== null && !enabled)}
        onChange={onToggle}
      />
      {blocked ? <AccountAlert tone='error' message={blocked} /> : null}

      <Divider />

      <PushDeviceList
        devices={devices}
        disabled={isBusy}
        onDelete={onDeleteDevice}
      />

      <Button
        variant='outlined'
        fullWidth
        disabled={
          isBusy || devices.length === 0 || status === 'server-disabled'
        }
        onClick={onSendTest}
        sx={{ minHeight: 44 }}
      >
        {MSG_D15_PUSH.TEST}
      </Button>

      <AccountAlert tone='info' message={MSG_D15_PUSH.IOS_NOTICE} />
    </Card>
  );
}
