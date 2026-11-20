// ----------------------------------------------------------------------
// 칩·블록·아젠다 막대의 유형 톤(sx) — 현행 타입 배지 톤 그대로(연습 neutral · 공연 info · 이벤트 warning · 기타 outline).
// U29 취소 = 흰 바탕 + 점선 테두리 + 회색 글자(designer §14.2 — 연습 톤이 이미 회색이라 구분 위해).
// ⚑ 점선 색: 시안 --label-outline-border(slate-300)에 해당하는 테마 토큰이 없어 text.disabled(slate-400) 사용.
// ----------------------------------------------------------------------
import type { SxProps, Theme } from '@mui/material/styles';

import type { ScheduleType } from '@/src/types/codes';

const TONE: Record<Exclude<ScheduleType, 'ETC'>, string> = {
  PRACTICE: 'neutral',
  SHOW: 'info',
  EVENT: 'warning',
};

export const CANCELLED_BORDER = 'text.disabled';

/** 칩·블록 바탕·글자 */
export function scheduleToneSx(
  type: ScheduleType,
  isCancelled: boolean
): SxProps<Theme> {
  if (isCancelled)
    return {
      bgcolor: 'background.paper',
      color: 'text.secondary',
      border: 1,
      borderStyle: 'dashed',
      borderColor: CANCELLED_BORDER,
    };
  if (type === 'ETC')
    return {
      bgcolor: 'background.paper',
      color: 'text.primary',
      border: 1,
      borderColor: 'divider',
    };
  return {
    bgcolor: `semantic.label.${TONE[type]}.bg`,
    color: `semantic.label.${TONE[type]}.fg`,
  };
}

/** 아젠다 색 막대·블록 왼쪽 선 색 */
export function scheduleBarColor(
  type: ScheduleType,
  isCancelled: boolean
): string {
  if (isCancelled || type === 'ETC') return CANCELLED_BORDER;
  return `semantic.label.${TONE[type]}.fg`;
}
