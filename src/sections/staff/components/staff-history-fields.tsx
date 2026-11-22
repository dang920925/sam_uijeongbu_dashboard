'use client';

// ----------------------------------------------------------------------
// 연출진 연혁 입력(U28 — design §7 SCR-D09) — 머리("연혁" + "연혁 추가") / 줄마다 연도(4자리) · 내용(200) ·
// ▲▼(터치용 순서 버튼 — 끌기만으로 두지 않음) · 삭제. 50줄이면 추가 버튼을 끄고 도움말. 잘못된 줄은 칸 테두리.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import {
  STAFF_HISTORY_CONTENT_MAX,
  STAFF_HISTORY_MAX,
  type StaffHistoryRow,
} from '@/src/sections/staff/utils/staff-history-form';
import { MSG_D09 } from '@/src/shared/messages/d09';

interface StaffHistoryFieldsProps {
  rows: StaffHistoryRow[];
  invalid: boolean[];
  onAdd: () => void;
  onRemove: (key: string) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  onChange: (key: string, field: 'year' | 'content', value: string) => void;
}

export function StaffHistoryFields({
  rows,
  invalid,
  onAdd,
  onRemove,
  onMove,
  onChange,
}: StaffHistoryFieldsProps) {
  const isFull = rows.length >= STAFF_HISTORY_MAX;
  const hasInvalid = invalid.some(Boolean);
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between gap-2'>
        <Typo.Badge.Medium component='h3'>{MSG_D09.HISTORY}</Typo.Badge.Medium>
        <Button
          size='small'
          color='inherit'
          onClick={onAdd}
          disabled={isFull}
          startIcon={<Iconify icon='solar:add-circle-linear' />}
        >
          {MSG_D09.HISTORY_ADD}
        </Button>
      </div>
      {isFull ? (
        <Typo.Caption.Regular color='text.secondary'>
          {MSG_D09.HISTORY_MAX_HELP}
        </Typo.Caption.Regular>
      ) : null}
      {hasInvalid ? (
        <Typo.Caption.Regular color='error.main' role='alert'>
          {MSG_D09.HISTORY_INVALID}
        </Typo.Caption.Regular>
      ) : null}
      <ol className='m-0 flex list-none flex-col gap-2 p-0'>
        {rows.map((row, index) => (
          <li key={row.key} className='flex items-center gap-2'>
            <TextField
              value={row.year}
              error={invalid[index] === true}
              placeholder={MSG_D09.HISTORY_YEAR}
              onChange={(e) => onChange(row.key, 'year', e.target.value)}
              slotProps={{
                htmlInput: {
                  maxLength: 4,
                  inputMode: 'numeric',
                  'aria-label': `${MSG_D09.HISTORY_YEAR} ${index + 1}`,
                },
              }}
              sx={{ width: 96, flexShrink: 0 }}
            />
            <TextField
              value={row.content}
              error={invalid[index] === true}
              placeholder={MSG_D09.HISTORY_CONTENT}
              onChange={(e) => onChange(row.key, 'content', e.target.value)}
              slotProps={{
                htmlInput: {
                  maxLength: STAFF_HISTORY_CONTENT_MAX,
                  'aria-label': `${MSG_D09.HISTORY_CONTENT} ${index + 1}`,
                },
              }}
              sx={{ flex: 1, minWidth: 0 }}
            />
            <IconButton
              aria-label={`${MSG_D09.HISTORY_UP_ARIA} ${index + 1}`}
              onClick={() => onMove(row.key, -1)}
              disabled={index === 0}
            >
              <Iconify icon='solar:alt-arrow-up-linear' />
            </IconButton>
            <IconButton
              aria-label={`${MSG_D09.HISTORY_DOWN_ARIA} ${index + 1}`}
              onClick={() => onMove(row.key, 1)}
              disabled={index === rows.length - 1}
            >
              <Iconify icon='solar:alt-arrow-down-linear' />
            </IconButton>
            <IconButton
              aria-label={`${MSG_D09.HISTORY_REMOVE_ARIA} ${index + 1}`}
              onClick={() => onRemove(row.key)}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon='solar:trash-bin-trash-linear' />
            </IconButton>
          </li>
        ))}
      </ol>
    </div>
  );
}
