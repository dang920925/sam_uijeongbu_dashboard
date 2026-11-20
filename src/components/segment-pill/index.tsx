'use client';

// ----------------------------------------------------------------------
// SegmentPill — 필터 토글 묶음. 선택 slate-900 / 비선택 slate-100, aria-pressed 로 상태를 알린다(§11.8).
// 높이 32, xs 터치 44.
// ----------------------------------------------------------------------
import ButtonBase from '@mui/material/ButtonBase';

import { Typo } from '@/src/components/typo';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentPillProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function SegmentPill<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentPillProps<T>) {
  return (
    <div role='group' aria-label={ariaLabel} className='flex flex-wrap gap-2'>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <ButtonBase
            key={option.value}
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            sx={{
              minHeight: { xs: 44, md: 32 },
              px: { xs: 4, md: 3 },
              borderRadius: 9999,
              bgcolor: isSelected ? 'primary.main' : 'semantic.surface.muted',
              // 비선택 글자 slate-600(qa1 QA1-006 — slate-100 위 slate-500 은 4.34)
              color: isSelected
                ? 'primary.contrastText'
                : 'semantic.text.onMuted',
              transition: (t) => t.transitions.create(['background-color']),
              '&:focus-visible': {
                outline: 2,
                outlineColor: 'primary.main',
                outlineOffset: 2,
              },
            }}
          >
            <Typo.Badge.Medium color='inherit'>
              {option.label}
            </Typo.Badge.Medium>
          </ButtonBase>
        );
      })}
    </div>
  );
}
