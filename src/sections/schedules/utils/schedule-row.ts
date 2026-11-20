// ----------------------------------------------------------------------
// 일정 → 표·카드 표시 모델(순수 함수). 시각은 KST 'YYYY.MM.DD HH:mm'(B12 9시간 차이 고침),
// 타입 배지 = 연습 neutral · 공연 info · 이벤트 warning · 기타 outline(designer W4 D08).
// U29: 취소 일정은 제목 취소선 + "취소" Label + 아래 "취소 · {사유}"(시안 SCR-D08-U29 cancelled-list).
// ----------------------------------------------------------------------
import { MSG_D08 } from '@/src/shared/messages/d08';
import type { LabelTone } from '@/src/theme/semantic';
import { SCHEDULE_TYPE_LABEL } from '@/src/types/codes';
import type { Schedule } from '@/src/types/content';
import { formatKstDateTime } from '@/src/utils/kst-date-format';
import { SCHEDULE_TYPE_TONE } from '@/src/utils/status-tone';

export interface ScheduleRow {
  id: string;
  title: string;
  typeLabel: string;
  typeTone: LabelTone;
  typeVariant: 'soft' | 'outline';
  startAt: string;
  endAt: string | null;
  location: string | null;
  isCancelled: boolean;
  /** "취소 · {사유}"(취소 아니면 null) */
  cancelText: string | null;
}

export function toScheduleRow(schedule: Schedule): ScheduleRow {
  return {
    id: schedule.id,
    title: schedule.title,
    typeLabel: SCHEDULE_TYPE_LABEL[schedule.type],
    typeTone: SCHEDULE_TYPE_TONE[schedule.type],
    typeVariant: schedule.type === 'ETC' ? 'outline' : 'soft',
    startAt: formatKstDateTime(schedule.startAt),
    endAt: schedule.endAt ? formatKstDateTime(schedule.endAt) : null,
    location: schedule.location?.trim() ? schedule.location : null,
    isCancelled: schedule.status === 'CANCELLED',
    cancelText:
      schedule.status === 'CANCELLED' && schedule.cancelReason
        ? MSG_D08.CANCELLED_REASON(schedule.cancelReason)
        : null,
  };
}

/** 행·카드 동작 콜백 */
export interface ScheduleRowHandlers {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  /** U29 — 일정 취소 창 열기 */
  onCancel: (id: string) => void;
  /** U29 — 취소 해제 확인창 열기 */
  onRestore: (id: string) => void;
}
