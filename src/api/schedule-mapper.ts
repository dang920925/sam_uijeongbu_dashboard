// ----------------------------------------------------------------------
// 일정 매퍼(FN-15). 폼은 <input type="datetime-local"> 의 KST 벽시계 값을 들고,
// 요청에는 `+09:00` 오프셋을 붙인다(develop §3.1 "입력은 오프셋 필수", B12 9시간 차이 고침).
// 빈 문자열(종료·장소·설명·연결 공연/반)은 null 로 보낸다.
// ----------------------------------------------------------------------
import {
  OBSERVATION_CLOSABLE_TYPES,
  type ScheduleType,
} from '@/src/types/codes';
import type {
  Schedule,
  ScheduleCancelRequest,
  ScheduleItemResponse,
  ScheduleUpsertRequest,
} from '@/src/types/content';
import {
  fromKstDateTimeInput,
  toKstDateTimeInput,
} from '@/src/utils/kst-date-format';

/** 일정 다이얼로그 폼 값 — 날짜는 'YYYY-MM-DDTHH:mm'(KST), 선택 안 함은 '' */
export interface ScheduleFormInput {
  title: string;
  type: ScheduleType;
  startAt: string;
  endAt: string;
  location: string;
  description: string;
  performanceId: string;
  classId: string;
}

const blankToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export function fromScheduleItemResponse(res: ScheduleItemResponse): Schedule {
  return {
    id: res.id,
    title: res.title,
    type: res.type,
    startAt: res.startAt,
    endAt: res.endAt ?? null,
    location: res.location ?? null,
    description: res.description ?? null,
    classId: res.classId ?? null,
    performanceId: res.performanceId ?? null,
    // U29 — 옛 응답(필드 없음)은 진행 일정으로 본다
    status: res.status ?? 'ACTIVE',
    cancelReason: res.cancelReason ?? null,
    observationClosed: res.observationClosed ?? null,
  };
}

/** 취소 창 폼 → 요청(U29). 참관 체크는 연습·공연에서만 보이므로 그 밖은 false(서버도 false 로 저장 — C-11) */
export function toScheduleCancelRequest(input: {
  reason: string;
  observationClosed: boolean;
  type: ScheduleType;
}): ScheduleCancelRequest {
  return {
    reason: input.reason.trim(),
    observationClosed: OBSERVATION_CLOSABLE_TYPES.includes(input.type)
      ? input.observationClosed
      : false,
  };
}

export function toScheduleUpsertRequest(
  input: ScheduleFormInput
): ScheduleUpsertRequest {
  return {
    title: input.title.trim(),
    type: input.type,
    startAt: fromKstDateTimeInput(input.startAt) ?? '',
    endAt: fromKstDateTimeInput(input.endAt),
    location: blankToNull(input.location),
    description: blankToNull(input.description),
    performanceId: blankToNull(input.performanceId),
    classId: blankToNull(input.classId),
  };
}

/** 새 일정 폼 기본값 — 타입 기본 "연습"(현행 Schedules.tsx:103) */
export const EMPTY_SCHEDULE_FORM: ScheduleFormInput = {
  title: '',
  type: 'PRACTICE',
  startAt: '',
  endAt: '',
  location: '',
  description: '',
  performanceId: '',
  classId: '',
};

/** 수정 다이얼로그 초기값 — 서버 UTC 를 KST 입력 값으로 */
export function toScheduleFormInput(schedule: Schedule): ScheduleFormInput {
  return {
    title: schedule.title,
    type: schedule.type,
    startAt: toKstDateTimeInput(schedule.startAt),
    endAt: toKstDateTimeInput(schedule.endAt),
    location: schedule.location ?? '',
    description: schedule.description ?? '',
    performanceId: schedule.performanceId ?? '',
    classId: schedule.classId ?? '',
  };
}
