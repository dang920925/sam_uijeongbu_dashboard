'use client';

// ----------------------------------------------------------------------
// "연결 반/공연" 묶음 상자(D5, designer `.link-box`) — 연결 공연 select → 고르면 그 공연의 반이 연결 반 select 에.
// 공연을 고르기 전에는 연결 반 비활성. 둘 다 "선택 안 함"(빈 값) 옵션. 도움말은 확정 문구(MSG-D08-LINK-HELP — 사용자 확정 2026-11-19 "제안 문구 그대로").
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { FormField } from '@/src/components/form-field';
import { Typo } from '@/src/components/typo';
import { MSG_D08 } from '@/src/shared/messages/d08';

interface LinkOption {
  value: string;
  label: string;
}

interface ScheduleLinkFieldsProps {
  performanceId: string;
  classId: string;
  performanceOptions: LinkOption[];
  classOptions: LinkOption[];
  onPerformanceChange: (value: string) => void;
  onClassChange: (value: string) => void;
}

export function ScheduleLinkFields({
  performanceId,
  classId,
  performanceOptions,
  classOptions,
  onPerformanceChange,
  onClassChange,
}: ScheduleLinkFieldsProps) {
  const performanceFieldId = useId();
  const classFieldId = useId();
  const groupId = useId();
  return (
    <Box
      role='group'
      aria-labelledby={groupId}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        p: 4,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.default',
      }}
    >
      <Typo.Badge.Semibold id={groupId}>
        {MSG_D08.LINK_GROUP}
      </Typo.Badge.Semibold>
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
        <FormField
          label={MSG_D08.LINK_PERFORMANCE}
          htmlFor={performanceFieldId}
        >
          <TextField
            id={performanceFieldId}
            select
            value={performanceId}
            onChange={(e) => onPerformanceChange(e.target.value)}
            slotProps={{
              select: {
                displayEmpty: true,
                SelectDisplayProps: { 'aria-label': MSG_D08.LINK_PERFORMANCE },
              },
            }}
          >
            <MenuItem value=''>{MSG_D08.LINK_NONE}</MenuItem>
            {performanceOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </FormField>
        <FormField label={MSG_D08.LINK_CLASS} htmlFor={classFieldId}>
          <TextField
            id={classFieldId}
            select
            value={classId}
            disabled={performanceId === ''}
            onChange={(e) => onClassChange(e.target.value)}
            slotProps={{
              select: {
                displayEmpty: true,
                SelectDisplayProps: { 'aria-label': MSG_D08.LINK_CLASS },
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
      </div>
      <Typo.Caption.Regular color='text.secondary'>
        {MSG_D08.LINK_HELP}
      </Typo.Caption.Regular>
    </Box>
  );
}
