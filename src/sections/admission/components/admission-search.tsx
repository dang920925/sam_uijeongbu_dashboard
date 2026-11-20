'use client';

// ----------------------------------------------------------------------
// 큰 검색(design SCR-D13 ③ · designer `.adm-search`): 2px 테두리(slate-500 — 3:1 이상) 입력 48 + 지우기(값 있을 때만) +
// "123" 숫자 키패드 전환(48, aria-pressed — lg 숨김). 전환하면 입력에 포커스를 돌려 키보드가 다시 열리게 한다.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { useRef } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { ADMISSION_SX } from '@/src/sections/admission/components/admission-field-sx';
import { MSG_D13 } from '@/src/shared/messages/d13';

interface AdmissionSearchProps {
  value: string;
  isNumeric: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  onToggleKeypad: () => void;
}

export function AdmissionSearch({
  value,
  isNumeric,
  onChange,
  onClear,
  onToggleKeypad,
}: AdmissionSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className='flex gap-2'>
      <OutlinedInput
        inputRef={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={MSG_D13.SEARCH_PH}
        type='search'
        fullWidth
        inputProps={{
          'aria-label': MSG_D13.SEARCH_ARIA,
          inputMode: isNumeric ? 'numeric' : 'text',
          enterKeyHint: 'search',
          autoComplete: 'off',
        }}
        startAdornment={
          <InputAdornment position='start'>
            <Iconify
              icon='solar:magnifier-linear'
              size='lg'
              sx={{ color: 'text.secondary' }}
            />
          </InputAdornment>
        }
        endAdornment={
          value ? (
            <InputAdornment position='end'>
              <IconButton
                aria-label={MSG_D13.SEARCH_CLEAR}
                onClick={() => {
                  onClear();
                  inputRef.current?.focus();
                }}
                edge='end'
                sx={{ width: 48, height: 48 }}
              >
                <Iconify
                  icon='solar:close-circle-linear'
                  size='md'
                  sx={{ color: 'text.secondary' }}
                />
              </IconButton>
            </InputAdornment>
          ) : null
        }
        sx={{
          minHeight: ADMISSION_SX.touch,
          '& input': { minHeight: 32 },
          '& input::-webkit-search-cancel-button': { display: 'none' },
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
            borderColor: ADMISSION_SX.strongBorder,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
          },
        }}
      />
      <Button
        variant={isNumeric ? 'contained' : 'outlined'}
        color={isNumeric ? 'primary' : 'inherit'}
        aria-label={MSG_D13.KEYPAD_ARIA}
        aria-pressed={isNumeric}
        onClick={() => {
          onToggleKeypad();
          inputRef.current?.focus();
        }}
        sx={{
          ...(isNumeric
            ? ADMISSION_SX.containedButton
            : ADMISSION_SX.outlinedButton),
          minWidth: 52,
          borderWidth: isNumeric ? 0 : 2,
          '&:hover': { borderWidth: isNumeric ? 0 : 2 },
          display: { lg: 'none' },
        }}
      >
        <Typo.Body.Semibold color='inherit'>
          {MSG_D13.KEYPAD}
        </Typo.Body.Semibold>
      </Button>
    </div>
  );
}
