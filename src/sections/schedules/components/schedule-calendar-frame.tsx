'use client';

// ----------------------------------------------------------------------
// 캘린더 카드 안 틀 — 위 진행 막대(받는 중) · 오류 "다시 시도"(격자 위) · 범위 이동 슬라이드(designer §14.4:
// ‹ › · "오늘" = 가로 8px 슬라이드 + 페이드, medium · standard — reduced-motion 은 테마 전역이 즉시로).
// 로딩 중에도 이전 범위 격자를 지우지 않는다(placeholderData).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { keyframes } from '@mui/material/styles';
import type { ReactNode } from 'react';

import { MSG_COMMON } from '@/src/shared/messages/common';
import { MOTION } from '@/src/theme/motion';

interface ScheduleCalendarFrameProps {
  rangeKey: string;
  direction: -1 | 0 | 1;
  isFetching: boolean;
  error: ReactNode;
  children: ReactNode;
}

const slide = (from: number) =>
  keyframes`from { opacity: 0; transform: translateX(${from}px); } to { opacity: 1; transform: none; }`;
const SLIDE = { '-1': slide(-8), '0': slide(0), '1': slide(8) };

export function ScheduleCalendarFrame({
  rangeKey,
  direction,
  isFetching,
  error,
  children,
}: ScheduleCalendarFrameProps) {
  return (
    <>
      <Box sx={{ height: 2 }}>
        {isFetching ? (
          <LinearProgress
            aria-label={MSG_COMMON.LOADING_ARIA}
            sx={{ height: 2 }}
          />
        ) : null}
      </Box>
      {error}
      <Box
        key={rangeKey}
        sx={{
          animation: `${SLIDE[direction]} ${MOTION.duration.medium}ms ${MOTION.easing.standard}`,
        }}
      >
        {children}
      </Box>
    </>
  );
}
