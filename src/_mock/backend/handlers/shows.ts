// ----------------------------------------------------------------------
// 목 회차·예매 설정(FN-28·29) — develop §11.4. SHW_002 같은 날짜·시각 · SHW_003 좌석 < 예매 · SHW_004 예매 있는 회차 삭제.
// ----------------------------------------------------------------------
import {
  byShowTime,
  findPerformanceAlive,
  findShow,
  showCounts,
  toAdminShowItem,
  toPolicyResponse,
} from '@/src/_mock/backend/booking-model';
import {
  apiError,
  json,
  newId,
  noContent,
  nowIso,
  validationError,
  type MockContext,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { getStore, type MockShow } from '@/src/_mock/backend/mock-store';
import type {
  BookingPolicyUpsertRequest,
  ShowStatus,
} from '@/src/types/booking';
import { todayKst } from '@/src/utils/kst-date-format';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const SHOW_STATUSES: ShowStatus[] = ['UPCOMING', 'BOOKING_OPEN', 'COMPLETED'];

const PERF_NOT_FOUND = '작품 정보를 찾을 수 없습니다.';
const SHOW_NOT_FOUND = '회차를 찾을 수 없습니다.';

function intOrNull(
  value: unknown,
  min: number,
  max: number
): number | null | 'invalid' {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value)) return 'invalid';
  return value < min || value > max ? 'invalid' : value;
}

function textOrNull(value: unknown, max: number): string | null | 'invalid' {
  if (value === null) return null;
  if (typeof value !== 'string') return 'invalid';
  const trimmed = value.trim();
  if (trimmed.length > max) return 'invalid';
  return trimmed === '' ? null : trimmed;
}

/** 본문의 있는 키만 읽어 회차 필드로(PATCH 부분 수정 겸용) */
function readShowPatch(
  ctx: MockContext,
  body: Record<string, unknown>
): Partial<MockShow> | Response {
  const out: Partial<MockShow> = {};
  if ('showDate' in body) {
    if (typeof body.showDate !== 'string' || !DATE.test(body.showDate))
      return validationError(ctx);
    out.showDate = body.showDate;
  }
  if ('startTime' in body) {
    if (typeof body.startTime !== 'string' || !TIME.test(body.startTime))
      return validationError(ctx);
    out.startTime = body.startTime;
  }
  if ('endTime' in body) {
    if (
      body.endTime !== null &&
      (typeof body.endTime !== 'string' || !TIME.test(body.endTime))
    )
      return validationError(ctx);
    out.endTime = (body.endTime as string | null) ?? null;
  }
  if ('venue' in body) {
    const venue = textOrNull(body.venue, 200);
    if (venue === 'invalid') return validationError(ctx);
    out.venue = venue;
  }
  if ('classId' in body) {
    if (body.classId !== null && typeof body.classId !== 'string')
      return validationError(ctx);
    out.classId = (body.classId as string | null) || null;
  }
  if ('totalSeats' in body) {
    const seats = intOrNull(body.totalSeats, 0, 10000);
    if (seats === 'invalid') return validationError(ctx);
    out.totalSeats = seats;
  }
  if ('bookingOpenAt' in body) {
    if (
      body.bookingOpenAt !== null &&
      (typeof body.bookingOpenAt !== 'string' ||
        Number.isNaN(new Date(body.bookingOpenAt).getTime()))
    )
      return validationError(ctx);
    out.bookingOpenAt = body.bookingOpenAt
      ? new Date(body.bookingOpenAt as string).toISOString()
      : null;
  }
  if ('bookingEnabled' in body) {
    if (typeof body.bookingEnabled !== 'boolean') return validationError(ctx);
    out.bookingEnabled = body.bookingEnabled;
  }
  if ('status' in body) {
    if (!SHOW_STATUSES.includes(body.status as ShowStatus))
      return validationError(ctx);
    out.status = body.status as ShowStatus;
  }
  return out;
}

function checkClass(ctx: MockContext, classId: string | null | undefined) {
  if (!classId) return null;
  return getStore().classes.some((c) => c.id === classId)
    ? null
    : apiError(ctx, 404, 'CLS_001', '운영반 정보를 찾을 수 없습니다.');
}

function isDuplicate(
  show: Pick<MockShow, 'performanceId' | 'showDate' | 'startTime'>,
  exceptId?: string
) {
  return getStore().shows.some(
    (s) =>
      s.id !== exceptId &&
      s.performanceId === show.performanceId &&
      s.showDate === show.showDate &&
      s.startTime === show.startTime
  );
}

function duplicateError(ctx: MockContext) {
  return apiError(
    ctx,
    409,
    'SHW_002',
    '같은 날짜·시각의 회차가 이미 있습니다.'
  );
}

function readPolicy(
  ctx: MockContext,
  body: Record<string, unknown>
): BookingPolicyUpsertRequest | Response {
  const bank = textOrNull(body.depositBank ?? null, 30);
  const number = textOrNull(body.depositAccountNumber ?? null, 30);
  const holder = textOrNull(body.depositAccountHolder ?? null, 30);
  const max = intOrNull(body.maxTicketsPerBooking ?? null, 1, 20);
  const hours = intOrNull(body.depositDeadlineHours ?? null, 1, 168);
  const refund = textOrNull(body.refundPolicyText ?? null, 2000);
  // 문의처(develop §11.10 추가): ≤200, http 로 시작하면 https:// 만
  const inquiry = textOrNull(body.inquiryContact ?? null, 200);
  if (
    inquiry === 'invalid' ||
    (typeof inquiry === 'string' &&
      /^http/i.test(inquiry) &&
      !/^https:\/\//i.test(inquiry))
  )
    return validationError(ctx);
  if (
    [bank, number, holder, max, hours, refund].includes('invalid') ||
    (typeof number === 'string' && !/^[0-9-]{6,30}$/.test(number))
  )
    return validationError(ctx);
  return {
    depositBank: bank as string | null,
    depositAccountNumber: number as string | null,
    depositAccountHolder: holder as string | null,
    maxTicketsPerBooking: max as number | null,
    depositDeadlineHours: hours as number | null,
    refundPolicyText: refund as string | null,
    inquiryContact: inquiry,
  };
}

export const showRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/booking-policy$/,
    auth: true,
    handle: (ctx) =>
      findPerformanceAlive(ctx.params.id)
        ? json(toPolicyResponse(ctx.params.id))
        : apiError(ctx, 404, 'PERF_001', PERF_NOT_FOUND),
  },
  {
    method: 'PUT',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/booking-policy$/,
    auth: true,
    handle: (ctx) => {
      if (!findPerformanceAlive(ctx.params.id))
        return apiError(ctx, 404, 'PERF_001', PERF_NOT_FOUND);
      const policy = readPolicy(ctx, ctx.body);
      if (policy instanceof Response) return policy;
      getStore().bookingPolicies.set(ctx.params.id, policy);
      return json(toPolicyResponse(ctx.params.id));
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/shows$/,
    auth: true,
    handle: (ctx) => {
      if (!findPerformanceAlive(ctx.params.id))
        return apiError(ctx, 404, 'PERF_001', PERF_NOT_FOUND);
      const items = getStore()
        .shows.filter((s) => s.performanceId === ctx.params.id)
        .sort(byShowTime)
        .map(toAdminShowItem);
      return json({ items });
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/shows$/,
    auth: true,
    handle: (ctx) => {
      if (!findPerformanceAlive(ctx.params.id))
        return apiError(ctx, 404, 'PERF_001', PERF_NOT_FOUND);
      if (!('showDate' in ctx.body) || !('startTime' in ctx.body))
        return validationError(ctx);
      const read = readShowPatch(ctx, ctx.body);
      if (read instanceof Response) return read;
      const classError = checkClass(ctx, read.classId);
      if (classError) return classError;
      const show: MockShow = {
        id: newId(),
        performanceId: ctx.params.id,
        classId: null,
        showDate: '',
        startTime: '',
        endTime: null,
        venue: null,
        status: 'UPCOMING',
        bookingEnabled: true,
        bookingOpenAt: null,
        totalSeats: null,
        createdAt: nowIso(),
        ...read,
      };
      if (isDuplicate(show)) return duplicateError(ctx);
      getStore().shows.push(show);
      return json(toAdminShowItem(show), 201);
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/shows$/,
    auth: true,
    handle: (ctx) => {
      const from = ctx.query.get('from') || todayKst();
      if (!DATE.test(from)) return validationError(ctx);
      const items = getStore()
        .shows.filter((s) => s.showDate >= from)
        .filter((s) => findPerformanceAlive(s.performanceId))
        .sort(byShowTime)
        .map((s) => ({
          ...toAdminShowItem(s),
          performanceTitle: findPerformanceAlive(s.performanceId)?.title ?? '',
          // 계약 밖(계약 변경 요청) — 입장 체크 현장 등록이 등급을 불러오려고
          performanceId: s.performanceId,
        }));
      return json({ items });
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/shows\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const show = findShow(ctx.params.id);
      if (!show) return apiError(ctx, 404, 'SHW_001', SHOW_NOT_FOUND);
      const read = readShowPatch(ctx, ctx.body);
      if (read instanceof Response) return read;
      const classError = checkClass(ctx, read.classId);
      if (classError) return classError;
      const next = { ...show, ...read };
      if (isDuplicate(next, show.id)) return duplicateError(ctx);
      const { pendingQty, confirmedQty } = showCounts(show);
      const booked = pendingQty + confirmedQty;
      if (next.totalSeats !== null && next.totalSeats < booked)
        return apiError(
          ctx,
          409,
          'SHW_003',
          `좌석 수를 이미 예매된 ${booked}석보다 적게 줄일 수 없습니다.`
        );
      Object.assign(show, read);
      return json(toAdminShowItem(show));
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/shows\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const store = getStore();
      const show = findShow(ctx.params.id);
      if (!show) return apiError(ctx, 404, 'SHW_001', SHOW_NOT_FOUND);
      if (store.reservations.some((r) => r.showId === show.id))
        return apiError(
          ctx,
          409,
          'SHW_004',
          '예매가 있는 회차는 삭제할 수 없습니다.'
        );
      store.shows = store.shows.filter((s) => s.id !== show.id);
      return noContent();
    },
  },
];
