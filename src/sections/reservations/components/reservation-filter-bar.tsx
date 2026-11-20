'use client';

// ----------------------------------------------------------------------
// 예매 탭 필터(designer §13.7.3 2.1) — 줄 1 회차 pill(전체 + 회차) / 줄 2 상태 pill · "기한 지남만"(aria-pressed) ·
// 검색(lg 오른쪽 280, 아래는 전체 폭). xs 는 pill 줄을 카드 안에서만 가로 스크롤(페이지 넘침 0).
// ----------------------------------------------------------------------
import ButtonBase from '@mui/material/ButtonBase';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import { Iconify } from '@/src/components/iconify';
import { SegmentPill, type SegmentOption } from '@/src/components/segment-pill';
import { Typo } from '@/src/components/typo';
import type { StatusFilter } from '@/src/sections/reservations/view/use-reservations-view-model';
import { MSG_D12 } from '@/src/shared/messages/d12';
import { RESERVATION_STATUS_LABEL } from '@/src/types/codes';

interface ReservationFilterBarProps {
  showOptions: SegmentOption<string>[];
  showFilter: string;
  status: StatusFilter;
  overdueOnly: boolean;
  searchInput: string;
  onShowFilterChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onToggleOverdue: () => void;
  onSearchChange: (value: string) => void;
}

const STATUS_OPTIONS: SegmentOption<StatusFilter>[] = [
  { value: 'ALL', label: MSG_D12.FILTER_ALL },
  { value: 'PENDING', label: RESERVATION_STATUS_LABEL.PENDING },
  { value: 'CONFIRMED', label: RESERVATION_STATUS_LABEL.CONFIRMED },
  { value: 'CANCELLED', label: RESERVATION_STATUS_LABEL.CANCELLED },
];

/** xs: 줄바꿈 대신 가로 스크롤(SegmentPill 의 flex-wrap 을 이 줄에서만 끈다) */
const SCROLL_ROW =
  'flex min-w-0 items-center gap-3 overflow-x-auto md:flex-wrap [&>div]:flex-nowrap md:[&>div]:flex-wrap [&_button]:shrink-0 [&_button]:whitespace-nowrap';

function GroupLabel({ children }: { children: string }) {
  return (
    <Typo.Caption.Regular color='text.secondary' sx={{ flexShrink: 0 }}>
      {children}
    </Typo.Caption.Regular>
  );
}

export function ReservationFilterBar({
  showOptions,
  showFilter,
  status,
  overdueOnly,
  searchInput,
  onShowFilterChange,
  onStatusChange,
  onToggleOverdue,
  onSearchChange,
}: ReservationFilterBarProps) {
  return (
    <div className='flex flex-col gap-3'>
      <div className={SCROLL_ROW}>
        <GroupLabel>{MSG_D12.FILTER_SHOW}</GroupLabel>
        <SegmentPill
          options={[
            { value: 'ALL', label: MSG_D12.FILTER_ALL },
            ...showOptions,
          ]}
          value={showFilter}
          onChange={onShowFilterChange}
          ariaLabel={MSG_D12.FILTER_SHOW}
        />
      </div>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div className={SCROLL_ROW}>
          <GroupLabel>{MSG_D12.FILTER_STATUS}</GroupLabel>
          <SegmentPill
            options={STATUS_OPTIONS}
            value={status}
            onChange={onStatusChange}
            ariaLabel={MSG_D12.FILTER_STATUS}
          />
          <ButtonBase
            aria-pressed={overdueOnly}
            onClick={onToggleOverdue}
            sx={{
              flexShrink: 0,
              gap: 1,
              minHeight: { xs: 44, md: 32 },
              px: { xs: 4, md: 3 },
              borderRadius: 9999,
              bgcolor: overdueOnly ? 'primary.main' : 'semantic.surface.muted',
              color: overdueOnly
                ? 'primary.contrastText'
                : 'semantic.text.onMuted',
              '&:focus-visible': {
                outline: 2,
                outlineColor: 'primary.main',
                outlineOffset: 2,
              },
            }}
          >
            <Iconify icon='solar:hourglass-linear' />
            <Typo.Badge.Medium color='inherit'>
              {MSG_D12.FILTER_OVERDUE}
            </Typo.Badge.Medium>
          </ButtonBase>
        </div>
        <TextField
          type='search'
          value={searchInput}
          placeholder={MSG_D12.SEARCH_PH}
          onChange={(event) => onSearchChange(event.target.value)}
          sx={{ width: { xs: '100%', lg: 280 }, flexShrink: 0 }}
          slotProps={{
            htmlInput: { 'aria-label': MSG_D12.SEARCH_ARIA },
            input: {
              startAdornment: (
                <InputAdornment position='start'>
                  <Iconify
                    icon='solar:magnifier-linear'
                    sx={{ color: 'text.secondary' }}
                  />
                </InputAdornment>
              ),
            },
          }}
        />
      </div>
    </div>
  );
}
