// ----------------------------------------------------------------------
// 상세 팝오버·시트 표시 모델(순수 함수) — U23 보강 + U29.
// 유형 Label · 제목 · "{M월 D일 (요일)} HH:mm – HH:mm" · 장소 · 설명 · "공연 제목 · 반 이름" ·
// 취소면 "취소 · {사유}" + (참관 막음이면) "참관 받지 않음".
// ----------------------------------------------------------------------
import type { LabelTone } from '@/src/theme/semantic';
import {
  dayOfWeek,
  parseDate,
  WEEKDAY_LABELS,
  type DateParts,
} from '@/src/sections/schedules/utils/kst-calendar';
import { toCalendarEvent } from '@/src/sections/schedules/utils/calendar-event';
import { MSG_D08 } from '@/src/shared/messages/d08';
import type { ScheduleType } from '@/src/types/codes';
import type { Schedule } from '@/src/types/content';
import { SCHEDULE_TYPE_TONE } from '@/src/utils/status-tone';

export interface ScheduleDetail {
  id: string;
  type: ScheduleType;
  typeLabel: string;
  typeTone: LabelTone;
  typeVariant: 'soft' | 'outline';
  title: string;
  whenText: string;
  location: string | null;
  description: string | null;
  linkText: string | null;
  isCancelled: boolean;
  /** "취소 · {사유}" */
  cancelText: string | null;
  observationClosed: boolean;
}

export function toScheduleDetail(
  schedule: Schedule,
  names: {
    performances: ReadonlyMap<string, string>;
    classes: ReadonlyMap<string, string>;
  }
): ScheduleDetail | null {
  const event = toCalendarEvent(schedule);
  if (!event) return null;
  const p = parseDate(event.date) as DateParts;
  const linkParts = [
    schedule.performanceId
      ? names.performances.get(schedule.performanceId)
      : undefined,
    schedule.classId ? names.classes.get(schedule.classId) : undefined,
  ].filter((v): v is string => Boolean(v));
  return {
    id: schedule.id,
    type: schedule.type,
    typeLabel: event.typeLabel,
    typeTone: SCHEDULE_TYPE_TONE[schedule.type],
    typeVariant: schedule.type === 'ETC' ? 'outline' : 'soft',
    title: schedule.title,
    whenText: MSG_D08.WHEN(
      p.month,
      p.day,
      WEEKDAY_LABELS[dayOfWeek(event.date)],
      event.timeText
    ),
    location: event.location,
    description: schedule.description?.trim() ? schedule.description : null,
    linkText: linkParts.length > 0 ? linkParts.join(' · ') : null,
    isCancelled: event.isCancelled,
    cancelText:
      event.isCancelled && event.cancelReason
        ? MSG_D08.CANCELLED_REASON(event.cancelReason)
        : null,
    observationClosed: event.isCancelled && schedule.observationClosed === true,
  };
}
