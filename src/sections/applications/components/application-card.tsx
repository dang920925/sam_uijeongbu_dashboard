'use client';

// ----------------------------------------------------------------------
// xs 카드(designer §18.3 default xs): 이름 + 유형 Label · 접수일 › → 작품 칩(최대 3 + "+n") →
// 희망 일정(참관 "희망 날짜 {날짜}" + 일정 취소됨·사유 / 상담 "방법 · 시간") → 연락 · 진행 · 처리 상태(읽기 전용).
// 카드 전체가 버튼(드로어 열기) — 안에 다른 버튼을 두지 않는다. 터치 높이는 카드 자체로 44 이상.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import type { KeyboardEvent } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { ApplicationContactToggle } from '@/src/sections/applications/components/application-contact-toggle';
import { ApplicationProgressMenu } from '@/src/sections/applications/components/application-progress-menu';
import { ApplicationScheduleCell } from '@/src/sections/applications/components/application-schedule-cell';
import { ApplicationStatusLabels } from '@/src/sections/applications/components/application-status-labels';
import { ApplicationTypeLabel } from '@/src/sections/applications/components/application-type-label';
import { ApplicationWorkChips } from '@/src/sections/applications/components/application-work-chips';
import type { ApplicationRow } from '@/src/sections/applications/utils/application-row';
import { MSG_D06 } from '@/src/shared/messages/d06';

interface ApplicationCardProps {
  row: ApplicationRow;
  isSelected: boolean;
  onOpen: () => void;
}

export function ApplicationCard({
  row,
  isSelected,
  onOpen,
}: ApplicationCardProps) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen();
    }
  };
  return (
    <Box
      component='li'
      role='button'
      tabIndex={0}
      aria-haspopup='dialog'
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 4,
        borderBottom: 1,
        borderColor: 'divider',
        cursor: 'pointer',
        bgcolor: isSelected ? 'semantic.surface.muted' : 'transparent',
        '&:last-of-type': { borderBottom: 0 },
        '&:focus-visible': {
          outline: 2,
          outlineColor: 'primary.main',
          outlineOffset: -2,
        },
      }}
    >
      <div className='flex items-center justify-between gap-2'>
        <span className='flex min-w-0 items-center gap-2'>
          <Typo.Body.Semibold noWrap>{row.applicantName}</Typo.Body.Semibold>
          <ApplicationTypeLabel row={row} hasIcon />
        </span>
        <span className='flex shrink-0 items-center gap-1'>
          <Typo.Caption.Regular color='text.secondary'>
            {row.createdAt}
          </Typo.Caption.Regular>
          <Iconify
            icon='solar:alt-arrow-right-linear'
            sx={{ color: 'text.secondary' }}
          />
        </span>
      </div>
      <ApplicationWorkChips
        split={row.workChips.xs}
        isEmpty={row.isWorkEmpty}
        isWrap
      />
      <ApplicationScheduleCell
        row={row}
        prefix={
          row.appType === 'WORK_OBSERVATION'
            ? MSG_D06.COL_PREFERRED_DATE
            : undefined
        }
      />
      <div className='flex flex-wrap items-center gap-2'>
        <ApplicationContactToggle contact={row.contact} />
        <ApplicationProgressMenu progress={row.progress} />
        <ApplicationStatusLabels row={row} />
      </div>
    </Box>
  );
}
