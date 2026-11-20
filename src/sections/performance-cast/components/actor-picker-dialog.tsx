'use client';

// ----------------------------------------------------------------------
// SCR-D14 배우 고르기 다이얼로그 — 이름 검색 + 배우 목록(배역·출연자 추가 = 한 명 라디오 + 메모, 회차 칸 = 여러 명 체크).
// 회차 칸은 기본 캐스트 후보를 먼저 보이고(design SCR-D14), 프로필 없는 배우는 고를 수 없다. props 만으로 렌더.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { AdminDialog } from '@/src/components/admin-dialog';
import { EmptyContent } from '@/src/components/empty-content';
import { FormField } from '@/src/components/form-field';
import { Label } from '@/src/components/label';
import type { ActorPickerState } from '@/src/sections/performance-cast/view/use-actor-picker';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D14 } from '@/src/shared/messages/d14';

interface ActorPickerDialogProps {
  picker: ActorPickerState;
}

export function ActorPickerDialog({ picker }: ActorPickerDialogProps) {
  const searchId = useId();
  const noteId = useId();
  return (
    <AdminDialog
      open={picker.isOpen}
      title={picker.title}
      onClose={picker.onClose}
      onSubmit={picker.onSubmit}
      errorMessage={picker.errorMessage}
      isBusy={picker.isSubmitting}
      actions={
        <>
          <Button
            variant='outlined'
            color='inherit'
            onClick={picker.onClose}
            disabled={picker.isSubmitting}
          >
            {MSG_COMMON.CANCEL}
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={picker.isSubmitting}
          >
            {MSG_COMMON.SAVE}
          </Button>
        </>
      }
    >
      <FormField label={MSG_D14.PICKER_SEARCH} htmlFor={searchId}>
        <TextField
          id={searchId}
          value={picker.query}
          onChange={(e) => picker.onQuery(e.target.value)}
          autoFocus
        />
      </FormField>
      {picker.candidates.length === 0 && !picker.isLoading ? (
        <EmptyContent message={MSG_D14.PICKER_EMPTY} />
      ) : (
        <ul className='m-0 flex max-h-80 list-none flex-col overflow-y-auto p-0'>
          {picker.candidates.map((c) => (
            <li key={c.memberId} className='flex items-center gap-2'>
              <FormControlLabel
                control={
                  picker.isMulti ? (
                    <Checkbox
                      checked={picker.selected.includes(c.memberId)}
                      disabled={c.isDisabled}
                      onChange={() => picker.onToggle(c.memberId)}
                    />
                  ) : (
                    <Radio
                      checked={picker.selected.includes(c.memberId)}
                      onChange={() => picker.onToggle(c.memberId)}
                    />
                  )
                }
                label={c.name}
                sx={{ m: 0, minHeight: 44 }}
              />
              {c.isDefault ? (
                <Label tone='info'>{MSG_D14.PICKER_DEFAULT_FIRST}</Label>
              ) : null}
              {c.isDisabled ? (
                <Label tone='neutral'>{MSG_D14.PICKER_NO_PROFILE}</Label>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {picker.showNote ? (
        <FormField label={MSG_D14.PICKER_NOTE} htmlFor={noteId}>
          <TextField
            id={noteId}
            value={picker.note}
            placeholder={MSG_D14.PICKER_NOTE_PH}
            onChange={(e) => picker.onNote(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 30 } }}
          />
        </FormField>
      ) : null}
    </AdminDialog>
  );
}
