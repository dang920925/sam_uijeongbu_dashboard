// ----------------------------------------------------------------------
// 일정 폼 검증(순수 함수) — 제목·시작 시간 필수(현행 Schedules.tsx:26,28),
// 종료 < 시작이면 SCH_002 문구(develop §3.1 — 서버도 400 SCH_002 로 다시 검사). 같으면 통과(endAt ≥ startAt).
// datetime-local 값('YYYY-MM-DDTHH:mm')은 같은 형식이라 문자열 비교로 시각 순서를 안다.
// ----------------------------------------------------------------------
import type { ScheduleFormInput } from '@/src/api/schedule-mapper';
import { MSG_D08 } from '@/src/shared/messages/d08';

export interface ScheduleFormErrors {
  title: string | null;
  startAt: string | null;
  endAt: string | null;
}

export const NO_SCHEDULE_FORM_ERRORS: ScheduleFormErrors = {
  title: null,
  startAt: null,
  endAt: null,
};

export function validateScheduleForm(
  input: ScheduleFormInput
): ScheduleFormErrors {
  return {
    title: input.title.trim() === '' ? MSG_D08.TITLE_REQUIRED : null,
    startAt: input.startAt === '' ? MSG_D08.START_REQUIRED : null,
    endAt:
      input.startAt !== '' && input.endAt !== '' && input.endAt < input.startAt
        ? MSG_D08.END_BEFORE_START
        : null,
  };
}

export function hasScheduleFormErrors(errors: ScheduleFormErrors): boolean {
  return Object.values(errors).some((message) => message !== null);
}
