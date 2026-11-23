// ----------------------------------------------------------------------
// 회차 매퍼(FN-28) — develop §11.4 AdminShowItem·ShowUpsert ↔ 화면 모델·다이얼로그 폼 값. 순수 함수(+ spec).
// - 폼의 빈 문자열은 계약의 null 로(develop §3.1 "값 없음은 null").
// - 예매 오픈 시각은 폼에서 날짜·시각 두 칸(designer SCR-D11 dialog-show) → KST `+09:00` datetime 하나로 합친다.
// - 가격은 회차에 없다 — 공연 단위 가격 등급(develop §11.10 J-72, price-tier-mapper.ts).
// ----------------------------------------------------------------------
import type {
  AdminShowItemResponse,
  BookingShowState,
  ShowPatchRequest,
  ShowStatus,
  ShowUpsertRequest,
} from '@/src/types/booking';
import {
  fromKstDateTimeInput,
  toKstDateTimeInput,
} from '@/src/utils/kst-date-format';

/** 화면 회차 모델 — 계약 필드 그대로(null 유지) */
export interface Show {
  id: string;
  classId: string | null;
  showDate: string;
  startTime: string;
  endTime: string | null;
  venue: string | null;
  status: ShowStatus;
  bookingEnabled: boolean;
  /** (U48) 회차 출연 팀 — null = 팀 미정 */
  teamAccountId: string | null;
  bookingOpenAt: string | null;
  totalSeats: number | null;
  pendingQty: number;
  confirmedQty: number;
  remainingSeats: number | null;
  admittedCount: number;
  state: BookingShowState;
  /** 회차 + 공연 설정 둘 다의 빈 필드 이름(계약 필드명, + publicTier) */
  missingFields: string[];
}

/** 회차 다이얼로그 폼 값 — 입력칸 문자열 그대로, 요청 때 숫자·null 로 바꾼다 */
export interface ShowFormInput {
  showDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  /** '' = 선택 안 함 */
  classId: string;
  totalSeats: string;
  /** 'YYYY-MM-DD'(KST) */
  bookingOpenDate: string;
  /** 'HH:mm'(KST) */
  bookingOpenTime: string;
  bookingEnabled: boolean;
  status: ShowStatus;
  /** (U48) '' = 팀 미정(수정 때만 보낸다) */
  teamAccountId: string;
}

export const EMPTY_SHOW_FORM: ShowFormInput = {
  showDate: '',
  startTime: '',
  endTime: '',
  venue: '',
  classId: '',
  totalSeats: '',
  bookingOpenDate: '',
  bookingOpenTime: '',
  bookingEnabled: true,
  status: 'UPCOMING',
  teamAccountId: '',
};

const blankToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/** 입력칸 문자열 → 정수, 비었거나 정수가 아니면 null(검증은 utils 가 먼저 한다) */
export function toIntOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isInteger(n) ? n : null;
}

const intToInput = (value: number | null): string =>
  value === null ? '' : String(value);

export function fromAdminShowItemResponse(res: AdminShowItemResponse): Show {
  return {
    id: res.id,
    classId: res.classId ?? null,
    showDate: res.showDate,
    startTime: res.startTime,
    endTime: res.endTime ?? null,
    venue: res.venue ?? null,
    status: res.status,
    bookingEnabled: res.bookingEnabled,
    teamAccountId: res.teamAccountId ?? null,
    bookingOpenAt: res.bookingOpenAt ?? null,
    totalSeats: res.totalSeats ?? null,
    pendingQty: res.pendingQty,
    confirmedQty: res.confirmedQty,
    remainingSeats: res.remainingSeats ?? null,
    admittedCount: res.admittedCount,
    state: res.state,
    missingFields: res.missingFields ?? [],
  };
}

/** 날짜·시각 두 칸 → datetime. 둘 중 하나라도 비면 null */
export function toBookingOpenAt(date: string, time: string): string | null {
  if (date === '' || time === '') return null;
  return fromKstDateTimeInput(`${date}T${time}`);
}

export function toShowUpsertRequest(input: ShowFormInput): ShowUpsertRequest {
  return {
    showDate: input.showDate,
    startTime: input.startTime,
    endTime: blankToNull(input.endTime),
    venue: blankToNull(input.venue),
    classId: input.classId === '' ? null : input.classId,
    totalSeats: toIntOrNull(input.totalSeats),
    bookingOpenAt: toBookingOpenAt(
      input.bookingOpenDate,
      input.bookingOpenTime
    ),
    bookingEnabled: input.bookingEnabled,
    status: input.status,
  };
}

/** (U48) 회차 수정 PATCH — 등록 본문 + 출연 팀('' → null) */
export function toShowPatchRequest(input: ShowFormInput): ShowPatchRequest {
  return {
    ...toShowUpsertRequest(input),
    teamAccountId: input.teamAccountId === '' ? null : input.teamAccountId,
  };
}

/** 수정 다이얼로그 초기값 */
export function toShowFormInput(show: Show): ShowFormInput {
  const [openDate = '', openTime = ''] = toKstDateTimeInput(
    show.bookingOpenAt
  ).split('T');
  return {
    showDate: show.showDate,
    startTime: show.startTime,
    endTime: show.endTime ?? '',
    venue: show.venue ?? '',
    classId: show.classId ?? '',
    totalSeats: intToInput(show.totalSeats),
    bookingOpenDate: openDate,
    bookingOpenTime: openTime,
    bookingEnabled: show.bookingEnabled,
    status: show.status,
    teamAccountId: show.teamAccountId ?? '',
  };
}
