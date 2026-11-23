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
  /** 문의처(develop §11.10 추가 — 선택, ≤200, http 로 시작하면 https:// 만). missingFields 에 넣지 않는다 */
  inquiryContact: string | null;
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
  /** datetime(ISO) — 가격은 공연 단위 등급(develop §11.10 J-72, 회차 price 삭제) */
  bookingOpenAt?: string | null;
  bookingEnabled?: boolean;
  status?: ShowStatus;
}

/** (U48) 회차 수정(PATCH)만 — 등록(POST)에는 teamAccountId 가 없다(back-end §25.6). null = 팀 미정 */
export type ShowPatchRequest = Partial<ShowUpsertRequest> & {
  teamAccountId?: string | null;
};

export interface AdminShowItemResponse {
  id: string;
  classId: string | null;
  showDate: string;
  startTime: string;
  endTime: string | null;
  venue: string | null;
  status: ShowStatus;
  bookingEnabled: boolean;
  /** (U48) 회차 출연 팀(팀 계정 id) — 미정·폐기 팀이면 null(옛 서버는 키 없음) */
  teamAccountId?: string | null;
  bookingOpenAt: string | null;
  totalSeats: number | null;
  pendingQty: number;
  confirmedQty: number;
  remainingSeats: number | null;
  admittedCount: number;
  state: BookingShowState;
  /** 회차 + 공연 설정 둘 다의 빈 필드 이름(+ `publicTier` = 사용 중 PUBLIC 등급 없음 — 경고만) */
  missingFields: string[];
}

/** `GET /admin/shows?from=` 항목 — 입장 체크 회차 선택용 */
export interface AdminShowWithTitleResponse extends AdminShowItemResponse {
  performanceTitle: string;
  /** 입장 체크 현장 등록이 그 공연의 가격 등급을 불러오는 키 — 서버 AdminUpcomingShowItemResponseDto(2026-11-20 integration 추가) */
  performanceId: string;
}

// ─── 가격 등급(develop §11.10 — U24 보강2) ──────────────────────────

export type PriceTierVisibility = 'PUBLIC' | 'LINK_ONLY';

export interface AdminPriceTierResponse {
  id: string;
  name: string;
  /** 1~1,000,000원(0원 등급 없음 — 사용자 결정) */
  price: number;
  visibility: PriceTierVisibility;
  /** LINK_ONLY 일 때만 — 링크 `{CLIENT_PUBLIC_URL}/works/{performanceId}/book?tier={linkToken}` */
  linkToken: string | null;
  sortOrder: number;
  isActive: boolean;
  /** PENDING·CONFIRMED 매수 */
  usedQty: number;
  /** (U41) 가격 역할 — BASE 기본가 · SAM_RELATED SAM 관계자가 · null 예전 등급(화면에서 숨김) */
  role: PriceTierRole | null;
}

/** (U41 develop §22) 가격 역할 */
export type PriceTierRole = 'BASE' | 'SAM_RELATED';

/** `GET·PUT /admin/performances/{id}/inviter-prices` — 없으면 null(둘 중 하나라도 없으면 예매 NOT_READY) */
export interface InviterPricesResponse {
  base: number | null;
  samRelated: number | null;
}

/** 둘 다 1원 이상 */
export interface InviterPricesRequest {
  base: number;
  samRelated: number;
}

export interface PriceTierCreateRequest {
  name: string;
  price: number;
  visibility: PriceTierVisibility;
  sortOrder?: number;
  isActive?: boolean;
}

export type PriceTierPatchRequest = Partial<PriceTierCreateRequest>;

/** 예매의 등급 줄(관리 응답) — isCustom = 관리자 '직접 입력' 줄(tierId null) */
export interface ReservationLineResponse {
  tierId: string | null;
  tierName: string;
  /** 직접 입력 줄은 null(back-end §14.4 #6 — 단가 없음, 줄 금액만) */
  unitPrice: number | null;
  quantity: number;
  lineAmount: number;
  isCustom: boolean;
  /** 등급 노출 방식 — LINK_ONLY = 할인(링크 전용) 등급 Label, 직접 입력 줄은 null(지휘자 확정 2026-11-20) */
  visibility: PriceTierVisibility | null;
}

/** 등급 줄 요청 */
export interface ReservationTierLineRequest {
  tierId: string;
  /** 1~20 */
  quantity: number;
}

/** 관리자 '직접 입력' 줄 */
export interface ReservationCustomLineRequest {
  /** ≤30, 기본 "직접 입력" */
  label?: string;
  quantity: number;
  /** 0 이상 */
  amount: number;
}

// ─── 좌석(U35 — develop §19 · back-end §16) ────────────────────────
export type SeatKind = 'SEAT' | 'AISLE' | 'VOID';

/** 초대한 사람 구분(U41) — 배우 · 연출·스태프 관계자 · SAM 관계자. null = 기존 예매·초대 없음 */
export type InviterCategory = 'MEMBER' | 'STAFF_RELATED' | 'SAM_RELATED';

/** 관리 예매·입장 명단의 초대한 사람(U41) */
export interface ReservationInviterResponse {
  kind: InviterCategory;
  memberId: string | null;
  memberName: string | null;
}

/** 수동 등록의 초대한 사람(공개 예매와 같은 모양 — 관리자는 모든 배우 단원) */
export type ReservationInviterRequest =
  | { kind: 'MEMBER'; memberId: string }
  | { kind: 'STAFF_RELATED' }
  | { kind: 'SAM_RELATED' };

/** 예매 좌석 — 좌석 지정이 꺼졌거나 좌석 미정이면 [] */
export interface ReservationSeatResponse {
  rowLabel: string;
  seatNumber: number;
}

/** 관리 좌석 지도 칸 — 공개 칸 + reservationId·bookerName(현황) + rowLabel(편집) */
export interface AdminSeatMapCellResponse {
  seatId: string | null;
  kind: SeatKind;
  rowLabel: string | null;
  seatNumber: number | null;
  sold: boolean;
  reservationId: string | null;
  bookerName: string | null;
}

export interface AdminSeatMapRowResponse {
  label: string | null;
  cells: AdminSeatMapCellResponse[];
}

/** `GET·PUT /admin/shows/{id}/seat-map` — 첫 행이 무대 쪽, 위치 0부터. 배치 없으면 404 SEAT_003 */
export interface AdminSeatMapResponse {
  seatSelectionEnabled: boolean;
  rowCount: number;
  colCount: number;
  rows: AdminSeatMapRowResponse[];
  total: number;
  remaining: number;
}

/** 배치 저장 칸 — VOID 는 보내지 않는다(보내지 않은 칸 = VOID) */
export interface SeatMapCellRequest {
  rowIndex: number;
  colIndex: number;
  kind: 'SEAT' | 'AISLE';
  rowLabel?: string;
  seatNumber?: number;
}

/** `PUT /admin/shows/{id}/seat-map` 통째 교체(행 1~40 · 열 1~60). 예매된 좌석을 지우거나 바꾸면 409 SEAT_004 */
export interface SaveSeatMapRequest {
  rowCount: number;
  colCount: number;
  cells: SeatMapCellRequest[];
}

/** `PUT /admin/reservations/{id}/seats` — 개수 = 매수 */
export interface ReplaceReservationSeatsRequest {
  seatIds: string[];
  version: number;
}

// ─── 예매(FN-33·34) ─────────────────────────────────────────────────

export interface ReservationListQuery {
  /** 지휘자 추가 요청(2026-11-20): q 가 있으면 생략 가능 — 모든 공연에서 찾는다(헤더 빠른 검색) */
  performanceId?: string;
  showId?: string;
  status?: ReservationStatus;
  deadlinePassed?: boolean;
  /** U41 §22.1 — 초대한 사람 구분 · 초대한 배우 단원 id */
  inviterKind?: InviterCategory;
  inviterMemberId?: string;
  /** 이름 포함 · 연락처 숫자 포함 · code 일치 */
  q?: string;
  page?: number;
  size?: number;
}

export interface AdminReservationItemResponse {
  id: string;
  /**
   * 지휘자 승인 계약 변경(2026-11-20 "예매번호로 찾기") — 서버 AdminReservationItemResponseDto 가 모든 응답에
   * 항상 준다(back-end §14.4 #1, integration 실측). 공연을 가로질러 찾을 때 공연명 표시용.
   */
  performanceId: string;
  performanceTitle: string;
  code: string;
  showId: string;
  showDate: string;
  startTime: string;
  /** 줄 수량 합 */
  quantity: number;
  /** 줄 금액 합 또는 관리자가 덮어쓴 금액(0 이상) */
  amount: number;
  /** 등급별 줄(develop §11.10) */
  items: ReservationLineResponse[];
  tierTokenUsed: boolean;
  amountOverridden: boolean;
  bookerName: string;
  /** 관리자 등록이면 null 가능 */
  bookerPhone: string | null;
  depositorName: string | null;
  /** U41 — 초대한 사람(구분 없는 옛 예매는 단원이 있으면 MEMBER, 없으면 null) */
  inviter: ReservationInviterResponse | null;
  /** U41 — 적용 가격(1매 단가, 줄이 1개일 때만 — 여러 줄·직접 입력은 null) */
  appliedPrice: number | null;
  inviterNote: string | null;
  /** U41 — MEMBER · STAFF_RELATED · SAM_RELATED · null(기존·초대 없음) */
  inviterCategory: InviterCategory | null;
  /** U35 — 좌석(좌석 미정·꺼짐이면 []) */
  seats: ReservationSeatResponse[];
  status: ReservationStatus;
  /** ADMIN = '관리자 등록' 표시 */
  source: ReservationSource;
  depositDueAt: string | null;
  /** 입금 기한이 없으면 항상 false */
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

/** 수동 등록(develop §11.10 보강 — 무료·특별 초대도 여기로). items·customLine 중 하나 이상(RSV_012) */
export interface ManualReservationRequest {
  showId: string;
  /** 1~50 */
  bookerName: string;
  /** 선택 */
  bookerPhone?: string | null;
  items?: ReservationTierLineRequest[];
  customLine?: ReservationCustomLineRequest | null;
  /** 0 이상 — 있으면 총액을 이 값으로 */
  amountOverride?: number | null;
  status: 'PENDING' | 'CONFIRMED';
  /** ≤500 */
  memo?: string | null;
  /** U41 — 초대한 사람(관리자는 모든 배우 단원) */
  inviter?: ReservationInviterRequest | null;
  /** U35 — 선택(비우면 좌석 미정, J-104). 보내면 개수 = 합계 매수 */
  seatIds?: string[];
  /** 0~매수, CONFIRMED 일 때만 */
  admitNow?: number;
}

/** `PUT /admin/reservations/{id}/items` — 줄 통째 교체(같은 등급 줄은 옛 가격 스냅숏 유지, J-77). 상태는 안 바뀜 */
export interface ReservationItemsRequest {
  items?: ReservationTierLineRequest[];
  customLine?: ReservationCustomLineRequest | null;
  amountOverride?: number | null;
  version: number;
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
  /** 회차 × 등급(직접 입력 줄은 tierId null) */
  byTier: ReservationSummaryTierQty[];
}

export interface ReservationSummaryTierQty {
  tierId: string | null;
  tierName: string;
  pendingQty: number;
  confirmedQty: number;
}

export interface ReservationSummaryTierRow extends ReservationSummaryTierQty {
  confirmedAmount: number;
}

/** 집계 초대 묶음 종류(U41) — 옛 예매(직접 입력·초대 없음)는 LEGACY */
export type SummaryInviterKind = InviterCategory | 'LEGACY';

export interface ReservationSummaryInviterRow {
  kind: SummaryInviterKind;
  memberId: string | null;
  /** null = 초대 없음(memberId 도 null) — inviterNote 는 '직접 입력' 한 묶음 */
  name: string | null;
  pendingQty: number;
  confirmedQty: number;
}

export interface ReservationSummaryBoardResponse {
  shows: ReservationSummaryShowRow[];
  /** 공연 합계 등급별 */
  tiers: ReservationSummaryTierRow[];
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

/** 입장 명단의 등급 줄 — 입장 인원은 예매 단위로만 센다(J-75) */
export interface AdmissionLineResponse {
  tierName: string;
  quantity: number;
  isCustom: boolean;
  /** LINK_ONLY = 할인 등급 info Label, 직접 입력 줄은 null(지휘자 확정 2026-11-20 — back-end 가 추가) */
  visibility: PriceTierVisibility | null;
}

export interface AdmissionItemResponse {
  id: string;
  code: string;
  bookerName: string;
  /** 관리자 등록에 연락처가 없으면 null */
  phoneLast4: string | null;
  quantity: number;
  items: AdmissionLineResponse[];
  source: ReservationSource;
  admittedCount: number;
  status: 'PENDING' | 'CONFIRMED';
  amount: number;
  deadlinePassed: boolean;
  memo: string | null;
  version: number;
  /** U35 — 좌석(좌석 미정·꺼짐이면 []) */
  seats: ReservationSeatResponse[];
  /** U41 — 초대한 사람 · 적용 가격 */
  inviter: ReservationInviterResponse | null;
  appliedPrice: number | null;
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
   * 서버가 항상 배열로 준다(최대 5건 — back-end.md §14.4). 대시보드는 보조 조회하지 않는다.
   */
  otherShowMatches: AdmissionOtherShowMatch[];
}

/** 다른 회차 같은 예매번호 — 서버 AdmissionOtherShowMatchItemDto 그대로(code 없음 — 검색어가 곧 번호, 공연명은 다른 공연일 수 있어 줌) */
export interface AdmissionOtherShowMatch {
  reservationId: string;
  showId: string;
  performanceTitle: string;
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
