'use client';

// ----------------------------------------------------------------------
// SCR-D15 '입금 알림 기기' 카드 View(U43) — props 만으로 그린다. '예매 알림' 카드와 같은 카드·간격·알림 모양.
// 순서: 제목·설명 → 기기 목록 → (앱 안) 등록 버튼 / (앱 밖) 앱에서 등록하라는 안내 → 상한 안내.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';

import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { Typo } from '@/src/components/typo';
import { AccountAlert } from '@/src/sections/account/components/account-alert';
import { DepositDeviceList } from '@/src/sections/account/components/deposit-device-list';
import { DepositPairDialog } from '@/src/sections/account/components/deposit-pair-dialog';
import type { DepositDevicesViewModel } from '@/src/sections/account/view/use-deposit-devices-view-model';
import { MSG_D15_DEPOSIT } from '@/src/shared/messages/d15-deposit-devices';

type DepositDevicesViewProps = Omit<
  DepositDevicesViewModel,
  'status' | 'loadErrorMessage' | 'onRetry'
>;

export function DepositDevicesView({
  devices,
  limit,
  isFull,
  isAdminApp,
  dialog,
  onOpenPair,
  revokeTarget,
  isRevoking,
  onAskRevoke,
  onCancelRevoke,
  onConfirmRevoke,
}: DepositDevicesViewProps) {
  return (
    <Card
      component='section'
      aria-labelledby='deposit-devices-card-title'
      sx={{
        p: { xs: 4, md: 6 },
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div className='flex flex-col gap-1'>
        <Typo.Title.Bold component='h2' id='deposit-devices-card-title'>
          {MSG_D15_DEPOSIT.TITLE}
        </Typo.Title.Bold>
        <Typo.Badge.Regular color='text.secondary'>
          {MSG_D15_DEPOSIT.DESCRIPTION}
        </Typo.Badge.Regular>
      </div>

      <DepositDeviceList
        devices={devices}
        disabled={isRevoking}
        onRevoke={onAskRevoke}
      />

      <Divider />

      {isAdminApp ? (
        <Button
          variant='contained'
          fullWidth
          disabled={isFull || dialog.isPairing}
          onClick={onOpenPair}
          sx={{ minHeight: 44 }}
        >
          {MSG_D15_DEPOSIT.PAIR}
        </Button>
      ) : (
        <AccountAlert tone='info' message={MSG_D15_DEPOSIT.APP_ONLY} />
      )}
      {isAdminApp && isFull ? (
        <AccountAlert
          tone='error'
          message={MSG_D15_DEPOSIT.LIMIT_REACHED(limit)}
        />
      ) : null}

      <DepositPairDialog dialog={dialog} />
      <ConfirmDialog
        open={revokeTarget !== null}
        message={MSG_D15_DEPOSIT.REVOKE_CONFIRM(revokeTarget?.name ?? '')}
        description={MSG_D15_DEPOSIT.REVOKE_DESCRIPTION}
        confirmLabel={MSG_D15_DEPOSIT.REVOKE}
        isLoading={isRevoking}
        onConfirm={onConfirmRevoke}
        onCancel={onCancelRevoke}
      />
    </Card>
  );
}
