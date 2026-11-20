'use client';

// ----------------------------------------------------------------------
// 보기 전환 "월 · 주 · 목록"(xs "월 · 목록") — 붙은 버튼 묶음(aria-pressed), 필터 pill 과 모양을 달리해
// "보기"와 "거르기"를 구분한다(design u23-calendar.css .view-switch). 높이 32, xs 44.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';

import type { SegmentOption } from '@/src/components/segment-pill';
import { Typo } from '@/src/components/typo';
import type { CalendarView } from '@/src/sections/schedules/utils/calendar-nav';
import { MSG_D08 } from '@/src/shared/messages/d08';
import { LAYOUT, RADIUS } from '@/src/theme/layout-tokens';

interface ScheduleViewSwitchProps {
  options: SegmentOption<CalendarView>[];
  value: CalendarView;
  onChange: (value: CalendarView) => void;
}

export function ScheduleViewSwitch({
  options,
  value,
  onChange,
}: ScheduleViewSwitchProps) {
  return (
    <Box
      role='group'
      aria-label={MSG_D08.VIEW_ARIA}
      sx={{
        display: 'inline-flex',
        border: 1,
        borderColor: 'divider',
        borderRadius: `${RADIUS.sm}px`,
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <ButtonBase
            key={option.value}
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            sx={{
              minHeight: { xs: LAYOUT.touch, md: LAYOUT.controlSm },
              minWidth: 56,
              px: 3,
              borderLeft: index === 0 ? 0 : 1,
              borderColor: 'divider',
              bgcolor: isSelected ? 'primary.main' : 'transparent',
              color: isSelected
                ? 'primary.contrastText'
                : 'semantic.text.onMuted',
              transition: (t) => t.transitions.create(['background-color']),
              '&.Mui-focusVisible, &:focus-visible': {
                outline: 2,
                outlineColor: 'primary.main',
                outlineOffset: -2,
              },
            }}
          >
            <Typo.Badge.Medium color='inherit'>
              {option.label}
            </Typo.Badge.Medium>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
