'use client';

// ----------------------------------------------------------------------
// 공연 선택(designer "공연" select, 폭 320) — MUI select 는 labelId + aria-labelledby 로 이름을 붙인다(qa1).
// ----------------------------------------------------------------------
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { FormField } from '@/src/components/form-field';
import { MSG_D12 } from '@/src/shared/messages/d12';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface PerformanceSelectProps {
  options: { id: string; title: string }[];
  value: string | null;
  onChange: (id: string) => void;
}

export function PerformanceSelect({
  options,
  value,
  onChange,
}: PerformanceSelectProps) {
  const selectId = useId();
  const labelId = useId();
  return (
    <FormField label={MSG_D12.PERF_LABEL} htmlFor={selectId} labelId={labelId}>
      <TextField
        id={selectId}
        select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        sx={{ width: { xs: '100%', md: LAYOUT.panel } }}
        slotProps={{
          select: {
            labelId,
            SelectDisplayProps: { 'aria-labelledby': labelId },
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.title}
          </MenuItem>
        ))}
      </TextField>
    </FormField>
  );
}
