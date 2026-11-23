'use client';

// ----------------------------------------------------------------------
// 회차 추가·수정 다이얼로그 View(제목 "회차 추가"/"회차 수정", 버튼 "추가"/"저장") — props 만으로 렌더.
// 순서(designer 시안 dialog-show, 보강2 가격 칸 삭제): 날짜* | 시작 시각* / 종료 시각 | 반 / 장소 | 좌석 수 /
// 예매 오픈 날짜 | 예매 오픈 시각 / 상태(+도움말) / 예매 중지 스위치(+설명). 서버 오류는 AdminDialog 오류 상자.
// 오픈 시각은 KST 벽시계로 입력한다(매퍼가 +09:00 으로 보낸다). 폭 wide 640, md↑ 2열 · xs 1열 전체 화면(designer §13.7.3 1.1).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import { Typo } from '@/src/components/typo';
import { UnitAdornment } from '@/src/sections/performance-shows/components/unit-adornment';
import { SHOW_VENUE_MAX } from '@/src/sections/performance-shows/utils/show-form';
import type { ShowDialogState } from '@/src/sections/performance-shows/view/use-show-dialog';
import { MSG_BOOKING } from '@/src/shared/messages/booking';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D08 } from '@/src/shared/messages/d08';
import { MSG_D11 } from '@/src/shared/messages/d11';
import type { ShowStatus } from '@/src/types/booking';

interface ClassOption {
  value: string;
  label: string;
}

interface ShowDialogProps {
  dialog: ShowDialogState;
  classOptions: ClassOption[];
  /** (U48) 이 공연의 팀(없으면 칸 없음) — value = 팀 계정 id */
  teamOptions: ClassOption[];
}

const STATUS_OPTIONS: ShowStatus[] = ['UPCOMING', 'BOOKING_OPEN', 'COMPLETED'];

export function ShowDialog({
  dialog,
  classOptions,
  teamOptions,
}: ShowDialogProps) {
  const teamId = useId();
  const dateId = useId();
  const startId = useId();
  const endId = useId();
  const classId = useId();
  const venueId = useId();
  const seatsId = useId();
  const openDateId = useId();
  const openTimeId = useId();
  const statusId = useId();
  const stopId = useId();
  const stopHelpId = useId();
  const { form, errors } = dialog;

  return (
    <AdminDialog
      open={dialog.isOpen}
      title={dialog.isEdit ? MSG_D11.DIALOG_EDIT : MSG_D11.DIALOG_ADD}
      onClose={dialog.onClose}
      onSubmit={dialog.onSubmit}
      errorMessage={dialog.submitError}
      isBusy={dialog.isSubmitting}
      wide
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
            {dialog.isEdit ? MSG_COMMON.SAVE : MSG_COMMON.ADD}
          </Button>
        </>
      }
    >
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <FormField
          label={MSG_D11.DATE}
          htmlFor={dateId}
          required
          error={errors.showDate}
        >
          <TextField
            id={dateId}
            type='date'
            value={form.showDate}
            error={Boolean(errors.showDate)}
            onChange={(e) => dialog.onFieldChange('showDate', e.target.value)}
          />
        </FormField>
        <FormField
          label={MSG_D11.START}
          htmlFor={startId}
          required
          error={errors.startTime}
        >
          <TextField
            id={startId}
            type='time'
            value={form.startTime}
            error={Boolean(errors.startTime)}
            onChange={(e) => dialog.onFieldChange('startTime', e.target.value)}
          />
        </FormField>
        <FormField label={MSG_D11.END} htmlFor={endId}>
          <TextField
            id={endId}
            type='time'
            value={form.endTime}
            onChange={(e) => dialog.onFieldChange('endTime', e.target.value)}
          />
        </FormField>
        <FormField
          label={MSG_D11.CLASS}
          htmlFor={classId}
          labelId={`${classId}-label`}
        >
          <TextField
            id={classId}
            select
            value={form.classId}
            onChange={(e) => dialog.onFieldChange('classId', e.target.value)}
            slotProps={{
              select: {
                displayEmpty: true,
                SelectDisplayProps: {
                  'aria-labelledby': `${classId}-label`,
                } as object,
              },
            }}
          >
            <MenuItem value=''>{MSG_D08.LINK_NONE}</MenuItem>
            {classOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </FormField>
        {teamOptions.length > 0 ? (
          <FormField
            label={MSG_D11.TEAM}
            htmlFor={teamId}
            labelId={`${teamId}-label`}
            helper={
              dialog.isEdit ? MSG_D11.TEAM_HELP : MSG_D11.TEAM_CREATE_HELP
            }
          >
            <TextField
              id={teamId}
              select
              disabled={!dialog.isEdit}
              value={form.teamAccountId}
              onChange={(e) =>
                dialog.onFieldChange('teamAccountId', e.target.value)
              }
              slotProps={{
                select: {
                  displayEmpty: true,
                  SelectDisplayProps: {
                    'aria-labelledby': `${teamId}-label`,
                  } as object,
                },
              }}
            >
              <MenuItem value=''>{MSG_D11.TEAM_NONE}</MenuItem>
              {teamOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </FormField>
        ) : null}
        <FormField label={MSG_D11.VENUE} htmlFor={venueId}>
          <TextField
            id={venueId}
            value={form.venue}
            onChange={(e) => dialog.onFieldChange('venue', e.target.value)}
            slotProps={{ htmlInput: { maxLength: SHOW_VENUE_MAX } }}
          />
        </FormField>
        <FormField
          label={MSG_D11.SEATS}
          htmlFor={seatsId}
          error={errors.totalSeats}
        >
          <TextField
            id={seatsId}
            value={form.totalSeats}
            error={Boolean(errors.totalSeats)}
            onChange={(e) => dialog.onFieldChange('totalSeats', e.target.value)}
            slotProps={{
              htmlInput: { inputMode: 'numeric', maxLength: 5 },
              input: {
                endAdornment: <UnitAdornment unit={MSG_BOOKING.SEAT_UNIT} />,
              },
            }}
          />
        </FormField>
        <FormField
          label={MSG_D11.OPEN_DATE}
          htmlFor={openDateId}
          error={errors.bookingOpenDate}
        >
          <TextField
            id={openDateId}
            type='date'
            value={form.bookingOpenDate}
            error={Boolean(errors.bookingOpenDate)}
            onChange={(e) =>
              dialog.onFieldChange('bookingOpenDate', e.target.value)
            }
          />
        </FormField>
        <FormField
          label={MSG_D11.OPEN_TIME}
          htmlFor={openTimeId}
          error={errors.bookingOpenTime}
        >
          <TextField
            id={openTimeId}
            type='time'
            value={form.bookingOpenTime}
            error={Boolean(errors.bookingOpenTime)}
            onChange={(e) =>
              dialog.onFieldChange('bookingOpenTime', e.target.value)
            }
          />
        </FormField>
      </div>
      <FormField
        label={MSG_D11.STATUS}
        htmlFor={statusId}
        labelId={`${statusId}-label`}
        helper={MSG_D11.STATUS_HELP}
      >
        <TextField
          id={statusId}
          select
          value={form.status}
          onChange={(e) => dialog.onStatusChange(e.target.value as ShowStatus)}
          slotProps={{
            select: {
              SelectDisplayProps: {
                'aria-labelledby': `${statusId}-label`,
              } as object,
            },
          }}
        >
          {STATUS_OPTIONS.map((status) => (
            <MenuItem key={status} value={status}>
              {MSG_D11.SHOW_STATUS_LABEL[status]}
            </MenuItem>
          ))}
        </TextField>
      </FormField>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
          pt: 3,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <div className='flex flex-col gap-1'>
          <label htmlFor={stopId}>
            <Typo.Badge.Medium component='span'>
              {MSG_D11.STOP_BOOKING}
            </Typo.Badge.Medium>
          </label>
          <Typo.Caption.Regular id={stopHelpId} color='text.secondary'>
            {MSG_D11.STOP_BOOKING_HELP}
          </Typo.Caption.Regular>
        </div>
        <Switch
          checked={!form.bookingEnabled}
          onChange={(_, checked) => dialog.onStopChange(checked)}
          slotProps={{
            input: { id: stopId, 'aria-describedby': stopHelpId },
          }}
        />
      </Box>
    </AdminDialog>
  );
}
