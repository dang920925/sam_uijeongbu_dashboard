'use client';

// ----------------------------------------------------------------------
// "상태 필터:" select(전체/대기/승인/거절) + "총 {n}건"(현행 Applications.tsx:157-170). 건수를 모르면(로딩) 숨김.
// MUI Select 의 combobox 는 div 라 <label for> 로 이름이 안 붙는다 → labelId(aria-labelledby)로 연결.
// ----------------------------------------------------------------------
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { Typo } from '@/src/components/typo';
import { MSG_D06 } from '@/src/shared/messages/d06';
import {
  APPLICATION_STATUS_LABEL,
  type ApplicationStatus,
} from '@/src/types/codes';

type StatusFilter = ApplicationStatus | 'ALL';

interface ApplicationFilterBarProps {
  status: StatusFilter;
  totalCount: number | null;
  onStatusChange: (status: StatusFilter) => void;
}

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: MSG_D06.FILTER_ALL },
  { value: 'PENDING', label: APPLICATION_STATUS_LABEL.PENDING },
  { value: 'APPROVED', label: APPLICATION_STATUS_LABEL.APPROVED },
  { value: 'REJECTED', label: APPLICATION_STATUS_LABEL.REJECTED },
];

export function ApplicationFilterBar({
  status,
  totalCount,
  onStatusChange,
}: ApplicationFilterBarProps) {
  const selectId = useId();
  const labelId = useId();
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <label htmlFor={selectId} id={labelId}>
        <Typo.Badge.Regular color='text.secondary'>
          {MSG_D06.FILTER_LABEL}
        </Typo.Badge.Regular>
      </label>
      <TextField
        id={selectId}
        select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        sx={{ width: 144 }}
        slotProps={{ select: { labelId } }}
      >
        {OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      {totalCount !== null ? (
        <Typo.Badge.Regular color='text.secondary'>
          {MSG_D06.TOTAL(totalCount)}
        </Typo.Badge.Regular>
      ) : null}
    </div>
  );
}
