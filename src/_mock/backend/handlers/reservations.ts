// ----------------------------------------------------------------------
// 목 예매 관리(FN-33·34 + develop §11.10 가격 등급) — 상태 전이·오류(RSV_003·007·008·009·011·012).
// - 수동 등록: 등급 줄(items) · 직접 입력 줄(customLine) · 금액 덮어쓰기(amountOverride, 0 이상) · 상태 선택 ·
//   연락처 선택(없으면 입금 기한·입금자명 없음) · source ADMIN('관리자 등록').
// - `PUT /admin/reservations/{id}/items`: 줄 통째 교체 — 같은 등급 줄은 옛 가격 스냅숏 유지(J-77), 상태 그대로.
// - 지휘자 추가 요청(2026-11-20): q 가 있으면 performanceId 없이 모든 공연에서 찾는다(헤더 빠른 검색).
// - 목 전용 `POST /v1/__mock/booking/reservation` — 공개 예매(홈페이지)가 만든 것 같은 ONLINE 예매 픽스처.
// ----------------------------------------------------------------------
import {
  activeTiersOf,
  byShowTime,
  CUSTOM_LINE_LABEL,
  depositDueAtOf,
  depositorNameOf,
  findPerformanceAlive,
  findReservation,
  findShow,
  isDeadlinePassed,
  liveSeatHolders,
  newReservationCode,
  PHONE_PATTERN,
  showCounts,
  toAdminReservationItem,
  toMockInviter,
} from '@/src/_mock/backend/booking-model';
import {
  apiError,
  json,
  newId,
  nowIso,
  paginate,
  str,
  validationError,
  type MockContext,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import {
  getStore,
  type MockReservation,
  type MockShow,
} from '@/src/_mock/backend/mock-store';
import type {
  CancelReason,
  ReservationLineResponse,
  ReservationStatus,
} from '@/src/types/booking';

const NOT_FOUND = '예매를 찾을 수 없습니다.';
const CANCEL_REASONS: CancelReason[] = [
  'BOOKER_REQUEST',
  'ADMIN',
  'DEADLINE_PASSED',
];

export function staleVersionError(ctx: MockContext) {
  return apiError(
    ctx,
    409,
    'RSV_007',
    '다른 곳에서 먼저 바뀌었습니다. 새로고침 후 다시 시도해주세요.'
  );
}
export function invalidTransitionError(ctx: MockContext) {
  return apiError(
    ctx,
    409,
    'RSV_008',
    '지금 상태에서는 할 수 없는 처리입니다.'
  );
}
function admittedError(ctx: MockContext) {
  return apiError(
    ctx,
    409,
    'RSV_009',
    '입장한 인원이 있어 처리할 수 없습니다. 입장을 먼저 되돌려주세요.'
  );
}
function seatsError(ctx: MockContext, remaining: number) {
  return apiError(
    ctx,
    409,
    'RSV_003',
    `남은 좌석이 부족합니다. (남은 좌석 ${Math.max(remaining, 0)}석)`
  );
}
function linesError(ctx: MockContext) {
  return apiError(ctx, 400, 'RSV_012', '예매 매수를 확인해주세요.');
}
function tierError(ctx: MockContext) {
  return apiError(ctx, 400, 'RSV_011', '선택할 수 없는 가격 등급입니다.');
}

/** 이름 포함 · 연락처 숫자 포함(연락처가 있을 때만) · code 일치(develop §11.4) */
export function matchesQuery(r: MockReservation, q: string): boolean {
  const trimmed = q.trim();
  if (!trimmed) return true;
  const digits = trimmed.replace(/\D/g, '');
  return (
    r.bookerName.includes(trimmed) ||
    r.code === trimmed ||
    (r.bookerPhone !== null &&
      digits.length > 0 &&
      digits === trimmed.replace(/[\s-]/g, '') &&
      r.bookerPhone.replace(/\D/g, '').includes(digits))
  );
}

/** 접수 시각 desc, 같으면 id desc */
function byCreated(a: MockReservation, b: MockReservation) {
  return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
}

/** 버전 확인 → 대상. 실패면 Response */
function withVersion(ctx: MockContext): MockReservation | Response {
  const r = findReservation(ctx.params.id);
  if (!r) return apiError(ctx, 404, 'RSV_013', NOT_FOUND);
  if (ctx.body.version !== r.version) return staleVersionError(ctx);
  return r;
}

function bump(r: MockReservation, patch: Partial<MockReservation>) {
  Object.assign(r, patch, { version: r.version + 1 });
}

function isQty(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 20
  );
}

/**
 * 본문의 items·customLine → 등급 줄. 같은 등급이 이미 있던 줄은 previous 의 가격 스냅숏을 쓴다(J-77).
 * 잘못이면 Response(RSV_012 줄 없음·중복 · RSV_011 쓸 수 없는 등급 · COMMON_001 범위).
 */
function readLines(
  ctx: MockContext,
  show: MockShow,
  previous: ReservationLineResponse[] = []
): ReservationLineResponse[] | Response {
  const rawItems = ctx.body.items ?? [];
  const rawCustom = ctx.body.customLine ?? null;
  if (!Array.isArray(rawItems)) return validationError(ctx);
  const lines: ReservationLineResponse[] = [];
  const seen = new Set<string>();
  const tiers = activeTiersOf(show.performanceId);
  for (const raw of rawItems as Record<string, unknown>[]) {
    const tierId = str(raw?.tierId);
    if (!tierId || seen.has(tierId)) return linesError(ctx);
    seen.add(tierId);
    if (!isQty(raw.quantity)) return validationError(ctx);
    const old = previous.find((line) => line.tierId === tierId);
    const tier = tiers.find((t) => t.id === tierId);
    if (!old && !tier) return tierError(ctx);
    const unitPrice = old?.unitPrice ?? tier?.price ?? 0;
    lines.push({
      tierId,
      tierName: old?.tierName ?? tier?.name ?? '',
      unitPrice,
      quantity: raw.quantity,
      lineAmount: unitPrice * raw.quantity,
      isCustom: false,
      visibility: old?.visibility ?? tier?.visibility ?? null,
    });
  }
  if (rawCustom !== null) {
    if (typeof rawCustom !== 'object') return validationError(ctx);
    const custom = rawCustom as Record<string, unknown>;
    const label = str(custom.label)?.trim() || CUSTOM_LINE_LABEL;
    const amount = custom.amount;
    if (
      label.length > 30 ||
      !isQty(custom.quantity) ||
      typeof amount !== 'number' ||
      !Number.isInteger(amount) ||
      amount < 0
    )
      return validationError(ctx);
    lines.push({
      tierId: null,
      tierName: label,
      // 직접 입력 줄은 서버처럼 단가 null, 줄 금액만(back-end §14.4 #6 — integration 2026-11-20 정합)
      unitPrice: null,
      quantity: custom.quantity,
      lineAmount: amount,
      isCustom: true,
      visibility: null,
    });
  }
  const total = lines.reduce((sum, line) => sum + line.quantity, 0);
  if (lines.length === 0 || total > 20) return linesError(ctx);
  return lines;
}

/** amountOverride → 금액(없으면 줄 합). 잘못이면 Response */
function readAmount(
  ctx: MockContext,
  lines: ReservationLineResponse[]
): { amount: number; amountOverridden: boolean } | Response {
  const override = ctx.body.amountOverride ?? null;
  if (override === null)
    return {
      amount: lines.reduce((sum, line) => sum + line.lineAmount, 0),
      amountOverridden: false,
    };
  if (
    typeof override !== 'number' ||
    !Number.isInteger(override) ||
    override < 0
  )
    return validationError(ctx);
  return { amount: override, amountOverridden: true };
}

function sumQty(lines: ReservationLineResponse[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

function readBooker(ctx: MockContext, phoneRequired: boolean) {
  const name = str(ctx.body.bookerName)?.trim() ?? '';
  const raw = str(ctx.body.bookerPhone)?.trim() || null;
  // 서버는 숫자만 저장·응답한다(back-end.md §14.4)
  const phone = raw === null ? null : raw.replace(/\D/g, '');
  if (name.length < 1 || name.length > 50)
    return validationError(ctx, '이름을 입력해주세요');
  if ((phoneRequired || raw !== null) && !PHONE_PATTERN.test(raw ?? ''))
    return validationError(ctx, '올바른 연락처 형식이 아닙니다.');
  return { name, phone };
}

/** U35 수동 등록 좌석(선택) — 비우면 좌석 미정. 개수·칸 400 SEAT_002, 잡힌 좌석 409 SEAT_001 */
function readSeatIds(
  ctx: MockContext,
  showId: string,
  quantity: number
): string[] | Response {
  const raw = ctx.body.seatIds;
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.some((id) => typeof id !== 'string'))
    return apiError(ctx, 400, 'SEAT_002', '선택할 수 없는 좌석입니다.');
  const ids = raw as string[];
  if (ids.length === 0) return [];
  if (ids.length !== quantity || new Set(ids).size !== ids.length)
    return apiError(ctx, 400, 'SEAT_002', '좌석 수와 매수가 맞지 않습니다.');
  const layout = getStore().seatLayouts.get(showId);
  const seats = new Set(
    (layout?.cells ?? []).filter((c) => c.kind === 'SEAT').map((c) => c.id)
  );
  if (ids.some((id) => !seats.has(id)))
    return apiError(ctx, 400, 'SEAT_002', '선택할 수 없는 좌석입니다.');
  const holders = liveSeatHolders(showId);
  const clashes = ids.filter((id) => holders.has(id));
  if (clashes.length > 0)
    return json(
      {
        statusCode: 409,
        status: 'Conflict',
        message: '다른 분이 먼저 선택한 좌석입니다.',
        code: 'SEAT_001',
        seatIds: clashes,
        timestamp: new Date().toISOString(),
        path: `/api${ctx.req.path}`,
      },
      409
    );
  return ids;
}

function findShowOr404(ctx: MockContext): MockShow | Response {
  const showId = str(ctx.body.showId);
  const show = showId ? findShow(showId) : undefined;
  return show ?? apiError(ctx, 404, 'SHW_001', '회차를 찾을 수 없습니다.');
}

function pushAdmission(r: MockReservation, admitted: number) {
  if (admitted <= 0) return;
  getStore().admissionLogs.push({
    id: newId(),
    reservationId: r.id,
    delta: admitted,
    admittedAfter: admitted,
    createdAt: nowIso(),
  });
}

export const reservationRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/reservations$/,
    auth: true,
    handle: (ctx) => {
      const performanceId = ctx.query.get('performanceId');
      const q = ctx.query.get('q') ?? '';
      if (!performanceId && !q.trim()) return validationError(ctx);
      const showId = ctx.query.get('showId');
      const status = ctx.query.get('status') as ReservationStatus | null;
      const overdueOnly = ctx.query.get('deadlinePassed') === 'true';
      // U41 §22.1 — 초대한 사람 필터
      const inviterKind = ctx.query.get('inviterKind');
      const inviterMemberId = ctx.query.get('inviterMemberId');
      if (
        inviterKind &&
        !['MEMBER', 'STAFF_RELATED', 'SAM_RELATED'].includes(inviterKind)
      )
        return validationError(ctx);
      const rows = getStore()
        .reservations.filter(
          (r) => !performanceId || r.performanceId === performanceId
        )
        .filter((r) => findPerformanceAlive(r.performanceId))
        .filter((r) => !showId || r.showId === showId)
        .filter((r) => !status || r.status === status)
        .filter((r) => !overdueOnly || isDeadlinePassed(r))
        .filter((r) => !inviterKind || toMockInviter(r)?.kind === inviterKind)
        .filter(
          (r) => !inviterMemberId || r.inviterMemberId === inviterMemberId
        )
        .filter((r) => matchesQuery(r, q))
        .sort(byCreated)
        .map(toAdminReservationItem);
      return json(paginate(rows, ctx.query));
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/reservations\/summary$/,
    auth: true,
    handle: (ctx) => {
      const performanceId = ctx.query.get('performanceId') ?? '';
      if (!findPerformanceAlive(performanceId))
        return apiError(ctx, 404, 'PERF_001', '작품 정보를 찾을 수 없습니다.');
      const store = getStore();
      const live = store.reservations.filter(
        (r) => r.performanceId === performanceId && r.status !== 'CANCELLED'
      );
      /** 등급(직접 입력 줄은 한 묶음)별 매수·확정 금액 */
      const tierRows = (rows: MockReservation[]) => {
        const map = new Map<
          string,
          {
            tierId: string | null;
            tierName: string;
            pendingQty: number;
            confirmedQty: number;
            confirmedAmount: number;
          }
        >();
        for (const r of rows)
          for (const line of r.items) {
            const key = line.tierId ?? '__custom';
            const row = map.get(key) ?? {
              tierId: line.tierId,
              tierName: line.isCustom ? CUSTOM_LINE_LABEL : line.tierName,
              pendingQty: 0,
              confirmedQty: 0,
              confirmedAmount: 0,
            };
            if (r.status === 'PENDING') row.pendingQty += line.quantity;
            else {
              row.confirmedQty += line.quantity;
              // 금액 덮어쓰기 예매는 줄 금액이 아니라 총액 비율 — 목은 단순화해 줄 금액 합(확인 필요)
              row.confirmedAmount += r.amountOverridden ? 0 : line.lineAmount;
            }
            map.set(key, row);
          }
        return [...map.values()];
      };
      const shows = store.shows
        .filter((s) => s.performanceId === performanceId)
        .sort(byShowTime)
        .map((s) => {
          const c = showCounts(s);
          return {
            showId: s.id,
            showDate: s.showDate,
            startTime: s.startTime,
            totalSeats: s.totalSeats,
            pendingQty: c.pendingQty,
            confirmedQty: c.confirmedQty,
            remainingSeats: c.remainingSeats,
            confirmedAmount: c.confirmedAmount,
            admittedCount: c.admittedCount,
            byTier: tierRows(live.filter((r) => r.showId === s.id)).map(
              ({ confirmedAmount: _amount, ...row }) => row
            ),
          };
        });
      const groups = new Map<
        string,
        {
          kind: 'MEMBER' | 'STAFF_RELATED' | 'SAM_RELATED' | 'LEGACY';
          memberId: string | null;
          name: string | null;
          pendingQty: number;
          confirmedQty: number;
        }
      >();
      for (const r of live) {
        const member = r.inviterMemberId
          ? store.members.find((m) => m.id === r.inviterMemberId)
          : undefined;
        const kind = toMockInviter(r)?.kind ?? null;
        const key = member
          ? member.id
          : kind === 'STAFF_RELATED'
            ? '__staff'
            : kind === 'SAM_RELATED'
              ? '__sam'
              : r.inviterNote
                ? '__note'
                : '__none';
        // U41 — 묶음 종류 kind(서버 reservation-summary.util 과 같은 이름)
        const group = groups.get(key) ?? {
          kind: member
            ? 'MEMBER'
            : kind === 'STAFF_RELATED' || kind === 'SAM_RELATED'
              ? kind
              : 'LEGACY',
          memberId: member?.id ?? null,
          name: member
            ? member.name
            : kind === 'STAFF_RELATED'
              ? '연출·스태프 관계자'
              : kind === 'SAM_RELATED'
                ? 'SAM 관계자'
                : r.inviterNote
                  ? '직접 입력'
                  : null,
          pendingQty: 0,
          confirmedQty: 0,
        };
        if (r.status === 'PENDING') group.pendingQty += r.quantity;
        else group.confirmedQty += r.quantity;
        groups.set(key, group);
      }
      const all = store.reservations.filter(
        (r) => r.performanceId === performanceId
      );
      const pending = all.filter((r) => r.status === 'PENDING');
      const confirmed = all.filter((r) => r.status === 'CONFIRMED');
      return json({
        shows,
        tiers: tierRows(live),
        inviters: [...groups.values()],
        totals: {
          pendingCount: pending.length,
          pendingQty: pending.reduce((n, r) => n + r.quantity, 0),
          confirmedQty: confirmed.reduce((n, r) => n + r.quantity, 0),
          confirmedAmount: confirmed.reduce((n, r) => n + r.amount, 0),
          overdueCount: pending.filter((r) => isDeadlinePassed(r)).length,
        },
      });
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/reservations$/,
    auth: true,
    handle: (ctx) => {
      const show = findShowOr404(ctx);
      if (show instanceof Response) return show;
      const booker = readBooker(ctx, false);
      if (booker instanceof Response) return booker;
      const status = ctx.body.status;
      if (status !== 'PENDING' && status !== 'CONFIRMED')
        return validationError(ctx);
      const lines = readLines(ctx, show);
      if (lines instanceof Response) return lines;
      const money = readAmount(ctx, lines);
      if (money instanceof Response) return money;
      const quantity = sumQty(lines);
      const admitNow =
        status === 'CONFIRMED' && typeof ctx.body.admitNow === 'number'
          ? ctx.body.admitNow
          : 0;
      if (!Number.isInteger(admitNow) || admitNow < 0 || admitNow > quantity)
        return validationError(ctx);
      const memo = str(ctx.body.memo)?.trim() || null;
      if (memo && memo.length > 500) return validationError(ctx);
      const { remainingSeats } = showCounts(show);
      if (remainingSeats !== null && remainingSeats < quantity)
        return seatsError(ctx, remainingSeats);
      // U35 좌석(선택) · U36 초대 구분
      const seatIds = readSeatIds(ctx, show.id, quantity);
      if (seatIds instanceof Response) return seatIds;
      // U41 — inviter { kind, memberId? }(예전 평면 필드도 받는다)
      const inviterBody = (ctx.body.inviter ?? null) as {
        kind?: unknown;
        memberId?: unknown;
      } | null;
      const inviterCategory = (
        inviterBody ? inviterBody.kind : ctx.body.inviterCategory
      ) as 'MEMBER' | 'STAFF_RELATED' | 'SAM_RELATED' | null | undefined;
      const inviterMemberIdIn =
        str(inviterBody ? inviterBody.memberId : ctx.body.inviterMemberId) ||
        null;
      if (
        inviterCategory &&
        !['MEMBER', 'STAFF_RELATED', 'SAM_RELATED'].includes(inviterCategory)
      )
        return validationError(ctx);
      if (inviterCategory && inviterCategory !== 'MEMBER' && inviterMemberIdIn)
        return validationError(ctx);
      const code = newReservationCode(show.performanceId);
      // 목 가정: 관리자 등록은 연락처가 있고 입금 대기일 때만 입금자명·기한을 둔다(정본은 back-end.md)
      const needsDeposit = status === 'PENDING' && booker.phone !== null;
      const created: MockReservation = {
        id: newId(),
        performanceId: show.performanceId,
        showId: show.id,
        code,
        quantity,
        amount: money.amount,
        items: lines,
        tierTokenUsed: false,
        amountOverridden: money.amountOverridden,
        bookerName: booker.name,
        bookerPhone: booker.phone,
        depositorName: needsDeposit ? depositorNameOf(booker.name, code) : null,
        inviterMemberId: inviterMemberIdIn,
        inviterNote: null,
        inviterCategory:
          inviterCategory ?? (inviterMemberIdIn ? 'MEMBER' : null),
        seatIds,
        status,
        source: 'ADMIN',
        depositDueAt: needsDeposit ? depositDueAtOf(show, Date.now()) : null,
        confirmedAt: status === 'CONFIRMED' ? nowIso() : null,
        confirmedBy: status === 'CONFIRMED' ? 'MANUAL' : null,
        cancelledAt: null,
        cancelReason: null,
        memo,
        admittedCount: admitNow,
        version: 1,
        createdAt: nowIso(),
      };
      getStore().reservations.push(created);
      pushAdmission(created, admitNow);
      return json(toAdminReservationItem(created), 201);
    },
  },
  {
    method: 'PUT',
    pattern: /^\/v1\/admin\/reservations\/(?<id>[^/]+)\/items$/,
    auth: true,
    handle: (ctx) => {
      const r = withVersion(ctx);
      if (r instanceof Response) return r;
      if (r.status === 'CANCELLED') return invalidTransitionError(ctx);
      const show = findShow(r.showId);
      if (!show)
        return apiError(ctx, 404, 'SHW_001', '회차를 찾을 수 없습니다.');
      const lines = readLines(ctx, show, r.items);
      if (lines instanceof Response) return lines;
      const money = readAmount(ctx, lines);
      if (money instanceof Response) return money;
      const quantity = sumQty(lines);
      if (quantity < r.admittedCount) return admittedError(ctx);
      const { remainingSeats } = showCounts(show);
      const added = quantity - r.quantity;
      if (added > 0 && remainingSeats !== null && remainingSeats < added)
        return seatsError(ctx, remainingSeats);
      bump(r, {
        items: lines,
        quantity,
        amount: money.amount,
        amountOverridden: money.amountOverridden,
      });
      return json(toAdminReservationItem(r));
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/reservations\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const r = withVersion(ctx);
      if (r instanceof Response) return r;
      const memo =
        ctx.body.memo === null ? null : (str(ctx.body.memo)?.trim() ?? null);
      if (memo && memo.length > 500) return validationError(ctx);
      bump(r, { memo: memo || null });
      return json(toAdminReservationItem(r));
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/reservations\/(?<id>[^/]+)\/confirm$/,
    auth: true,
    handle: (ctx) => {
      const r = withVersion(ctx);
      if (r instanceof Response) return r;
      if (r.status !== 'PENDING') return invalidTransitionError(ctx);
      bump(r, {
        status: 'CONFIRMED',
        confirmedAt: nowIso(),
        confirmedBy: 'MANUAL',
      });
      return json(toAdminReservationItem(r));
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/reservations\/(?<id>[^/]+)\/unconfirm$/,
    auth: true,
    handle: (ctx) => {
      const r = withVersion(ctx);
      if (r instanceof Response) return r;
      if (r.status !== 'CONFIRMED') return invalidTransitionError(ctx);
      if (r.admittedCount > 0) return admittedError(ctx);
      bump(r, { status: 'PENDING', confirmedAt: null, confirmedBy: null });
      return json(toAdminReservationItem(r));
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/reservations\/(?<id>[^/]+)\/cancel$/,
    auth: true,
    handle: (ctx) => {
      const r = withVersion(ctx);
      if (r instanceof Response) return r;
      const reason = ctx.body.reason as CancelReason;
      if (!CANCEL_REASONS.includes(reason)) return validationError(ctx);
      if (r.status === 'CANCELLED') return invalidTransitionError(ctx);
      if (r.admittedCount > 0) return admittedError(ctx);
      bump(r, {
        status: 'CANCELLED',
        cancelledAt: nowIso(),
        cancelReason: reason,
      });
      return json(toAdminReservationItem(r));
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/reservations\/(?<id>[^/]+)\/restore$/,
    auth: true,
    handle: (ctx) => {
      const r = withVersion(ctx);
      if (r instanceof Response) return r;
      if (r.status !== 'CANCELLED') return invalidTransitionError(ctx);
      const show = findShow(r.showId);
      const remaining = show ? showCounts(show).remainingSeats : null;
      if (remaining !== null && remaining < r.quantity)
        return seatsError(ctx, remaining);
      // U35 SE-2 — 되살릴 때 다른 예매가 그 좌석을 잡았으면 409 SEAT_001
      const holders = liveSeatHolders(r.showId);
      const clashes = (r.seatIds ?? []).filter((id) => holders.has(id));
      if (clashes.length > 0)
        return json(
          {
            statusCode: 409,
            status: 'Conflict',
            message: '다른 분이 먼저 선택한 좌석입니다.',
            code: 'SEAT_001',
            seatIds: clashes,
            timestamp: new Date().toISOString(),
            path: `/api${ctx.req.path}`,
          },
          409
        );
      bump(r, {
        status: 'PENDING',
        cancelledAt: null,
        cancelReason: null,
        confirmedAt: null,
        confirmedBy: null,
      });
      return json(toAdminReservationItem(r));
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/reservations\/cancel-overdue$/,
    auth: true,
    handle: (ctx) => {
      const performanceId = str(ctx.body.performanceId);
      if (!performanceId) return validationError(ctx);
      const showId = str(ctx.body.showId);
      const targets = getStore().reservations.filter(
        (r) =>
          r.performanceId === performanceId &&
          (!showId || r.showId === showId) &&
          isDeadlinePassed(r)
      );
      for (const r of targets)
        bump(r, {
          status: 'CANCELLED',
          cancelledAt: nowIso(),
          cancelReason: 'DEADLINE_PASSED',
        });
      return json({ cancelledCount: targets.length });
    },
  },
  {
    // 목 전용 픽스처(공개 예매 흉내 — ONLINE). 본문 { showId, bookerName, bookerPhone, items: [{tierId, quantity}],
    //   status?, depositDueAt?, admittedCount?, code?, inviteCode?, inviterMemberId?, inviterCategory?, inviterNote?, memo?, tierTokenUsed? }.
    // 좌석은 검사한다. 상태는 픽스처 편의로 고를 수 있다(공개 예매는 늘 PENDING).
    method: 'POST',
    pattern: /^\/v1\/__mock\/booking\/reservation$/,
    auth: false,
    handle: (ctx) => {
      const show = findShowOr404(ctx);
      if (show instanceof Response) return show;
      const booker = readBooker(ctx, true);
      if (booker instanceof Response) return booker;
      const lines = readLines(ctx, show);
      if (lines instanceof Response) return lines;
      const quantity = sumQty(lines);
      const { remainingSeats } = showCounts(show);
      if (remainingSeats !== null && remainingSeats < quantity)
        return seatsError(ctx, remainingSeats);
      const store = getStore();
      const status = (str(ctx.body.status) ?? 'PENDING') as ReservationStatus;
      const code = str(ctx.body.code) ?? newReservationCode(show.performanceId);
      const inviteCode = str(ctx.body.inviteCode)?.toUpperCase() ?? null;
      // U41 — 픽스처는 단원 id 를 바로 줄 수도 있다(inviterMemberId)
      const inviterMemberId =
        str(ctx.body.inviterMemberId) ??
        (inviteCode
          ? ([...store.inviteCodes.entries()].find(
              ([, c]) => c === inviteCode
            )?.[0] ?? null)
          : null);
      const created: MockReservation = {
        id: newId(),
        performanceId: show.performanceId,
        showId: show.id,
        code,
        quantity,
        amount: lines.reduce((sum, line) => sum + line.lineAmount, 0),
        items: lines,
        tierTokenUsed: ctx.body.tierTokenUsed === true,
        amountOverridden: false,
        bookerName: booker.name,
        bookerPhone: booker.phone,
        depositorName: depositorNameOf(booker.name, code),
        inviterMemberId,
        inviterNote: inviterMemberId
          ? null
          : (str(ctx.body.inviterNote) ?? null),
        status,
        source: 'ONLINE',
        depositDueAt:
          str(ctx.body.depositDueAt) ?? depositDueAtOf(show, Date.now()),
        confirmedAt: status === 'CONFIRMED' ? nowIso() : null,
        confirmedBy: status === 'CONFIRMED' ? 'MANUAL' : null,
        cancelledAt: status === 'CANCELLED' ? nowIso() : null,
        cancelReason: status === 'CANCELLED' ? 'ADMIN' : null,
        memo: str(ctx.body.memo) ?? null,
        seatIds: Array.isArray(ctx.body.seatIds)
          ? (ctx.body.seatIds as string[])
          : [],
        inviterCategory:
          ctx.body.inviterCategory === 'STAFF_RELATED' ||
          ctx.body.inviterCategory === 'SAM_RELATED'
            ? ctx.body.inviterCategory
            : inviterMemberId
              ? 'MEMBER'
              : null,
        admittedCount:
          status === 'CONFIRMED' && typeof ctx.body.admittedCount === 'number'
            ? ctx.body.admittedCount
            : 0,
        version: 1,
        createdAt: nowIso(),
      };
      store.reservations.push(created);
      return json(toAdminReservationItem(created), 201);
    },
  },
];
