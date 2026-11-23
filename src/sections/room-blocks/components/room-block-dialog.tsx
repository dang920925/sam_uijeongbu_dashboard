'use client';

// ----------------------------------------------------------------------
// (U46) 시간 막기 추가·수정 다이얼로그 — 제목 · 반복(하루만/매주) · 요일 칩 · 시작·끝(30분) · 날짜(하루) 또는 시작일·종료일 · 메모.
// props 만으로 렌더(값·검증·저장은 ViewModel).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useId } from 'react';

import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import { Typo } from '@/src/components/typo';
import {
  END_TIMES,
  START_TIMES,
} from '@/src/sections/room-blocks/utils/room-block-form';
import type { RoomBlocksViewModel } from '@/src/sections/room-blocks/view/use-room-blocks-view-model';
import { MSG_BLOCKS } from '@/src/shared/messages/room-blocks';
import { LAYOUT } from '@/src/theme/layout-tokens';
import type { RoomBlockRepeat } from '@/src/types/practice';

interface RoomBlockDialogProps {
  dialog: RoomBlocksViewModel['dialog'];
}

export function RoomBlockDialog({ dialog }: RoomBlockDialogProps) {
  const ids = {
    title: useId(),
    memo: useId(),
    start: useId(),
    end: useId(),
    startDate: useId(),
    endDate: useId(),
  };
  const { form, errors } = dialog;
  const weekly = form.repeat === 'WEEKLY';
  return (
    <AdminDialog
      open={dialog.isOpen}
      title={dialog.isEdit ? MSG_BLOCKS.DIALOG_EDIT : MSG_BLOCKS.DIALOG_CREATE}
      onClose={dialog.onClose}
      onSubmit={dialog.onSave}
      isBusy={dialog.isBusy}
      errorMessage={dialog.serverError}
      actions={
        <>
          <Button variant='outlined' color='inherit' onClick={dialog.onClose}>
            {MSG_BLOCKS.CANCEL}
          </Button>
          <Button type='submit' variant='contained' disabled={dialog.isBusy}>
            {dialog.isBusy ? MSG_BLOCKS.SAVING : MSG_BLOCKS.SAVE}
          </Button>
        </>
      }
    >
      <FormField
        label={MSG_BLOCKS.LABEL_TITLE}
        htmlFor={ids.title}
        required
        helper={MSG_BLOCKS.TITLE_HELP}
        error={errors.title}
      >
        <TextField
          id={ids.title}
          value={form.title}
          placeholder={MSG_BLOCKS.TITLE_PH}
          error={Boolean(errors.title)}
          onChange={(e) => dialog.onChange({ title: e.target.value })}
          slotProps={{ htmlInput: { maxLength: 30 } }}
          autoFocus
        />
      </FormField>
      <FormField label={MSG_BLOCKS.LABEL_REPEAT} asGroup>
        <ToggleButtonGroup
          exclusive
          value={form.repeat}
          onChange={(_, value: RoomBlockRepeat | null) => {
            if (value) dialog.onChange({ repeat: value });
          }}
          size='small'
        >
          <ToggleButton value='NONE'>{MSG_BLOCKS.REPEAT_NONE}</ToggleButton>
          <ToggleButton value='WEEKLY'>{MSG_BLOCKS.REPEAT_WEEKLY}</ToggleButton>
        </ToggleButtonGroup>
      </FormField>
      {weekly ? (
        <FormField
          label={MSG_BLOCKS.LABEL_WEEKDAYS}
          asGroup
          error={errors.weekdays}
        >
          <div className='flex flex-wrap gap-2'>
            {MSG_BLOCKS.WEEKDAY_LABELS.map((label, index) => {
              const day = index + 1;
              const selected = form.weekdays.includes(day);
              return (
                <ButtonBase
                  key={label}
                  aria-pressed={selected}
                  onClick={() => dialog.onToggleWeekday(day)}
                  sx={{
                    width: { xs: LAYOUT.touch, md: LAYOUT.control },
                    height: { xs: LAYOUT.touch, md: LAYOUT.control },
                    borderRadius: '50%',
                    border: 1,
                    borderColor: selected ? 'primary.main' : 'divider',
                    bgcolor: selected ? 'primary.main' : 'background.paper',
                    color: selected ? 'primary.contrastText' : 'text.primary',
                  }}
                >
                  <Typo.Badge.Medium color='inherit'>{label}</Typo.Badge.Medium>
                </ButtonBase>
              );
            })}
          </div>
        </FormField>
      ) : null}
      <div className='grid grid-cols-2 gap-3'>
        <FormField label={MSG_BLOCKS.LABEL_START} htmlFor={ids.start}>
          <TextField
            id={ids.start}
            select
            value={form.startTime}
            onChange={(e) => dialog.onChange({ startTime: e.target.value })}
          >
            {START_TIMES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </FormField>
        <FormField
          label={MSG_BLOCKS.LABEL_END}
          htmlFor={ids.end}
          error={errors.time}
        >
          <TextField
            id={ids.end}
            select
            value={form.endTime}
            error={Boolean(errors.time)}
            onChange={(e) => dialog.onChange({ endTime: e.target.value })}
          >
            {END_TIMES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </FormField>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <FormField
          label={weekly ? MSG_BLOCKS.LABEL_START_DATE : MSG_BLOCKS.LABEL_DATE}
          htmlFor={ids.startDate}
        >
          <TextField
            id={ids.startDate}
            type='date'
            value={form.startDate}
            onChange={(e) => dialog.onChange({ startDate: e.target.value })}
          />
        </FormField>
        {weekly ? (
          <FormField
            label={MSG_BLOCKS.LABEL_END_DATE}
            htmlFor={ids.endDate}
            required
            error={errors.dates}
          >
            <TextField
              id={ids.endDate}
              type='date'
              value={form.endDate}
              error={Boolean(errors.dates)}
              onChange={(e) => dialog.onChange({ endDate: e.target.value })}
            />
          </FormField>
        ) : null}
      </div>
      {weekly ? (
        <Typo.Caption.Regular color='text.secondary'>
          {MSG_BLOCKS.END_DATE_HELP}
        </Typo.Caption.Regular>
      ) : null}
      <FormField
        label={MSG_BLOCKS.LABEL_MEMO}
        htmlFor={ids.memo}
        helper={MSG_BLOCKS.MEMO_HELP}
      >
        <TextField
          id={ids.memo}
          value={form.memo}
          multiline
          minRows={2}
          onChange={(e) => dialog.onChange({ memo: e.target.value })}
          slotProps={{ htmlInput: { maxLength: 200 } }}
        />
      </FormField>
    </AdminDialog>
  );
}
