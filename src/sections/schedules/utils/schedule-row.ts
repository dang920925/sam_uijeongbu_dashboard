// ----------------------------------------------------------------------
// 일정 → 표·카드 표시 모델(순수 함수). 시각은 KST 'YYYY.MM.DD HH:mm'(B12 9시간 차이 고침),
// 타입 배지 = 연습 neutral · 공연 info · 이벤트 warning · 기타 outline(designer W4 D08).
// ----------------------------------------------------------------------
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
  };
}

/** 행·카드 동작 콜백 */
export interface ScheduleRowHandlers {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}
