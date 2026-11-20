// ----------------------------------------------------------------------
// 목 입장 체크(FN-36) — develop §11.4. 입장 증감은 서버의 "증분 UPDATE 한 문장"처럼 조건을 한 번에 검사한다:
// CONFIRMED 이고 0 ≤ 입장 + delta ≤ 매수일 때만 — 아니면 409 RSV_010(동시 사용 충돌 흉내).
// 지휘자 추가 요청(2026-11-20): q 가 예매번호(4자리)인데 이 회차에 없으면 otherShowMatches 로 다른 회차 예매를 준다.
// ----------------------------------------------------------------------
import {
  admissionSummary,
  findPerformanceAlive,
  findReservation,
  findShow,
  toAdmissionItem,
} from '@/src/_mock/backend/booking-model';
import {
  invalidTransitionError,
  staleVersionError,
} from '@/src/_mock/backend/handlers/reservations';
import {
  apiError,
  json,
  newId,
  nowIso,
  validationError,
  type MockContext,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { getStore, type MockReservation } from '@/src/_mock/backend/mock-store';
import type { AdmissionOtherShowMatch } from '@/src/types/booking';

const CODE = /^[0-9]{4}$/;

function matches(r: MockReservation, q: string): boolean {
  if (!q) return true;
  if (r.bookerName.includes(q)) return true;
  return (
    CODE.test(q) &&
    (r.code === q ||
      // 연락처 끝 4자리는 연락처가 있는 예매에서만(관리자 등록은 없을 수 있음)
      (r.bookerPhone !== null &&
        r.bookerPhone.replace(/\D/g, '').slice(-4) === q))
  );
}

function log(r: MockReservation, delta: number) {
  getStore().admissionLogs.push({
    id: newId(),
    reservationId: r.id,
    delta,
    admittedAfter: r.admittedCount,
    createdAt: nowIso(),
  });
}

function result(r: MockReservation) {
  return json({
    item: toAdmissionItem(r),
    summary: admissionSummary(r.showId),
  });
}

function conflict(ctx: MockContext) {
  return apiError(
    ctx,
    409,
    'RSV_010',
    '입장 인원을 바꿀 수 없습니다. 화면을 새로고침해주세요.'
  );
}

export const admissionRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/shows\/(?<id>[^/]+)\/admission$/,
    auth: true,
    handle: (ctx) => {
      const show = findShow(ctx.params.id);
      if (!show)
        return apiError(ctx, 404, 'SHW_001', '회차를 찾을 수 없습니다.');
      const q = (ctx.query.get('q') ?? '').trim();
      const store = getStore();
      const items = store.reservations
        .filter((r) => r.showId === show.id && r.status !== 'CANCELLED')
        .filter((r) => matches(r, q))
        .sort((a, b) => a.bookerName.localeCompare(b.bookerName, 'ko'))
        .map(toAdmissionItem);
      const otherShowMatches: AdmissionOtherShowMatch[] =
        CODE.test(q) && items.length === 0
          ? store.reservations
              .filter(
                (r) =>
                  r.code === q &&
                  r.showId !== show.id &&
                  r.status !== 'CANCELLED'
              )
              .flatMap((r) => {
                const other = findShow(r.showId);
                return other
                  ? [
                      {
                        reservationId: r.id,
                        code: r.code,
                        showId: other.id,
                        showDate: other.showDate,
                        startTime: other.startTime,
                        bookerName: r.bookerName,
                        quantity: r.quantity,
                        status: r.status,
                      },
                    ]
                  : [];
              })
          : [];
      return json({
        show: {
          id: show.id,
          performanceTitle:
            findPerformanceAlive(show.performanceId)?.title ?? '',
          showDate: show.showDate,
          startTime: show.startTime,
          venue: show.venue,
        },
        summary: admissionSummary(show.id),
        items,
        otherShowMatches,
      });
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/reservations\/(?<id>[^/]+)\/admission$/,
    auth: true,
    handle: (ctx) => {
      const delta = ctx.body.delta;
      if (
        typeof delta !== 'number' ||
        !Number.isInteger(delta) ||
        delta === 0 ||
        delta < -20 ||
        delta > 20
      )
        return validationError(ctx);
      const r = findReservation(ctx.params.id);
      const next = (r?.admittedCount ?? 0) + delta;
      if (!r || r.status !== 'CONFIRMED' || next < 0 || next > r.quantity)
        return conflict(ctx);
      r.admittedCount = next;
      log(r, delta);
      return result(r);
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/reservations\/(?<id>[^/]+)\/confirm-and-admit$/,
    auth: true,
    handle: (ctx) => {
      const r = findReservation(ctx.params.id);
      if (!r)
        return apiError(ctx, 404, 'COMMON_002', '예매를 찾을 수 없습니다.');
      if (ctx.body.version !== r.version) return staleVersionError(ctx);
      if (r.status !== 'PENDING') return invalidTransitionError(ctx);
      const admit = ctx.body.admit;
      if (
        typeof admit !== 'number' ||
        !Number.isInteger(admit) ||
        admit < 1 ||
        admit > r.quantity
      )
        return validationError(ctx);
      Object.assign(r, {
        status: 'CONFIRMED',
        confirmedAt: nowIso(),
        confirmedBy: 'MANUAL',
        admittedCount: admit,
        version: r.version + 1,
      });
      log(r, admit);
      return result(r);
    },
  },
];
