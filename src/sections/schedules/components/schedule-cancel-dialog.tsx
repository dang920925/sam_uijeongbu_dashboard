'use client';

// ----------------------------------------------------------------------
// U29 일정 취소 창(design §8 · 시안 SCR-D08-U29 dialog) — 폭 512, xs 전체 화면(AdminDialog).
// 일정 요약 → 사유*(50자, 글자 수) → [연습·공연만] 체크 "이 날 참관 신청 받지 않음"(기본 켬) + 도움말 →
// [참관 신청이 있으면] 경고 박스(role="status", 이름 최대 5 + "외 n건") → "닫기"·"취소 처리"(contained — 되돌릴 수 있는 동작).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import type { ScheduleCancelState } from '@/src/sections/schedules/view/use-schedule-cancel';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D08 } from '@/src/shared/messages/d08';
import { RADIUS } from '@/src/theme/layout-tokens';

interface ScheduleCancelDialogProps {
  state: ScheduleCancelState;
}

export function ScheduleCancelDialog({ state }: ScheduleCancelDialogProps) {
  const reasonId = useId();
  const helpId = useId();
  const { summary, impact } = state;
  return (
    <AdminDialog
      open={state.isOpen}
      title={MSG_D08.CANCEL}
      onClose={state.onClose}
      onSubmit={state.onSubmit}
      errorMessage={state.submitError}
      isBusy={state.isSubmitting}
      actions={
        <>
          <Button
            variant='outlined'
            color='inherit'
            onClick={state.onClose}
            disabled={state.isSubmitting}
          >
            {MSG_COMMON.CLOSE}
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={state.isSubmitting}
            startIcon={
              state.isSubmitting ? (
                <CircularProgress size={16} color='inherit' />
              ) : undefined
            }
          >
            {MSG_D08.CANCEL_SUBMIT}
          </Button>
        </>
      }
    >
      {summary ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            p: 4,
            bgcolor: 'background.default',
            border: 1,
            borderColor: 'divider',
            borderRadius: `${RADIUS.md}px`,
          }}
        >
          <div className='flex flex-wrap items-center gap-2'>
            <Label tone={summary.typeTone} variant={summary.typeVariant}>
              {summary.typeLabel}
            </Label>
            <Typo.Badge.Semibold>{summary.title}</Typo.Badge.Semibold>
          </div>
          <Typo.Caption.Regular color='text.secondary'>
            {summary.whenText}
          </Typo.Caption.Regular>
        </Box>
      ) : null}
      <FormField
        label={MSG_D08.CANCEL_REASON}
        htmlFor={reasonId}
        required
        error={state.reasonError}
      >
        <TextField
          id={reasonId}
          value={state.reason}
          onChange={(e) => state.onReasonChange(e.target.value)}
          placeholder={MSG_D08.CANCEL_REASON_PH}
          error={Boolean(state.reasonError)}
          fullWidth
          autoFocus
          slotProps={{ htmlInput: { maxLength: state.reasonMax } }}
        />
        <Typo.Caption.Regular
          color='text.secondary'
          sx={{ alignSelf: 'flex-end', fontVariantNumeric: 'tabular-nums' }}
        >
          {state.reasonCount}
        </Typo.Caption.Regular>
      </FormField>
      {state.showObservation ? (
        <div className='flex flex-col'>
          <FormControlLabel
            control={
              <Checkbox
                checked={state.observationClosed}
                onChange={(e) => state.onObservationChange(e.target.checked)}
                slotProps={{ input: { 'aria-describedby': helpId } }}
              />
            }
            label={
              <Typo.Badge.Medium>
                {MSG_D08.CANCEL_OBSERVATION}
              </Typo.Badge.Medium>
            }
          />
          <Typo.Caption.Regular
            id={helpId}
            color='text.secondary'
            sx={{ pl: 8 }}
          >
            {MSG_D08.CANCEL_OBSERVATION_HELP}
          </Typo.Caption.Regular>
        </div>
      ) : null}
      {impact ? (
        <Box
          role='status'
          sx={{
            display: 'flex',
            gap: 2,
            p: 4,
            bgcolor: 'semantic.alert.warningBg',
            color: 'semantic.alert.warningFg',
            border: 1,
            borderColor: 'semantic.alert.warningBorder',
            borderRadius: `${RADIUS.md}px`,
          }}
        >
          <Iconify
            icon='solar:danger-triangle-linear'
            sx={{ mt: 1, flexShrink: 0 }}
          />
          <div className='flex min-w-0 flex-col gap-1'>
            <Typo.Badge.Regular color='inherit'>
              {impact.message}
            </Typo.Badge.Regular>
            <ul className='m-0 flex flex-col gap-1 pl-4'>
              {impact.names.map((name, index) => (
                <li key={`${name}-${index}`}>
                  <Typo.Caption.Regular color='inherit'>
                    {name}
                  </Typo.Caption.Regular>
                </li>
              ))}
            </ul>
            {impact.restText ? (
              <Typo.Caption.Regular color='inherit'>
                {impact.restText}
              </Typo.Caption.Regular>
            ) : null}
          </div>
        </Box>
      ) : null}
    </AdminDialog>
  );
}
