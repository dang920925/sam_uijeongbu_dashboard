// ----------------------------------------------------------------------
// 목 예매 관리(FN-33·34) — develop §11.4 상태 전이·오류(RSV_003·007·008·009).
// 지휘자 추가 요청(2026-11-20): q 가 있으면 performanceId 없이 모든 공연에서 찾는다(헤더 빠른 검색).
// 목 전용 `POST /v1/__mock/booking/reservation` — 공개 예매(홈페이지)가 만든 것 같은 ONLINE 예매 픽스처
// (입금 기한·상태·입장 인원을 정해 만든다 — 기한 지남·입장 상태 E2E 용).
// ----------------------------------------------------------------------
import {
  byShowTime,
  depositDueAtOf,
  depositorNameOf,
  findPerformanceAlive,
  findReservation,
  findShow,
  isDeadlinePassed,
  newReservationCode,
  PHONE_PATTERN,
  showCounts,
  toAdminReservationItem,
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
import { getStore, type MockReservation } from '@/src/_mock/backend/mock-store';
import type { CancelReason, ReservationStatus } from '@/src/types/booking';

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
    `남은 좌석이 부족합니다. (남은 좌석 ${remaining}석)`
  );
}

/** 이름 포함 · 연락처 숫자 포함 · code 일치(develop §11.4) */
export function matchesQuery(r: MockReservation, q: string): boolean {
  const trimmed = q.trim();
  if (!trimmed) return true;
  const digits = trimmed.replace(/\D/g, '');
  return (
    r.bookerName.includes(trimmed) ||
    r.code === trimmed ||
    (digits.length > 0 &&
      digits === trimmed.replace(/[\s-]/g, '') &&
      r.bookerPhone.replace(/\D/g, '').includes(digits))
  );
}

/** 접수 시각 desc, 같으면 id desc */
function byCreated(a: MockReservation, b: MockReservation) {
  return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
}

/** 버전 확인 → 대상 + 다음 버전. 실패면 Response */
function withVersion(ctx: MockContext): MockReservation | Response {
  const r = findReservation(ctx.params.id);
  if (!r) return apiError(ctx, 404, 'COMMON_002', NOT_FOUND);
  if (ctx.body.version !== r.version) return staleVersionError(ctx);
  return r;
}

function bump(r: MockReservation, patch: Partial<MockReservation>) {
  Object.assign(r, patch, { version: r.version + 1 });
}

interface CreateInput {
  showId: unknown;
  quantity: unknown;
  bookerName: unknown;
  bookerPhone: unknown;
}

/** 수동 등록·목 픽스처 공용 검증 → 회차. 실패면 Response */
function readCreate(ctx: MockContext, input: CreateInput) {
  const show =
    typeof input.showId === 'string' ? findShow(input.showId) : undefined;
  if (!show) return apiError(ctx, 404, 'SHW_001', '회차를 찾을 수 없습니다.');
  const quantity = input.quantity;
  const name = str(input.bookerName)?.trim() ?? '';
  const phone = str(input.bookerPhone)?.trim() ?? '';
  if (
    typeof quantity !== 'number' ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 20
  )
    return validationError(ctx);
  if (name.length < 1 || name.length > 50)
    return validationError(ctx, '이름을 입력해주세요');
  if (!PHONE_PATTERN.test(phone))
    return validationError(ctx, '올바른 연락처 형식이 아닙니다.');
  const { remainingSeats } = showCounts(show);
  if (remainingSeats !== null && remainingSeats < quantity)
    return seatsError(ctx, Math.max(remainingSeats, 0));
  return { show, quantity, name, phone };
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
      const rows = getStore()
        .reservations.filter(
          (r) => !performanceId || r.performanceId === performanceId
        )
        .filter((r) => findPerformanceAlive(r.performanceId))
        .filter((r) => !showId || r.showId === showId)
        .filter((r) => !status || r.status === status)
        .filter((r) => !overdueOnly || isDeadlinePassed(r))
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
          };
        });
      const live = store.reservations.filter(
        (r) => r.performanceId === performanceId && r.status !== 'CANCELLED'
      );
      const groups = new Map<
        string,
        {
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
        const key = member ? member.id : r.inviterNote ? '__note' : '__none';
        const group = groups.get(key) ?? {
          memberId: member?.id ?? null,
          // 직접 입력(inviterNote) 묶음은 memberId null + name '직접 입력' — 목 가정(계약 주석 해석, 확인 필요)
          name: member ? member.name : r.inviterNote ? '직접 입력' : null,
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
      const read = readCreate(ctx, ctx.body as unknown as CreateInput);
      if (read instanceof Response) return read;
      const { show, quantity, name, phone } = read;
      const confirmNow = ctx.body.confirmNow === true;
      const admitNow =
        confirmNow && typeof ctx.body.admitNow === 'number'
          ? ctx.body.admitNow
          : 0;
      if (!Number.isInteger(admitNow) || admitNow < 0 || admitNow > quantity)
        return validationError(ctx);
      const inviterMemberId = str(ctx.body.inviterMemberId) || null;
      const memo = str(ctx.body.memo)?.trim() || null;
      if (memo && memo.length > 500) return validationError(ctx);
      const now = Date.now();
      const code = newReservationCode(show.performanceId);
      const unitPrice = show.price ?? 0;
      const created: MockReservation = {
        id: newId(),
        performanceId: show.performanceId,
        showId: show.id,
        code,
        quantity,
        unitPrice,
        amount: unitPrice * quantity,
        bookerName: name,
        bookerPhone: phone,
        depositorName: depositorNameOf(name, code),
        inviterMemberId,
        inviterNote: null,
        status: confirmNow ? 'CONFIRMED' : 'PENDING',
        source: 'ADMIN',
        depositDueAt: depositDueAtOf(show, now),
        confirmedAt: confirmNow ? nowIso() : null,
        confirmedBy: confirmNow ? 'MANUAL' : null,
        cancelledAt: null,
        cancelReason: null,
        memo,
        admittedCount: admitNow,
        version: 1,
        createdAt: nowIso(),
      };
      const store = getStore();
      store.reservations.push(created);
      if (admitNow > 0)
        store.admissionLogs.push({
          id: newId(),
          reservationId: created.id,
          delta: admitNow,
          admittedAfter: admitNow,
          createdAt: nowIso(),
        });
      return json(toAdminReservationItem(created), 201);
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
        return seatsError(ctx, Math.max(remaining, 0));
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
    // 목 전용 픽스처 — 본문 { showId, quantity, bookerName, bookerPhone, status?, depositDueAt?, admittedCount?,
    //   inviteCode?, inviterNote?, memo? }. 공개 예매처럼 ONLINE·접수 시각 지금. 좌석 검사는 한다.
    method: 'POST',
    pattern: /^\/v1\/__mock\/booking\/reservation$/,
    auth: false,
    handle: (ctx) => {
      const read = readCreate(ctx, ctx.body as unknown as CreateInput);
      if (read instanceof Response) return read;
      const { show, quantity, name, phone } = read;
      const store = getStore();
      const status = (str(ctx.body.status) ?? 'PENDING') as ReservationStatus;
      const code = str(ctx.body.code) ?? newReservationCode(show.performanceId);
      const inviteCode = str(ctx.body.inviteCode)?.toUpperCase() ?? null;
      const inviterMemberId = inviteCode
        ? ([...store.inviteCodes.entries()].find(
            ([, c]) => c === inviteCode
          )?.[0] ?? null)
        : null;
      const unitPrice = show.price ?? 0;
      const created: MockReservation = {
        id: newId(),
        performanceId: show.performanceId,
        showId: show.id,
        code,
        quantity,
        unitPrice,
        amount: unitPrice * quantity,
        bookerName: name,
        bookerPhone: phone,
        depositorName: depositorNameOf(name, code),
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
