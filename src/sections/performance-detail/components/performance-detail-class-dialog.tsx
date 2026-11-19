'use client';

// ----------------------------------------------------------------------
// 반 추가·수정 다이얼로그 View(제목 "반 추가"/"반 수정", 버튼 "추가"/"저장") — props 만으로 렌더.
// 순서(designer SCR-D04): 반 이름* → 요일 → 시작/종료 시간(2열 gap 12) → 충돌 경고 → 마감일(+보조 문구)
// → 장소 → 상태 → 제출 차단 문구(AdminDialog errorMessage) → 취소·추가/저장.
// 충돌이면 제출 버튼 비활성(현행 disabled={conflicting}).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { PerformanceDetailDayToggles } from '@/src/sections/performance-detail/components/performance-detail-day-toggles';
import type { ClassDialogState } from '@/src/sections/performance-detail/view/use-performance-class-dialog';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D04 } from '@/src/shared/messages/d04';
import { CLASS_STATUS_LABEL, type ClassStatus } from '@/src/types/codes';

interface PerformanceDetailClassDialogProps {
  dialog: ClassDialogState;
}

const STATUS_OPTIONS: ClassStatus[] = ['ACTIVE', 'INACTIVE'];

export function PerformanceDetailClassDialog({
  dialog,
}: PerformanceDetailClassDialogProps) {
  const nameId = useId();
  const startId = useId();
  const endId = useId();
  const deadlineId = useId();
  const locationId = useId();
  const statusId = useId();
  const { form, errors } = dialog;

  return (
    <AdminDialog
      open={dialog.isOpen}
      title={
        dialog.isEdit ? MSG_D04.CLASS_DIALOG_EDIT : MSG_D04.CLASS_DIALOG_ADD
      }
      onClose={dialog.onClose}
      onSubmit={dialog.onSubmit}
      errorMessage={dialog.submitError}
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
            disabled={dialog.isConflicting || dialog.isSubmitting}
          >
            {dialog.isEdit ? MSG_COMMON.SAVE : MSG_COMMON.ADD}
          </Button>
        </>
      }
    >
      <FormField
        label={MSG_D04.CLASS_NAME}
        htmlFor={nameId}
        required
        error={errors.name}
      >
        <TextField
          id={nameId}
          value={form.name}
          placeholder={MSG_D04.CLASS_NAME_PH}
          error={Boolean(errors.name)}
          onChange={(e) => dialog.onFieldChange('name', e.target.value)}
          slotProps={{ htmlInput: { maxLength: 100 } }}
          autoFocus
        />
      </FormField>
      <FormField label={MSG_D04.CLASS_DAYS} asGroup>
        <PerformanceDetailDayToggles
          states={dialog.dayStates}
          onToggle={dialog.onToggleDay}
        />
      </FormField>
      <div className='grid grid-cols-2 gap-3'>
        <FormField label={MSG_D04.CLASS_START} htmlFor={startId}>
          <TextField
            id={startId}
            type='time'
            value={form.startTime}
            onChange={(e) => dialog.onFieldChange('startTime', e.target.value)}
          />
        </FormField>
        <FormField
          label={MSG_D04.CLASS_END}
          htmlFor={endId}
          error={errors.time}
        >
          <TextField
            id={endId}
            type='time'
            value={form.endTime}
            error={Boolean(errors.time)}
            onChange={(e) => dialog.onFieldChange('endTime', e.target.value)}
          />
        </FormField>
      </div>
      {dialog.isConflicting ? (
        <Box
          role='status'
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 4,
            py: 3,
            borderRadius: 1.5,
            border: 1,
            borderColor: 'semantic.alert.errorBorder',
            bgcolor: 'semantic.alert.errorBg',
            color: 'semantic.alert.errorFg',
          }}
        >
          <Iconify icon='solar:danger-triangle-linear' />
          <Typo.Caption.Regular color='inherit'>
            {MSG_D04.CLASS_CONFLICT_WARNING}
          </Typo.Caption.Regular>
        </Box>
      ) : null}
      <FormField
        label={
          <>
            {MSG_D04.CLASS_DEADLINE}{' '}
            <Typo.Badge.Regular component='span' color='text.secondary'>
              {MSG_D04.CLASS_DEADLINE_HINT}
            </Typo.Badge.Regular>
          </>
        }
        htmlFor={deadlineId}
      >
        <TextField
          id={deadlineId}
          type='date'
          value={form.deadline}
          onChange={(e) => dialog.onFieldChange('deadline', e.target.value)}
        />
      </FormField>
      <FormField label={MSG_D04.CLASS_LOCATION} htmlFor={locationId}>
        <TextField
          id={locationId}
          value={form.location}
          placeholder={MSG_D04.CLASS_LOCATION_PH}
          onChange={(e) => dialog.onFieldChange('location', e.target.value)}
          slotProps={{ htmlInput: { maxLength: 200 } }}
        />
      </FormField>
      <FormField
        label={MSG_D04.CLASS_STATUS}
        htmlFor={statusId}
        labelId={`${statusId}-label`}
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
          onChange={(e) => dialog.onStatusChange(e.target.value as ClassStatus)}
        >
          {STATUS_OPTIONS.map((status) => (
            <MenuItem key={status} value={status}>
              {CLASS_STATUS_LABEL[status]}
            </MenuItem>
          ))}
        </TextField>
      </FormField>
    </AdminDialog>
  );
}
