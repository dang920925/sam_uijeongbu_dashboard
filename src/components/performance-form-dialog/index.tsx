'use client';

// ----------------------------------------------------------------------
// PerformanceFormDialog — 공연 추가(SCR-D03)·공연 수정(SCR-D04) 공용 폼(design "D03 필드와 같음").
// 공연 제목 * → 타입 *·상태 *(sm↑ 2열) → 설명 → [D5] 포스터(1장) → 상세 이미지(여러 장·순서) → 홈페이지 노출.
// 사진이 있어 wide(640). 업로드 중에는 제출 버튼을 막는다(designer dialog-add-uploading).
// 제출 실패 문구는 다이얼로그 안(errorMessage).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useCallback, useId, useState } from 'react';

import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import { ImageUploadField } from '@/src/components/image-upload-field';
import { ImageListUploadField } from '@/src/components/image-upload-field/image-list-upload-field';
import {
  validatePerformanceForm,
  type PerformanceFormErrors,
} from '@/src/components/performance-form-dialog/validate-performance-form';
import { SwitchField } from '@/src/components/switch-field';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_PERF_FORM } from '@/src/shared/messages/performance-form';
import {
  PERFORMANCE_STATUS_LABEL,
  PERFORMANCE_STATUSES,
  PERFORMANCE_TYPE_LABEL,
  PERFORMANCE_TYPES,
  type PerformanceStatus,
  type PerformanceType,
} from '@/src/types/codes';
import type { PerformanceFormInput } from '@/src/types/performance';

interface PerformanceFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialValue: PerformanceFormInput;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onSubmit: (input: PerformanceFormInput) => void;
  onClose: () => void;
}

export function PerformanceFormDialog(props: PerformanceFormDialogProps) {
  // 열릴 때마다 초기값으로 다시 마운트해 폼 상태를 리셋한다.
  return props.open ? <PerformanceFormBody {...props} /> : null;
}

function PerformanceFormBody({
  open,
  mode,
  initialValue,
  isSubmitting,
  errorMessage,
  onSubmit,
  onClose,
}: PerformanceFormDialogProps) {
  const [form, setForm] = useState<PerformanceFormInput>(initialValue);
  const [errors, setErrors] = useState<PerformanceFormErrors>({ title: null });
  const [isPosterUploading, setIsPosterUploading] = useState(false);
  const [isDetailUploading, setIsDetailUploading] = useState(false);
  const titleId = useId();
  const typeId = useId();
  const statusId = useId();
  const descId = useId();
  const isBusy = isSubmitting || isPosterUploading || isDetailUploading;

  const handleDetailChange = useCallback(
    (detailImageUrls: string[]) =>
      setForm((prev) => ({ ...prev, detailImageUrls })),
    []
  );

  const handleSubmit = () => {
    const next = validatePerformanceForm(form);
    setErrors(next);
    if (next.title || isBusy) return;
    onSubmit(form);
  };

  return (
    <AdminDialog
      open={open}
      wide
      title={
        mode === 'create' ? MSG_PERF_FORM.ADD_TITLE : MSG_PERF_FORM.EDIT_TITLE
      }
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
      <FormField
        label={MSG_PERF_FORM.TITLE}
        htmlFor={titleId}
        required
        error={errors.title}
      >
        <TextField
          id={titleId}
          value={form.title}
          placeholder={MSG_PERF_FORM.TITLE_PH}
          error={Boolean(errors.title)}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          slotProps={{ htmlInput: { maxLength: 100 } }}
          autoFocus
        />
      </FormField>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <FormField
          label={MSG_PERF_FORM.TYPE}
          htmlFor={typeId}
          labelId={`${typeId}-label`}
          required
        >
          <TextField
            id={typeId}
            select
            slotProps={{
              select: {
                SelectDisplayProps: {
                  'aria-labelledby': `${typeId}-label`,
                } as object,
              },
            }}
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as PerformanceType })
            }
          >
            {PERFORMANCE_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {PERFORMANCE_TYPE_LABEL[type]}
              </MenuItem>
            ))}
          </TextField>
        </FormField>
        <FormField
          label={MSG_PERF_FORM.STATUS}
          htmlFor={statusId}
          labelId={`${statusId}-label`}
          required
        >
          <TextField
            id={statusId}
            select
            slotProps={{
              select: {
                SelectDisplayProps: {
                  'aria-labelledby': `${statusId}-label`,
                } as object,
              },
            }}
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as PerformanceStatus })
            }
          >
            {PERFORMANCE_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {PERFORMANCE_STATUS_LABEL[status]}
              </MenuItem>
            ))}
          </TextField>
        </FormField>
      </div>
      <FormField label={MSG_PERF_FORM.DESCRIPTION} htmlFor={descId}>
        <TextField
          id={descId}
          multiline
          minRows={3}
          value={form.description}
          placeholder={MSG_PERF_FORM.DESCRIPTION_PH}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          slotProps={{ htmlInput: { maxLength: 5000 } }}
        />
      </FormField>
      <ImageUploadField
        label={MSG_PERF_FORM.POSTER}
        purpose='PERFORMANCE_POSTER'
        value={form.posterImageUrl}
        onChange={(posterImageUrl) =>
          setForm((prev) => ({ ...prev, posterImageUrl }))
        }
        shape='portrait'
        thumbAlt={MSG_PERF_FORM.POSTER}
        onUploadingChange={setIsPosterUploading}
      />
      <ImageListUploadField
        label={MSG_PERF_FORM.DETAIL_IMAGES}
        purpose='PERFORMANCE_DETAIL'
        value={form.detailImageUrls}
        onChange={handleDetailChange}
        thumbAlt={(index) => `${MSG_PERF_FORM.DETAIL_IMAGES} ${index + 1}`}
        onUploadingChange={setIsDetailUploading}
      />
      <SwitchField
        label={MSG_COMMON.VISIBLE_LABEL}
        checked={form.isVisible}
        onChange={(isVisible) => setForm({ ...form, isVisible })}
      />
    </AdminDialog>
  );
}
