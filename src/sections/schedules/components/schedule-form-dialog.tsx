'use client';

// ----------------------------------------------------------------------
// 일정 추가·수정 다이얼로그(현행 Schedules.tsx:243-295 + D5 연결 반/공연). 폼 값·오류는 ViewModel 이 들고 props 로 받는다.
// 필드: 제목* · 타입(기본 연습) · 시작 시간*·종료 시간(md↑ 2열, datetime-local = KST 벽시계) · 장소 · 설명 · 연결 반/공연.
// select 는 combobox(div)라 <label for> 대신 aria-label 로 이름을 붙인다.
// 검증 오류는 필드 아래, 서버 실패(SCH_002 등)는 다이얼로그 안 문구(AdminDialog errorMessage).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import type { ScheduleFormInput } from '@/src/api/schedule-mapper';
import { ScheduleLinkFields } from '@/src/sections/schedules/components/schedule-link-fields';
import type { ScheduleFormErrors } from '@/src/sections/schedules/utils/validate-schedule-form';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D08 } from '@/src/shared/messages/d08';
import type { ScheduleType } from '@/src/types/codes';

interface FormOption {
  value: string;
  label: string;
}

interface ScheduleFormDialogProps {
  open: boolean;
  title: string;
  submitLabel: string;
  form: ScheduleFormInput;
  errors: ScheduleFormErrors;
  submitError: string | null;
  isSubmitting: boolean;
  typeOptions: FormOption[];
  performanceOptions: FormOption[];
  classOptions: FormOption[];
  onFieldChange: <K extends keyof ScheduleFormInput>(
    field: K,
    value: ScheduleFormInput[K]
  ) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function ScheduleFormDialog({
  open,
  title,
  submitLabel,
  form,
  errors,
  submitError,
  isSubmitting,
  typeOptions,
  performanceOptions,
  classOptions,
  onFieldChange,
  onSubmit,
  onClose,
}: ScheduleFormDialogProps) {
  const titleId = useId();
  const typeId = useId();
  const startId = useId();
  const endId = useId();
  const locationId = useId();
  const descriptionId = useId();

  return (
    <AdminDialog
      open={open}
      title={title}
      onClose={onClose}
      onSubmit={onSubmit}
      errorMessage={submitError}
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
        label={MSG_D08.FIELD_TITLE}
        htmlFor={titleId}
        required
        error={errors.title}
      >
        <TextField
          id={titleId}
          value={form.title}
          placeholder={MSG_D08.FIELD_TITLE_PH}
          error={Boolean(errors.title)}
          onChange={(e) => onFieldChange('title', e.target.value)}
          slotProps={{ htmlInput: { maxLength: 100 } }}
          autoFocus
        />
      </FormField>
      <FormField label={MSG_D08.FIELD_TYPE} htmlFor={typeId}>
        <TextField
          id={typeId}
          select
          value={form.type}
          slotProps={{
            select: {
              SelectDisplayProps: { 'aria-label': MSG_D08.FIELD_TYPE },
            },
          }}
          onChange={(e) =>
            onFieldChange('type', e.target.value as ScheduleType)
          }
        >
          {typeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </FormField>
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
        <FormField
          label={MSG_D08.FIELD_START}
          htmlFor={startId}
          required
          error={errors.startAt}
        >
          <TextField
            id={startId}
            type='datetime-local'
            value={form.startAt}
            error={Boolean(errors.startAt)}
            onChange={(e) => onFieldChange('startAt', e.target.value)}
          />
        </FormField>
        <FormField
          label={MSG_D08.FIELD_END}
          htmlFor={endId}
          error={errors.endAt}
        >
          <TextField
            id={endId}
            type='datetime-local'
            value={form.endAt}
            error={Boolean(errors.endAt)}
            onChange={(e) => onFieldChange('endAt', e.target.value)}
          />
        </FormField>
      </div>
      <FormField label={MSG_D08.FIELD_LOCATION} htmlFor={locationId}>
        <TextField
          id={locationId}
          value={form.location}
          placeholder={MSG_D08.FIELD_LOCATION_PH}
          onChange={(e) => onFieldChange('location', e.target.value)}
          slotProps={{ htmlInput: { maxLength: 200 } }}
        />
      </FormField>
      <FormField label={MSG_D08.FIELD_DESCRIPTION} htmlFor={descriptionId}>
        <TextField
          id={descriptionId}
          value={form.description}
          placeholder={MSG_D08.FIELD_DESCRIPTION_PH}
          onChange={(e) => onFieldChange('description', e.target.value)}
          multiline
          minRows={3}
          slotProps={{ htmlInput: { maxLength: 500 } }}
        />
      </FormField>
      <ScheduleLinkFields
        performanceId={form.performanceId}
        classId={form.classId}
        performanceOptions={performanceOptions}
        classOptions={classOptions}
        onPerformanceChange={(value) => onFieldChange('performanceId', value)}
        onClassChange={(value) => onFieldChange('classId', value)}
      />
    </AdminDialog>
  );
}
