// ----------------------------------------------------------------------
// Label — 상태 배지. pastel 배경 + 진한 글자(filled 금지, 가이드 §11.3). 색은 tone 으로만 고른다.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

import { Typo } from '@/src/components/typo';
import type { LabelTone } from '@/src/theme/semantic';

interface LabelProps {
  tone: LabelTone;
  children: ReactNode;
  /** 'outline' — 일정 "기타" 타입(현행 Badge outline: 흰 바탕 + 테두리) */
  variant?: 'soft' | 'outline';
}

export function Label({ tone, children, variant = 'soft' }: LabelProps) {
  return (
    <Box
      component='span'
      sx={
        variant === 'outline'
          ? {
              display: 'inline-flex',
              alignItems: 'center',
              px: 2,
              py: 1,
              borderRadius: 9999,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              color: 'text.primary',
              whiteSpace: 'nowrap',
            }
          : {
              display: 'inline-flex',
              alignItems: 'center',
              px: 2,
              py: 1,
              borderRadius: 9999,
              bgcolor: `semantic.label.${tone}.bg`,
              color: `semantic.label.${tone}.fg`,
              whiteSpace: 'nowrap',
            }
      }
    >
      <Typo.Caption.Semibold color='inherit'>{children}</Typo.Caption.Semibold>
    </Box>
  );
}
