'use client';

// ----------------------------------------------------------------------
// SCR-D15 '입금 알림 기기 등록' 대화상자(U43) — 기기 이름 확인(기본 "관리자 폰") → 등록. 토큰은 화면에 보이지 않는다.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { DEPOSIT_DEVICE_NAME_MAX } from '@/src/api/deposit-device-mapper';
import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import type { DepositDevicesViewModel } from '@/src/sections/account/view/use-deposit-devices-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D15_DEPOSIT } from '@/src/shared/messages/d15-deposit-devices';

interface DepositPairDialogProps {
  dialog: DepositDevicesViewModel['dialog'];
}

export function DepositPairDialog({ dialog }: DepositPairDialogProps) {
  const nameId = useId();
  return (
    <AdminDialog
      open={dialog.isOpen}
      title={MSG_D15_DEPOSIT.DIALOG_TITLE}
      onClose={dialog.onClose}
      onSubmit={dialog.onSubmit}
      errorMessage={dialog.submitError}
      isBusy={dialog.isPairing}
      actions={
        <>
          <Button
            variant='outlined'
            color='inherit'
            onClick={dialog.onClose}
            disabled={dialog.isPairing}
          >
            {MSG_COMMON.CANCEL}
          </Button>
          <Button type='submit' variant='contained' disabled={dialog.isPairing}>
            {dialog.isPairing
              ? MSG_D15_DEPOSIT.PAIRING
              : MSG_D15_DEPOSIT.CONFIRM}
          </Button>
        </>
      }
    >
      <FormField
        label={MSG_D15_DEPOSIT.NAME}
        htmlFor={nameId}
        required
        helper={MSG_D15_DEPOSIT.NAME_HELPER}
        error={dialog.nameError}
      >
        <TextField
          id={nameId}
          value={dialog.name}
          error={Boolean(dialog.nameError)}
          onChange={(e) => dialog.onNameChange(e.target.value)}
          slotProps={{ htmlInput: { maxLength: DEPOSIT_DEVICE_NAME_MAX } }}
          autoFocus
        />
      </FormField>
    </AdminDialog>
  );
}
