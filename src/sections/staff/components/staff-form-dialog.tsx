'use client';

// ----------------------------------------------------------------------
// 연출진 추가·수정 다이얼로그(wide 640, design SCR-D09) —
// 사진(원형 업로드, STAFF_PROFILE) → 이름 *·역할 *(sm↑ 2열, [n]/50) → 소개(≤1000) → 노출 순서 + 홈페이지 노출.
// 열릴 때마다 initialValue 로 다시 마운트해 폼을 리셋한다. 업로드 중에는 제출을 막는다. 제출 실패 문구는 다이얼로그 안.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useId, useState } from 'react';

import type { StaffFormInput } from '@/src/api/staff-mapper';
import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import { ImageUploadField } from '@/src/components/image-upload-field';
import { SwitchField } from '@/src/components/switch-field';
import {
  hasStaffFormError,
  STAFF_BIO_MAX,
  STAFF_TEXT_MAX,
  validateStaffForm,
  type StaffFormErrors,
} from '@/src/sections/staff/utils/staff-form';
import { MSG_COMMON, MSG_UPLOAD } from '@/src/shared/messages/common';
import { MSG_D09 } from '@/src/shared/messages/d09';

interface StaffFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialValue: StaffFormInput;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (input: StaffFormInput) => void;
  onClose: () => void;
}

const NO_ERRORS: StaffFormErrors = { name: null, role: null };

export function StaffFormDialog(props: StaffFormDialogProps) {
  return props.open ? <StaffFormBody {...props} /> : null;
}

function StaffFormBody({
  open,
  mode,
  initialValue,
  isSubmitting,
  errorMessage,
  onSubmit,
  onClose,
}: StaffFormDialogProps) {
  const [form, setForm] = useState<StaffFormInput>(initialValue);
  const [errors, setErrors] = useState<StaffFormErrors>(NO_ERRORS);
  const [isUploading, setIsUploading] = useState(false);
  const nameId = useId();
  const roleId = useId();
  const bioId = useId();
  const orderId = useId();
  const isBusy = isSubmitting || isUploading;

  // 업로드 완료처럼 늦게 오는 값도 최신 폼에 합치도록 함수형 갱신을 쓴다
  const setField = <K extends keyof StaffFormInput>(
    key: K,
    value: StaffFormInput[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  // 고치기 시작하면 그 칸의 오류를 지운다(글자 수 도움말이 다시 보이게)
  const setText = (key: 'name' | 'role', value: string) => {
    setField(key, value);
    setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleSubmit = () => {
    const next = validateStaffForm(form);
    setErrors(next);
    if (hasStaffFormError(next) || isBusy) return;
    onSubmit(form);
  };

  return (
    <AdminDialog
      open={open}
      wide
      title={mode === 'create' ? MSG_D09.ADD_TITLE : MSG_D09.EDIT_TITLE}
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
          <Button type='submit' variant='contained' disabled={isBusy}>
            {mode === 'create' ? MSG_COMMON.ADD : MSG_COMMON.SAVE}
          </Button>
        </>
      }
    >
      <ImageUploadField
        label={MSG_D09.COL_PHOTO}
        purpose='STAFF_PROFILE'
        shape='circle'
        value={form.profileImageUrl}
        onChange={(profileImageUrl) =>
          setForm((prev) => ({ ...prev, profileImageUrl }))
        }
        helper={MSG_UPLOAD.HINT}
        thumbAlt={form.name.trim() || MSG_D09.COL_PHOTO}
        onUploadingChange={setIsUploading}
      />
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <FormField
          label={MSG_D09.COL_NAME}
          htmlFor={nameId}
          required
          error={errors.name}
          helper={`${form.name.length}/${STAFF_TEXT_MAX}`}
        >
          <TextField
            id={nameId}
            value={form.name}
            placeholder={MSG_D09.NAME_PH}
            error={Boolean(errors.name)}
            onChange={(e) => setText('name', e.target.value)}
            slotProps={{ htmlInput: { maxLength: STAFF_TEXT_MAX } }}
            autoFocus
          />
        </FormField>
        <FormField
          label={MSG_D09.COL_ROLE}
          htmlFor={roleId}
          required
          error={errors.role}
          helper={`${form.role.length}/${STAFF_TEXT_MAX}`}
        >
          <TextField
            id={roleId}
            value={form.role}
            placeholder={MSG_D09.ROLE_PH}
            error={Boolean(errors.role)}
            onChange={(e) => setText('role', e.target.value)}
            slotProps={{ htmlInput: { maxLength: STAFF_TEXT_MAX } }}
          />
        </FormField>
      </div>
      <FormField label={MSG_D09.COL_BIO} htmlFor={bioId}>
        <TextField
          id={bioId}
          multiline
          minRows={3}
          value={form.bio}
          placeholder={MSG_D09.BIO_PH}
          onChange={(e) => setField('bio', e.target.value)}
          slotProps={{ htmlInput: { maxLength: STAFF_BIO_MAX } }}
        />
      </FormField>
      <div className='grid grid-cols-1 items-end gap-4 sm:grid-cols-2'>
        <FormField label={MSG_D09.COL_ORDER} htmlFor={orderId}>
          <TextField
            id={orderId}
            type='number'
            value={form.displayOrder}
            onChange={(e) => setField('displayOrder', e.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
          />
        </FormField>
        <SwitchField
          label={MSG_COMMON.VISIBLE_LABEL}
          checked={form.isVisible}
          onChange={(isVisible) => setField('isVisible', isVisible)}
        />
      </div>
    </AdminDialog>
  );
}
