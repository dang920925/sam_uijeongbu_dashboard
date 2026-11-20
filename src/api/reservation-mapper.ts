// ----------------------------------------------------------------------
// 예매 매퍼(FN-33·34) — 계약 AdminReservationItem ↔ 화면 모델. 빈 문자열 → null, 연락처는 숫자·하이픈만.
// (리드가 수동 등록 부분을 먼저 만들고, D12 작업자가 이어서 채운다 — 입장 체크 D13 도 수동 등록을 쓴다.)
// ----------------------------------------------------------------------
import type {
  AdminReservationItemResponse,
  ManualReservationRequest,
} from '@/src/types/booking';

/** 화면 모델 — 계약 모양에 공연 id·제목을 null 로 정규화(빠른 검색 응답에만 올 수 있음) */
export type Reservation = Omit<
  AdminReservationItemResponse,
  'performanceId' | 'performanceTitle'
> & { performanceId: string | null; performanceTitle: string | null };

export function fromAdminReservationItemResponse(
  res: AdminReservationItemResponse
): Reservation {
  return {
    ...res,
    performanceId: res.performanceId ?? null,
    performanceTitle: res.performanceTitle ?? null,
    inviter: res.inviter ?? null,
    inviterNote: res.inviterNote ?? null,
    confirmedAt: res.confirmedAt ?? null,
    confirmedBy: res.confirmedBy ?? null,
    cancelledAt: res.cancelledAt ?? null,
    cancelReason: res.cancelReason ?? null,
    memo: res.memo ?? null,
  };
}

/** 수동 등록 폼 값 — 숫자 칸은 입력 문자열 그대로 들고 있다가 요청 때 정수로 바꾼다 */
export interface ManualReservationFormInput {
  showId: string;
  quantity: string;
  bookerName: string;
  bookerPhone: string;
  inviterMemberId: string | null;
  memo: string;
  confirmNow: boolean;
  /** confirmNow 일 때만 보낸다(0~매수) */
  admitNow: string;
}

function toInt(value: string): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : 0;
}

export function toManualReservationRequest(
  input: ManualReservationFormInput
): ManualReservationRequest {
  const memo = input.memo.trim();
  return {
    showId: input.showId,
    quantity: toInt(input.quantity),
    bookerName: input.bookerName.trim(),
    bookerPhone: input.bookerPhone.trim(),
    inviterMemberId: input.inviterMemberId || null,
    memo: memo === '' ? null : memo,
    confirmNow: input.confirmNow,
    ...(input.confirmNow ? { admitNow: toInt(input.admitNow) } : {}),
  };
}

/** 예매번호 형식(4자리 숫자 — 계약 code CHAR(4)) — 앞뒤 공백·'#' 은 무시 */
export function toReservationCode(value: string): string | null {
  const trimmed = value.trim().replace(/^#/, '');
  return /^[0-9]{4}$/.test(trimmed) ? trimmed : null;
}
