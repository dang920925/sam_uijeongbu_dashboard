'use client';

// ----------------------------------------------------------------------
// 팝업 추가·수정 다이얼로그(wide 640, design SCR-D10) —
// 겹침 경고(입력 중인 기간이 다른 활성 팝업과 겹치면, 막지 않음) → 이미지 *(POPUP 업로드) → 링크 URL(https 만)
// → 시작일 *·종료일 *(sm↑ 2열) → 활성 스위치(기본 켬). 제출 실패 문구는 다이얼로그 안.
// ----------------------------------------------------------------------
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useId, useState } from 'react';

import type { PopupFormInput } from '@/src/api/popup-mapper';
import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import { Iconify } from '@/src/components/iconify';
import { ImageUploadField } from '@/src/components/image-upload-field';
import { SwitchField } from '@/src/components/switch-field';
import { Typo } from '@/src/components/typo';
import {
  hasPopupFormError,
  POPUP_LINK_MAX,
  validatePopupForm,
  type PopupFormErrors,
} from '@/src/sections/popups/utils/popup-form';
import { MSG_COMMON, MSG_UPLOAD } from '@/src/shared/messages/common';
import { MSG_D10 } from '@/src/shared/messages/d10';

interface PopupFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialValue: PopupFormInput;
  isSubmitting: boolean;
  errorMessage: string | null;
  /** 입력 중인 값이 다른 활성 팝업과 기간이 겹치는지 — ViewModel 이 목록으로 계산 */
  checkOverlap: (input: PopupFormInput) => boolean;
  onSubmit: (input: PopupFormInput) => void;
  onClose: () => void;
}

const NO_ERRORS: PopupFormErrors = {
  imageUrl: null,
  linkUrl: null,
  startDate: null,
  endDate: null,
};

export function PopupFormDialog(props: PopupFormDialogProps) {
  return props.open ? <PopupFormBody {...props} /> : null;
}

function PopupFormBody({
  open,
  mode,
  initialValue,
  isSubmitting,
  errorMessage,
  checkOverlap,
  onSubmit,
  onClose,
}: PopupFormDialogProps) {
  const [form, setForm] = useState<PopupFormInput>(initialValue);
  const [errors, setErrors] = useState<PopupFormErrors>(NO_ERRORS);
  const [isUploading, setIsUploading] = useState(false);
  const linkId = useId();
  const startId = useId();
  const endId = useId();
  const isBusy = isSubmitting || isUploading;
  const isOverlapping = checkOverlap(form);

  // 함수형 갱신(업로드 완료처럼 늦게 오는 값도 최신 폼에 합침). 고치기 시작하면 그 칸의 오류를 지운다(종료일 오류는 시작일을 고쳐도 지운다 — 두 칸이 함께 정하는 규칙)
  const setField = <K extends keyof PopupFormInput>(
    key: K,
    value: PopupFormInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({
      ...prev,
      ...(key in prev ? { [key]: null } : {}),
      ...(key === 'startDate' ? { endDate: null } : {}),
    }));
  };

  const handleSubmit = () => {
    const next = validatePopupForm(form);
    setErrors(next);
    if (hasPopupFormError(next) || isBusy) return;
    onSubmit(form);
  };

  return (
    <AdminDialog
      open={open}
      wide
      title={mode === 'create' ? MSG_D10.ADD_TITLE : MSG_D10.EDIT_TITLE}
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
      {isOverlapping ? (
        <Alert
          severity='warning'
          icon={<Iconify icon='solar:danger-triangle-linear' />}
          sx={{
            bgcolor: 'semantic.alert.warningBg',
            color: 'semantic.alert.warningFg',
            border: 1,
            borderColor: 'semantic.alert.warningBorder',
          }}
        >
          <Typo.Badge.Regular color='inherit' role='status'>
            {MSG_D10.OVERLAP}
          </Typo.Badge.Regular>
        </Alert>
      ) : null}
      <ImageUploadField
        label={MSG_D10.IMAGE}
        purpose='POPUP'
        required
        value={form.imageUrl}
        error={errors.imageUrl}
        onChange={(imageUrl) => setField('imageUrl', imageUrl)}
        helper={MSG_UPLOAD.HINT}
        thumbAlt={MSG_D10.IMAGE}
        onUploadingChange={setIsUploading}
      />
      <FormField label={MSG_D10.LINK} htmlFor={linkId} error={errors.linkUrl}>
        <TextField
          id={linkId}
          type='url'
          value={form.linkUrl}
          placeholder={MSG_D10.LINK_PH}
          error={Boolean(errors.linkUrl)}
          onChange={(e) => setField('linkUrl', e.target.value)}
          slotProps={{ htmlInput: { maxLength: POPUP_LINK_MAX } }}
        />
      </FormField>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <FormField
          label={MSG_D10.START_DATE}
          htmlFor={startId}
          required
          error={errors.startDate}
        >
          <TextField
            id={startId}
            type='date'
            value={form.startDate}
            error={Boolean(errors.startDate)}
            onChange={(e) => setField('startDate', e.target.value)}
          />
        </FormField>
        <FormField
          label={MSG_D10.END_DATE}
          htmlFor={endId}
          required
          error={errors.endDate}
        >
          <TextField
            id={endId}
            type='date'
            value={form.endDate}
            error={Boolean(errors.endDate)}
            onChange={(e) => setField('endDate', e.target.value)}
          />
        </FormField>
      </div>
      <SwitchField
        label={MSG_D10.ACTIVE}
        checked={form.isActive}
        onChange={(isActive) => setField('isActive', isActive)}
      />
    </AdminDialog>
  );
}
