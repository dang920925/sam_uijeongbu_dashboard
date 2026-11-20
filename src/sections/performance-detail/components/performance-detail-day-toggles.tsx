'use client';

// ----------------------------------------------------------------------
// 요일 토글 월~일 — 원형 40(xs 44), aria-pressed(designer `.d04-days .day-toggle`, 현행 rounded-full).
// 선택 = primary, 겹치는 요일 = 비활성 + 빨강(semantic.conflict.*), 나머지 = 흰 바탕 테두리.
// ----------------------------------------------------------------------
import ButtonBase from '@mui/material/ButtonBase';

import { Typo } from '@/src/components/typo';
import type { DayToggleState } from '@/src/sections/performance-detail/utils/class-conflict';
import { LAYOUT } from '@/src/theme/layout-tokens';
import { DAY_LABEL, type DayCode } from '@/src/types/codes';

interface PerformanceDetailDayTogglesProps {
  states: DayToggleState[];
  onToggle: (day: DayCode) => void;
}

export function PerformanceDetailDayToggles({
  states,
  onToggle,
}: PerformanceDetailDayTogglesProps) {
  return (
    <div className='flex flex-wrap gap-2'>
      {states.map((state) => (
        <ButtonBase
          key={state.day}
          aria-pressed={state.isSelected}
          disabled={state.isConflict}
          onClick={() => onToggle(state.day)}
          sx={{
            width: { xs: LAYOUT.touch, md: LAYOUT.control },
            height: { xs: LAYOUT.touch, md: LAYOUT.control },
            borderRadius: '50%',
            border: 1,
            borderColor: state.isSelected
              ? 'primary.main'
              : state.isConflict
                ? 'semantic.conflict.border'
                : 'divider',
            bgcolor: state.isSelected
              ? 'primary.main'
              : state.isConflict
                ? 'semantic.conflict.bg'
                : 'background.paper',
            color: state.isSelected
              ? 'primary.contrastText'
              : state.isConflict
                ? 'semantic.conflict.fg'
                : 'text.primary',
            '&.Mui-disabled': { color: 'semantic.conflict.fg' },
            '&:focus-visible': {
              outline: 2,
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
          }}
        >
          <Typo.Badge.Medium color='inherit'>
            {DAY_LABEL[state.day]}
          </Typo.Badge.Medium>
        </ButtonBase>
      ))}
    </div>
  );
}
