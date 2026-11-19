'use client';

// ----------------------------------------------------------------------
// 출연작 목록 — 머리("출연작" + "추가") / 행 카드(번호·삭제 · 작품명* 전폭 · 배역·연도* 2열, designer `.film-item`).
// 오류는 칸 테두리만(기획에 문구 없음 — actor-profile-form 머리 주석).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';

import { FormField } from '@/src/components/form-field';
import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import type {
  FilmographyFormRow,
  FilmographyRowErrors,
} from '@/src/sections/members/utils/actor-profile-form';
import { MSG_D05 } from '@/src/shared/messages/d05';

interface MembersFilmographyFieldsProps {
  rows: FilmographyFormRow[];
  errors: FilmographyRowErrors[];
  onAdd: () => void;
  onRemove: (key: string) => void;
  onChange: (
    key: string,
    field: 'title' | 'role' | 'year',
    value: string
  ) => void;
}

export function MembersFilmographyFields({
  rows,
  errors,
  onAdd,
  onRemove,
  onChange,
}: MembersFilmographyFieldsProps) {
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between gap-2'>
        <Typo.Badge.Medium component='h3'>
          {MSG_D05.FILMOGRAPHY}
        </Typo.Badge.Medium>
        <Button
          size='small'
          color='inherit'
          onClick={onAdd}
          startIcon={<Iconify icon='solar:add-circle-linear' />}
        >
          {MSG_D05.FILMOGRAPHY_ADD}
        </Button>
      </div>
      {rows.map((row, index) => {
        const rowError = errors[index];
        const titleId = `${row.key}-title`;
        const roleId = `${row.key}-role`;
        const yearId = `${row.key}-year`;
        return (
          <Box
            key={row.key}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              p: 3,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <div className='flex items-center justify-between'>
              <Typo.Caption.Regular color='text.secondary'>
                {index + 1}
              </Typo.Caption.Regular>
              <IconButton
                aria-label={`${MSG_D05.FILM_REMOVE_ARIA} ${index + 1}`}
                onClick={() => onRemove(row.key)}
                sx={{ color: 'error.main' }}
              >
                <Iconify icon='solar:trash-bin-trash-linear' />
              </IconButton>
            </div>
            <FormField label={MSG_D05.FILM_TITLE} htmlFor={titleId} required>
              <TextField
                id={titleId}
                value={row.title}
                error={Boolean(rowError?.title)}
                onChange={(e) => onChange(row.key, 'title', e.target.value)}
                slotProps={{ htmlInput: { maxLength: 100 } }}
              />
            </FormField>
            <div className='grid grid-cols-2 gap-2'>
              <FormField label={MSG_D05.FILM_ROLE} htmlFor={roleId}>
                <TextField
                  id={roleId}
                  value={row.role}
                  onChange={(e) => onChange(row.key, 'role', e.target.value)}
                  slotProps={{ htmlInput: { maxLength: 50 } }}
                />
              </FormField>
              <FormField label={MSG_D05.FILM_YEAR} htmlFor={yearId} required>
                <TextField
                  id={yearId}
                  type='number'
                  value={row.year}
                  error={Boolean(rowError?.year)}
                  onChange={(e) => onChange(row.key, 'year', e.target.value)}
                  slotProps={{
                    htmlInput: { min: 1900, max: 2100, inputMode: 'numeric' },
                  }}
                />
              </FormField>
            </div>
          </Box>
        );
      })}
    </div>
  );
}
