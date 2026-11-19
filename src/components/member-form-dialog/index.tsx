'use client';

// ----------------------------------------------------------------------
// MemberFormDialog — 단원 추가(SCR-D05)·단원으로 등록(SCR-D06, D6) 공용 폼.
// 필드: 이름 *(빈 값 "이름을 입력해주세요") · 연락처 · 구분 *(일반/배우, 기본 일반).
// 열릴 때마다 initialValue 로 다시 채운다(등록은 신청자 이름·연락처 자동 채움).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useId, useState } from 'react';

import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import {
  validateMemberForm,
  type MemberFormErrors,
} from '@/src/components/member-form-dialog/validate-member-form';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_MEMBER_FORM } from '@/src/shared/messages/member-form';
import { MEMBER_TYPE_LABEL, type MemberType } from '@/src/types/codes';
import type { MemberFormInput } from '@/src/types/member';

interface MemberFormDialogProps {
  open: boolean;
  title: string;
  submitLabel: string;
  initialValue: MemberFormInput;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onSubmit: (input: MemberFormInput) => void;
  onClose: () => void;
}

const TYPE_OPTIONS: MemberType[] = ['GENERAL', 'ACTOR'];
const NO_ERRORS: MemberFormErrors = { name: null };

export function MemberFormDialog(props: MemberFormDialogProps) {
  // 열릴 때마다 초기값으로 다시 마운트해 폼 상태를 리셋한다.
  return props.open ? <MemberFormDialogBody {...props} /> : null;
}

function MemberFormDialogBody({
  open,
  title,
  submitLabel,
  initialValue,
  isSubmitting,
  errorMessage,
  onSubmit,
  onClose,
}: MemberFormDialogProps) {
  const [form, setForm] = useState<MemberFormInput>(initialValue);
  const [errors, setErrors] = useState<MemberFormErrors>(NO_ERRORS);
  const nameId = useId();
  const phoneId = useId();
  const typeId = useId();

  const handleSubmit = () => {
    const next = validateMemberForm(form);
    setErrors(next);
    if (next.name) return;
    onSubmit(form);
  };

  return (
    <AdminDialog
      open={open}
      title={title}
      onClose={onClose}
      onSubmit={handleSubmit}
      errorMessage={errorMessage}
      isBusy={isSubmitting}
      actions={
        <>
          <Button
            variant='outlined'
            color='inherit'
            onClick={onClose}
            disabled={isSubmitting}
          >
            {MSG_COMMON.CANCEL}
          </Button>
          <Button type='submit' variant='contained' disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <FormField
        label={MSG_MEMBER_FORM.NAME}
        htmlFor={nameId}
        required
        error={errors.name}
      >
        <TextField
          id={nameId}
          value={form.name}
          placeholder={MSG_MEMBER_FORM.NAME_PH}
          error={Boolean(errors.name)}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          slotProps={{ htmlInput: { maxLength: 50 } }}
          autoFocus
        />
      </FormField>
      <FormField label={MSG_MEMBER_FORM.PHONE} htmlFor={phoneId}>
        <TextField
          id={phoneId}
          value={form.phone}
          placeholder={MSG_MEMBER_FORM.PHONE_PH}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          slotProps={{ htmlInput: { inputMode: 'tel', maxLength: 20 } }}
        />
      </FormField>
      <FormField label={MSG_MEMBER_FORM.TYPE} htmlFor={typeId} required>
        <TextField
          id={typeId}
          select
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value as MemberType })
          }
        >
          {TYPE_OPTIONS.map((type) => (
            <MenuItem key={type} value={type}>
              {MEMBER_TYPE_LABEL[type]}
            </MenuItem>
          ))}
        </TextField>
      </FormField>
    </AdminDialog>
  );
}
