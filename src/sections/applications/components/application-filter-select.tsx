'use client';

// ----------------------------------------------------------------------
// 필터 select 한 칸 — 라벨(xs 위 · md↑ 왼쪽) + MUI select. 맨 앞 '전체' 항목은 호출 쪽이 options 에 넣는다.
// MUI Select 의 combobox 는 div 라 <label for> 로 이름이 안 붙는다 → labelId(aria-labelledby)로 연결(qa1).
// ----------------------------------------------------------------------
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { Typo } from '@/src/components/typo';

interface ApplicationFilterSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  isWide?: boolean;
}

export function ApplicationFilterSelect({
  label,
  value,
  options,
  onChange,
  isWide = false,
}: ApplicationFilterSelectProps) {
  const selectId = useId();
  const labelId = useId();
  return (
    <div className='flex min-w-0 flex-col gap-1 md:flex-row md:items-center md:gap-3'>
      <label htmlFor={selectId} id={labelId} className='shrink-0'>
        <Typo.Badge.Regular color='text.secondary'>{label}</Typo.Badge.Regular>
      </label>
      <TextField
        id={selectId}
        select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{ width: { xs: '100%', md: isWide ? 168 : 128 } }}
        slotProps={{
          select: {
            labelId,
            SelectDisplayProps: { 'aria-labelledby': labelId },
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </div>
  );
}
