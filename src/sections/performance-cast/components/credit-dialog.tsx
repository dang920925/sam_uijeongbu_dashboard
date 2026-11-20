'use client';

// ----------------------------------------------------------------------
// SCR-D14 참여자 추가·수정 다이얼로그(design §12) — 직함 *(자유 입력) · 사람(연출진 / 단원 / 이름만 입력 — 세 갈래) ·
// 홈페이지 노출(기본 꺼짐). 열릴 때마다 initialValue 로 다시 마운트한다.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import { useId, useState } from 'react';

import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import { SwitchField } from '@/src/components/switch-field';
import {
  CREDIT_NAME_MAX,
  CREDIT_TITLE_MAX,
} from '@/src/sections/performance-cast/utils/credit-form';
import type { CreditDialogState } from '@/src/sections/performance-cast/view/use-credit-section';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D14 } from '@/src/shared/messages/d14';
import type { CreditFormInput, CreditPersonKind } from '@/src/types/cast';

interface CreditDialogProps {
  dialog: CreditDialogState;
}

const KINDS: { value: CreditPersonKind; label: string }[] = [
  { value: 'staff', label: MSG_D14.CREDIT_KIND_STAFF },
  { value: 'member', label: MSG_D14.CREDIT_KIND_MEMBER },
  { value: 'name', label: MSG_D14.CREDIT_KIND_NAME },
];

export function CreditDialog({ dialog }: CreditDialogProps) {
  return dialog.isOpen ? <CreditDialogBody dialog={dialog} /> : null;
}

function CreditDialogBody({ dialog }: CreditDialogProps) {
  const [form, setForm] = useState<CreditFormInput>(dialog.initialValue);
  const titleId = useId();
  const personId = useId();
  const kindLabelId = useId();
  const isCreate = dialog.mode === 'create';
  const options =
    form.kind === 'staff' ? dialog.staffOptions : dialog.memberOptions;
  const selected = form.kind === 'staff' ? form.staffId : form.memberId;

  return (
    <AdminDialog
      open
      title={isCreate ? MSG_D14.CREDIT_ADD_TITLE : MSG_D14.CREDIT_EDIT_TITLE}
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
      <FormField
        label={MSG_D14.CREDIT_TITLE}
        htmlFor={titleId}
        required
        helper={`${form.title.length}/${CREDIT_TITLE_MAX}`}
      >
        <TextField
          id={titleId}
          value={form.title}
          placeholder={MSG_D14.CREDIT_TITLE_PH}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          slotProps={{ htmlInput: { maxLength: CREDIT_TITLE_MAX } }}
          autoFocus
        />
      </FormField>
      <FormField label={MSG_D14.CREDIT_PERSON} asGroup labelId={kindLabelId}>
        <RadioGroup
          row
          aria-labelledby={kindLabelId}
          value={form.kind}
          onChange={(e) =>
            setForm({ ...form, kind: e.target.value as CreditPersonKind })
          }
        >
          {KINDS.map((kind) => (
            <FormControlLabel
              key={kind.value}
              value={kind.value}
              control={<Radio />}
              label={kind.label}
              sx={{ minHeight: 44 }}
            />
          ))}
        </RadioGroup>
      </FormField>
      {form.kind === 'name' ? (
        <TextField
          value={form.displayName}
          placeholder={MSG_D14.CREDIT_NAME_PH}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          slotProps={{
            htmlInput: {
              maxLength: CREDIT_NAME_MAX,
              'aria-label': MSG_D14.CREDIT_NAME_PH,
            },
          }}
        />
      ) : (
        <TextField
          id={personId}
          select
          label={
            form.kind === 'staff'
              ? MSG_D14.CREDIT_STAFF_PH
              : MSG_D14.CREDIT_MEMBER_PH
          }
          value={selected ?? ''}
          onChange={(e) =>
            setForm(
              form.kind === 'staff'
                ? { ...form, staffId: e.target.value || null }
                : { ...form, memberId: e.target.value || null }
            )
          }
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
      <SwitchField
        label={MSG_D14.CREDIT_VISIBLE}
        checked={form.isVisible}
        onChange={(isVisible) => setForm({ ...form, isVisible })}
      />
    </AdminDialog>
  );
}
