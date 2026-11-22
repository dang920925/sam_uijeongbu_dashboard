'use client';

// ----------------------------------------------------------------------
// SCR-D14 배역 추가·수정 다이얼로그 — "출연(배역 없음) 묶음" 체크(공연당 1개 — 이미 있으면 막고 도움말) · 배역 이름 * · 설명.
// 열릴 때마다 initialValue 로 다시 마운트해 폼을 리셋한다. 제출 실패 문구는 다이얼로그 안.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import { useId, useState } from 'react';

import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import { Typo } from '@/src/components/typo';
import {
  ROLE_DESCRIPTION_MAX,
  ROLE_NAME_MAX,
} from '@/src/sections/performance-cast/utils/role-form';
import type { RoleDialogState } from '@/src/sections/performance-cast/view/use-role-dialog';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D14 } from '@/src/shared/messages/d14';
import type { RoleFormInput } from '@/src/types/cast';

interface RoleDialogProps {
  dialog: RoleDialogState;
}

export function RoleDialog({ dialog }: RoleDialogProps) {
  return dialog.isOpen ? <RoleDialogBody dialog={dialog} /> : null;
}

function RoleDialogBody({ dialog }: RoleDialogProps) {
  const [form, setForm] = useState<RoleFormInput>(dialog.initialValue);
  const nameId = useId();
  const descriptionId = useId();
  const isCreate = dialog.mode === 'create';

  return (
    <AdminDialog
      open
      title={isCreate ? MSG_D14.ROLE_ADD_TITLE : MSG_D14.ROLE_EDIT_TITLE}
      onClose={dialog.onClose}
      onSubmit={() => dialog.onSubmit(form)}
      errorMessage={dialog.errorMessage}
      isBusy={dialog.isSubmitting}
      actions={
        <>
          <Button
            variant='outlined'
            color='inherit'
            onClick={dialog.onClose}
            disabled={dialog.isSubmitting}
          >
            {MSG_COMMON.CANCEL}
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={dialog.isSubmitting}
          >
            {isCreate ? MSG_COMMON.ADD : MSG_COMMON.SAVE}
          </Button>
        </>
      }
    >
      <div className='flex flex-col'>
        <FormControlLabel
          control={
            <Checkbox
              checked={form.isEnsemble}
              disabled={!dialog.canChooseEnsemble}
              onChange={(_, isEnsemble) => setForm({ ...form, isEnsemble })}
            />
          }
          label={MSG_D14.ENSEMBLE_OPTION}
          sx={{ minHeight: 44 }}
        />
        {dialog.canChooseEnsemble ? null : (
          <Typo.Caption.Regular color='text.secondary'>
            {MSG_D14.ENSEMBLE_EXISTS_HELP}
          </Typo.Caption.Regular>
        )}
      </div>
      {form.isEnsemble ? null : (
        <FormField
          label={MSG_D14.ROLE_NAME}
          htmlFor={nameId}
          required
          helper={`${form.name.length}/${ROLE_NAME_MAX}`}
        >
          <TextField
            id={nameId}
            value={form.name}
            placeholder={MSG_D14.ROLE_NAME_PH}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            slotProps={{ htmlInput: { maxLength: ROLE_NAME_MAX } }}
            autoFocus
          />
        </FormField>
      )}
      <FormField label={MSG_D14.ROLE_DESCRIPTION} htmlFor={descriptionId}>
        <TextField
          id={descriptionId}
          multiline
          minRows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          slotProps={{ htmlInput: { maxLength: ROLE_DESCRIPTION_MAX } }}
        />
      </FormField>
    </AdminDialog>
  );
}
