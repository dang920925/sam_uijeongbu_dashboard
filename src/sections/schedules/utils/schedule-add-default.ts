// ----------------------------------------------------------------------
// "일정 추가" 폼 기본값(순수 함수) — U23 보강.
// - 머리 버튼·목록 보기 = 현행 빈 값(J-63 — 선택 날짜 개념 없음).
// - 월 빈 자리 = 시작 '{날짜}T00:00'(J-19).
// - 주 빈 30분 칸 = 시작 '{날짜}T{HH:mm}', 종료 +1시간(J-60, 자정을 넘으면 다음 날).
// datetime-local 값은 KST 벽시계 — 저장 때 매퍼가 +09:00 을 붙인다.
// ----------------------------------------------------------------------
import {
  EMPTY_SCHEDULE_FORM,
  type ScheduleFormInput,
} from '@/src/api/schedule-mapper';
import {
  addDays,
  formatMinutes,
  MINUTES_PER_DAY,
} from '@/src/sections/schedules/utils/kst-calendar';

export function emptyAddForm(): ScheduleFormInput {
  return EMPTY_SCHEDULE_FORM;
}

export function monthAddForm(date: string): ScheduleFormInput {
  return { ...EMPTY_SCHEDULE_FORM, startAt: `${date}T00:00` };
}

export function weekAddForm(date: string, minutes: number): ScheduleFormInput {
  const endMinutes = minutes + 60;
  const endDate = endMinutes >= MINUTES_PER_DAY ? addDays(date, 1) : date;
  return {
    ...EMPTY_SCHEDULE_FORM,
    startAt: `${date}T${formatMinutes(minutes)}`,
    endAt: `${endDate}T${formatMinutes(endMinutes)}`,
  };
}
