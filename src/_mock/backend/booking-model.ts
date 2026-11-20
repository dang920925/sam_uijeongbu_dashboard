// ----------------------------------------------------------------------
// 목 예매 계산(U24 R1) — develop §11.3 state 규칙 · §11.4 응답 모양을 한 곳에서 만든다.
// 회차·예매·입장 핸들러가 같이 쓴다(좌석·집계가 서로 어긋나지 않게).
// 시각: 회차 시작 = `${showDate}T${startTime}:00+09:00`(KST), 나머지 datetime 은 UTC ISO.
// ----------------------------------------------------------------------
import {
  getStore,
  type MockReservation,
  type MockShow,
} from '@/src/_mock/backend/mock-store';
import type {
  AdminReservationItemResponse,
  AdminShowItemResponse,
  AdmissionItemResponse,
  AdmissionSummaryResponse,
  BookingPolicyResponse,
  BookingPolicyUpsertRequest,
  BookingShowState,
} from '@/src/types/booking';

export const SHOW_FIELDS_REQUIRED = [
  'price',
  'totalSeats',
  'bookingOpenAt',
] as const;
export const POLICY_FIELDS_REQUIRED = [
  'depositBank',
  'depositAccountNumber',
  'depositAccountHolder',
  'maxTicketsPerBooking',
  'depositDeadlineHours',
  'refundPolicyText',
] as const;

export const EMPTY_POLICY: BookingPolicyUpsertRequest = {
  depositBank: null,
  depositAccountNumber: null,
  depositAccountHolder: null,
  maxTicketsPerBooking: null,
  depositDeadlineHours: null,
  refundPolicyText: null,
};

export function findPerformanceAlive(id: string) {
  return getStore().performances.find(
    (p) => p.id === id && p.deletedAt === null
  );
}

export function findShow(id: string): MockShow | undefined {
  return getStore().shows.find((s) => s.id === id);
}

export function findReservation(id: string): MockReservation | undefined {
  return getStore().reservations.find((r) => r.id === id);
}

export function policyOf(performanceId: string): BookingPolicyUpsertRequest {
  return getStore().bookingPolicies.get(performanceId) ?? EMPTY_POLICY;
}

export function policyMissing(policy: BookingPolicyUpsertRequest): string[] {
  return POLICY_FIELDS_REQUIRED.filter((key) => policy[key] === null);
}

export function toPolicyResponse(performanceId: string): BookingPolicyResponse {
  const policy = policyOf(performanceId);
  return { performanceId, ...policy, missingFields: policyMissing(policy) };
}

export function showStartMs(show: Pick<MockShow, 'showDate' | 'startTime'>) {
  return new Date(`${show.showDate}T${show.startTime}:00+09:00`).getTime();
}

export function byShowTime(
  a: Pick<MockShow, 'showDate' | 'startTime'>,
  b: Pick<MockShow, 'showDate' | 'startTime'>
): number {
  return (
    a.showDate.localeCompare(b.showDate) ||
    a.startTime.localeCompare(b.startTime)
  );
}

function sumQty(rows: MockReservation[], status: MockReservation['status']) {
  return rows
    .filter((r) => r.status === status)
    .reduce((sum, r) => sum + r.quantity, 0);
}

export interface ShowCounts {
  pendingQty: number;
  confirmedQty: number;
  remainingSeats: number | null;
  admittedCount: number;
  confirmedAmount: number;
}

export function showCounts(show: MockShow): ShowCounts {
  const rows = getStore().reservations.filter((r) => r.showId === show.id);
  const pendingQty = sumQty(rows, 'PENDING');
  const confirmedQty = sumQty(rows, 'CONFIRMED');
  return {
    pendingQty,
    confirmedQty,
    remainingSeats:
      show.totalSeats === null
        ? null
        : show.totalSeats - pendingQty - confirmedQty,
    admittedCount: rows.reduce((sum, r) => sum + r.admittedCount, 0),
    confirmedAmount: rows
      .filter((r) => r.status === 'CONFIRMED')
      .reduce((sum, r) => sum + r.amount, 0),
  };
}

export function showMissing(show: MockShow): string[] {
  return [
    ...SHOW_FIELDS_REQUIRED.filter((key) => show[key] === null),
    ...policyMissing(policyOf(show.performanceId)),
  ];
}

/** develop §11.3 state 규칙(위에서 첫 해당) */
export function showState(
  show: MockShow,
  now: number = Date.now()
): BookingShowState {
  if (showMissing(show).length > 0) return 'NOT_READY';
  if (
    show.status === 'COMPLETED' ||
    !show.bookingEnabled ||
    now >= showStartMs(show)
  )
    return 'CLOSED';
  if (show.bookingOpenAt && now < new Date(show.bookingOpenAt).getTime())
    return 'NOT_YET';
  const { remainingSeats } = showCounts(show);
  if (remainingSeats !== null && remainingSeats <= 0) return 'SOLD_OUT';
  return 'OPEN';
}

export function toAdminShowItem(show: MockShow): AdminShowItemResponse {
  const counts = showCounts(show);
  return {
    id: show.id,
    classId: show.classId,
    showDate: show.showDate,
    startTime: show.startTime,
    endTime: show.endTime,
    venue: show.venue,
    status: show.status,
    bookingEnabled: show.bookingEnabled,
    bookingOpenAt: show.bookingOpenAt,
    totalSeats: show.totalSeats,
    price: show.price,
    pendingQty: counts.pendingQty,
    confirmedQty: counts.confirmedQty,
    remainingSeats: counts.remainingSeats,
    admittedCount: counts.admittedCount,
    state: showState(show),
    missingFields: showMissing(show),
  };
}

export function isDeadlinePassed(
  r: MockReservation,
  now: number = Date.now()
): boolean {
  return r.status === 'PENDING' && new Date(r.depositDueAt).getTime() < now;
}

export function toAdminReservationItem(
  r: MockReservation
): AdminReservationItemResponse {
  const store = getStore();
  const show = findShow(r.showId);
  const member = r.inviterMemberId
    ? store.members.find((m) => m.id === r.inviterMemberId)
    : undefined;
  return {
    id: r.id,
    performanceId: r.performanceId,
    performanceTitle:
      store.performances.find((p) => p.id === r.performanceId)?.title ?? '',
    code: r.code,
    showId: r.showId,
    showDate: show?.showDate ?? '',
    startTime: show?.startTime ?? '',
    quantity: r.quantity,
    unitPrice: r.unitPrice,
    amount: r.amount,
    bookerName: r.bookerName,
    bookerPhone: r.bookerPhone,
    depositorName: r.depositorName,
    inviter: member ? { memberId: member.id, name: member.name } : null,
    inviterNote: r.inviterNote,
    status: r.status,
    source: r.source,
    depositDueAt: r.depositDueAt,
    deadlinePassed: isDeadlinePassed(r),
    confirmedAt: r.confirmedAt,
    confirmedBy: r.confirmedBy,
    cancelledAt: r.cancelledAt,
    cancelReason: r.cancelReason,
    memo: r.memo,
    admittedCount: r.admittedCount,
    version: r.version,
    createdAt: r.createdAt,
  };
}

export function toAdmissionItem(r: MockReservation): AdmissionItemResponse {
  return {
    id: r.id,
    code: r.code,
    bookerName: r.bookerName,
    phoneLast4: r.bookerPhone.replace(/\D/g, '').slice(-4),
    quantity: r.quantity,
    admittedCount: r.admittedCount,
    status: r.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING',
    amount: r.amount,
    deadlinePassed: isDeadlinePassed(r),
    memo: r.memo,
    version: r.version,
  };
}

export function admissionSummary(showId: string): AdmissionSummaryResponse {
  const rows = getStore().reservations.filter(
    (r) => r.showId === showId && r.status !== 'CANCELLED'
  );
  const confirmed = rows.filter((r) => r.status === 'CONFIRMED');
  const pending = rows.filter((r) => r.status === 'PENDING');
  const confirmedQty = confirmed.reduce((sum, r) => sum + r.quantity, 0);
  const admittedCount = confirmed.reduce((sum, r) => sum + r.admittedCount, 0);
  return {
    confirmedQty,
    admittedCount,
    notAdmittedQty: confirmedQty - admittedCount,
    pendingCount: pending.length,
    pendingQty: pending.reduce((sum, r) => sum + r.quantity, 0),
  };
}

/** 공연 안에서 안 쓴 4자리 무작위 번호(취소 포함 — J-35) */
export function newReservationCode(performanceId: string): string {
  const used = new Set(
    getStore()
      .reservations.filter((r) => r.performanceId === performanceId)
      .map((r) => r.code)
  );
  for (let i = 0; i < 200; i += 1) {
    const code = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    if (!used.has(code)) return code;
  }
  throw new Error('목 예매번호를 만들 수 없습니다.');
}

/** 입금자명 = 이름(공백 제거, 앞 3자) + code (J-28) */
export function depositorNameOf(name: string, code: string): string {
  return `${name.replace(/\s/g, '').slice(0, 3)}${code}`;
}

/** 입금 기한 = min(접수 + 기한 시간, 회차 시작) (J-43) — 기한 시간이 비면 회차 시작 */
export function depositDueAtOf(show: MockShow, now: number): string {
  const hours = policyOf(show.performanceId).depositDeadlineHours;
  const start = showStartMs(show);
  const due = hours === null ? start : Math.min(now + hours * 3_600_000, start);
  return new Date(due).toISOString();
}

export const PHONE_PATTERN = /^01[016789]-?\d{3,4}-?\d{4}$/;
