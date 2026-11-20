// ----------------------------------------------------------------------
// 예매(U24 1단계) 계약 DTO — develop §11.4 관리 API 정본 그대로(필드 이름·null 허용).
// 날짜 `YYYY-MM-DD`·시각 `HH:mm` 은 KST, datetime 은 ISO 8601 UTC(develop §3.1).
// 화면 모델(정규화·표시 가공)은 각 도메인 매퍼(src/api/<domain>-mapper.ts)가 만든다.
// ----------------------------------------------------------------------

/** 회차 예매 상태(develop §11.3 state 규칙 — 서버 계산) */
export type BookingShowState =
  'OPEN' | 'NOT_YET' | 'SOLD_OUT' | 'CLOSED' | 'NOT_READY';
/** 회차 상태(shows.status CHECK 그대로 — COMPLETED = 공연 끝) */
export type ShowStatus = 'UPCOMING' | 'BOOKING_OPEN' | 'COMPLETED';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type ReservationSource = 'ONLINE' | 'ADMIN';
export type ConfirmedBy = 'MANUAL' | 'AUTO';
export type CancelReason = 'BOOKER_REQUEST' | 'ADMIN' | 'DEADLINE_PASSED';

// ─── 예매 설정(FN-29) ───────────────────────────────────────────────

export interface BookingPolicyUpsertRequest {
  depositBank: string | null;
  depositAccountNumber: string | null;
  depositAccountHolder: string | null;
  maxTicketsPerBooking: number | null;
  depositDeadlineHours: number | null;
  refundPolicyText: string | null;
}

export interface BookingPolicyResponse extends BookingPolicyUpsertRequest {
  performanceId: string;
  /** 비어 있는 필드 이름(계약 필드명 그대로) — 화면 경고 */
  missingFields: string[];
}

// ─── 회차(FN-28) ────────────────────────────────────────────────────

export interface ShowUpsertRequest {
  showDate: string;
  startTime: string;
  endTime?: string | null;
  venue?: string | null;
  classId?: string | null;
  totalSeats?: number | null;
  price?: number | null;
  /** datetime(ISO) */
  bookingOpenAt?: string | null;
  bookingEnabled?: boolean;
  status?: ShowStatus;
}

export interface AdminShowItemResponse {
  id: string;
  classId: string | null;
  showDate: string;
  startTime: string;
  endTime: string | null;
  venue: string | null;
  status: ShowStatus;
  bookingEnabled: boolean;
  bookingOpenAt: string | null;
  totalSeats: number | null;
  price: number | null;
  pendingQty: number;
  confirmedQty: number;
  remainingSeats: number | null;
  admittedCount: number;
  state: BookingShowState;
  /** 회차 + 공연 설정 둘 다의 빈 필드 이름 */
  missingFields: string[];
}

/** `GET /admin/shows?from=` 항목 — 입장 체크 회차 선택용 */
export interface AdminShowWithTitleResponse extends AdminShowItemResponse {
  performanceTitle: string;
}

// ─── 예매(FN-33·34) ─────────────────────────────────────────────────

export interface ReservationListQuery {
  /** 지휘자 추가 요청(2026-11-20): q 가 있으면 생략 가능 — 모든 공연에서 찾는다(헤더 빠른 검색) */
  performanceId?: string;
  showId?: string;
  status?: ReservationStatus;
  deadlinePassed?: boolean;
  /** 이름 포함 · 연락처 숫자 포함 · code 일치 */
  q?: string;
  page?: number;
  size?: number;
}

export interface AdminReservationItemResponse {
  id: string;
  /**
   * 지휘자 추가 요청(2026-11-20 "예매번호로 찾기") — 공연을 가로질러 찾을 때 공연명 표시용.
   * 계약 §11.4 에 없던 필드라 optional(서버가 안 주면 화면은 공연명 없이 보인다 — 확인 필요).
   */
  performanceId?: string;
  performanceTitle?: string;
  code: string;
  showId: string;
  showDate: string;
  startTime: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  bookerName: string;
  bookerPhone: string;
  depositorName: string;
  inviter: { memberId: string; name: string } | null;
  inviterNote: string | null;
  status: ReservationStatus;
  source: ReservationSource;
  depositDueAt: string;
  deadlinePassed: boolean;
  confirmedAt: string | null;
  confirmedBy: ConfirmedBy | null;
  cancelledAt: string | null;
  cancelReason: CancelReason | null;
  memo: string | null;
  admittedCount: number;
  version: number;
  createdAt: string;
}

export interface ManualReservationRequest {
  showId: string;
  /** 1~20 — 1인 최대는 적용 안 함 */
  quantity: number;
  bookerName: string;
  bookerPhone: string;
  inviterMemberId?: string | null;
  memo?: string | null;
  confirmNow: boolean;
  /** 0~quantity, confirmNow=true 일 때만 */
  admitNow?: number;
}

export interface ReservationMemoRequest {
  memo: string | null;
  version: number;
}

export interface ReservationVersionRequest {
  version: number;
}

export interface ReservationCancelRequest {
  version: number;
  reason: CancelReason;
}

export interface CancelOverdueRequest {
  performanceId: string;
  showId?: string | null;
}

export interface CancelOverdueResponse {
  cancelledCount: number;
}

export interface ReservationSummaryShowRow {
  showId: string;
  showDate: string;
  startTime: string;
  totalSeats: number | null;
  pendingQty: number;
  confirmedQty: number;
  remainingSeats: number | null;
  confirmedAmount: number;
  admittedCount: number;
}

export interface ReservationSummaryInviterRow {
  memberId: string | null;
  /** null = 초대 없음(memberId 도 null) — inviterNote 는 '직접 입력' 한 묶음 */
  name: string | null;
  pendingQty: number;
  confirmedQty: number;
}

export interface ReservationSummaryBoardResponse {
  shows: ReservationSummaryShowRow[];
  inviters: ReservationSummaryInviterRow[];
  totals: {
    pendingCount: number;
    pendingQty: number;
    confirmedQty: number;
    confirmedAmount: number;
    overdueCount: number;
  };
}

// ─── 초대 링크(FN-35) ───────────────────────────────────────────────

export interface InviteCodeItemResponse {
  memberId: string;
  name: string;
  type: 'GENERAL' | 'ACTOR';
  inviteCode: string | null;
}

export interface InviteCodeIssuedResponse {
  memberId: string;
  inviteCode: string;
}

// ─── 입장 체크(FN-36) ───────────────────────────────────────────────

export interface AdmissionItemResponse {
  id: string;
  code: string;
  bookerName: string;
  phoneLast4: string;
  quantity: number;
  admittedCount: number;
  status: 'PENDING' | 'CONFIRMED';
  amount: number;
  deadlinePassed: boolean;
  memo: string | null;
  version: number;
}

export interface AdmissionSummaryResponse {
  confirmedQty: number;
  admittedCount: number;
  notAdmittedQty: number;
  pendingCount: number;
  pendingQty: number;
}

export interface AdmissionBoardResponse {
  show: {
    id: string;
    performanceTitle: string;
    showDate: string;
    startTime: string;
    venue: string | null;
  };
  summary: AdmissionSummaryResponse;
  /** 취소 제외, 이름 가나다순 */
  items: AdmissionItemResponse[];
  /**
   * 지휘자 추가 요청(2026-11-20) — q 가 예매번호 형식인데 이 회차에 없을 때 다른 회차의 같은 번호 예매.
   * back-end 가 넣으면 쓰고, 없으면 화면이 `GET /admin/reservations?q=` 로 보조 조회한다(모양 확인 필요).
   */
  otherShowMatches?: AdmissionOtherShowMatch[];
}

export interface AdmissionOtherShowMatch {
  reservationId: string;
  code: string;
  showId: string;
  showDate: string;
  startTime: string;
  bookerName: string;
  quantity: number;
  status: ReservationStatus;
}

export interface AdmissionDeltaRequest {
  /** -20~20, 0 아님 */
  delta: number;
}

export interface ConfirmAndAdmitRequest {
  version: number;
  /** 1~quantity */
  admit: number;
}

export interface AdmissionResultResponse {
  item: AdmissionItemResponse;
  summary: AdmissionSummaryResponse;
}
