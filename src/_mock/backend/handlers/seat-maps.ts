// ----------------------------------------------------------------------
// 목 좌석 배치·좌석 변경(U35 — develop §19.2 · back-end §16).
// GET·PUT /admin/shows/{id}/seat-map · POST …/seat-map/copy-from · PUT /admin/reservations/{id}/seats.
// 배치 없음 404 SEAT_003 · 예매된 좌석을 지우거나 바꿈 409 SEAT_004(seatIds) · 이미 잡힌 좌석 409 SEAT_001(seatIds) ·
// 개수·칸 오류 400 SEAT_002. 같은 위치의 칸은 좌석 id 를 유지한다(서버와 같은 규칙).
// ----------------------------------------------------------------------
import {
  findPerformanceAlive,
  findReservation,
  findShow,
  liveSeatHolders,
  toAdminReservationItem,
} from '@/src/_mock/backend/booking-model';
import { staleVersionError } from '@/src/_mock/backend/handlers/reservations';
import {
  apiError,
  json,
  newId,
  validationError,
  type MockContext,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import {
  getStore,
  type MockSeatCell,
  type MockSeatLayout,
} from '@/src/_mock/backend/mock-store';
import type {
  AdminSeatMapResponse,
  AdminSeatMapRowResponse,
} from '@/src/types/booking';

const SHOW_NOT_FOUND = '회차를 찾을 수 없습니다.';

function seatConflict(
  ctx: MockContext,
  code: 'SEAT_001' | 'SEAT_004',
  seatIds: string[]
): Response {
  return json(
    {
      statusCode: 409,
      status: 'Conflict',
      message:
        code === 'SEAT_001'
          ? '다른 분이 먼저 선택한 좌석입니다.'
          : '예매된 좌석이 있는 배치는 그 좌석을 지우거나 바꿀 수 없습니다.',
      code,
      seatIds,
      timestamp: new Date().toISOString(),
      path: `/api${ctx.req.path}`,
    },
    409
  );
}

function seatInvalid(ctx: MockContext, message = '선택할 수 없는 좌석입니다.') {
  return apiError(ctx, 400, 'SEAT_002', message);
}

/** 배치 → 관리 지도 응답(VOID 칸 채움, 잡힌 좌석은 예매 id·이름) */
export function toAdminSeatMap(
  showId: string,
  layout: MockSeatLayout
): AdminSeatMapResponse {
  const show = findShow(showId);
  const performance = show ? findPerformanceAlive(show.performanceId) : null;
  const holders = liveSeatHolders(showId);
  const byPos = new Map(
    layout.cells.map((cell) => [`${cell.rowIndex}:${cell.colIndex}`, cell])
  );
  let total = 0;
  const rows: AdminSeatMapRowResponse[] = [];
  for (let r = 0; r < layout.rowCount; r += 1) {
    let label: string | null = null;
    const cells = [];
    for (let c = 0; c < layout.colCount; c += 1) {
      const cell = byPos.get(`${r}:${c}`);
      if (!cell) {
        cells.push({
          seatId: null,
          kind: 'VOID' as const,
          rowLabel: null,
          seatNumber: null,
          sold: false,
          reservationId: null,
          bookerName: null,
        });
        continue;
      }
      if (cell.kind === 'SEAT') {
        total += 1;
        label = cell.rowLabel;
      }
      const holder = cell.kind === 'SEAT' ? holders.get(cell.id) : undefined;
      cells.push({
        seatId: cell.kind === 'SEAT' ? cell.id : null,
        kind: cell.kind,
        rowLabel: cell.kind === 'SEAT' ? cell.rowLabel : null,
        seatNumber: cell.kind === 'SEAT' ? cell.seatNumber : null,
        sold: Boolean(holder),
        reservationId: holder?.id ?? null,
        bookerName: holder?.bookerName ?? null,
      });
    }
    rows.push({ label, cells });
  }
  // 잔여 = 배치 좌석 − 살아 있는 예매 매수(좌석 미정 포함 — back-end 자체 결정 ①)
  const liveQty = getStore()
    .reservations.filter((r) => r.showId === showId && r.status !== 'CANCELLED')
    .reduce((n, r) => n + r.quantity, 0);
  return {
    seatSelectionEnabled: performance?.seatSelectionEnabled ?? false,
    rowCount: layout.rowCount,
    colCount: layout.colCount,
    rows,
    total,
    remaining: Math.max(0, total - liveQty),
  };
}

function readLayout(
  ctx: MockContext,
  previous: MockSeatLayout | undefined
): MockSeatLayout | Response {
  const { rowCount, colCount, cells } = ctx.body;
  if (
    typeof rowCount !== 'number' ||
    typeof colCount !== 'number' ||
    !Number.isInteger(rowCount) ||
    !Number.isInteger(colCount) ||
    rowCount < 1 ||
    rowCount > 40 ||
    colCount < 1 ||
    colCount > 60 ||
    !Array.isArray(cells)
  )
    return validationError(ctx);
  const prevByPos = new Map(
    (previous?.cells ?? []).map((cell) => [
      `${cell.rowIndex}:${cell.colIndex}`,
      cell,
    ])
  );
  const out: MockSeatCell[] = [];
  const seen = new Set<string>();
  for (const raw of cells as Record<string, unknown>[]) {
    const r = raw.rowIndex;
    const c = raw.colIndex;
    if (
      typeof r !== 'number' ||
      typeof c !== 'number' ||
      r < 0 ||
      c < 0 ||
      r >= rowCount ||
      c >= colCount ||
      (raw.kind !== 'SEAT' && raw.kind !== 'AISLE')
    )
      return validationError(ctx);
    const key = `${r}:${c}`;
    if (seen.has(key)) return validationError(ctx);
    seen.add(key);
    const isSeat = raw.kind === 'SEAT';
    if (
      isSeat &&
      (typeof raw.rowLabel !== 'string' || typeof raw.seatNumber !== 'number')
    )
      return validationError(ctx);
    const prev = prevByPos.get(key);
    out.push({
      id: prev && prev.kind === raw.kind ? prev.id : newId(),
      rowIndex: r,
      colIndex: c,
      kind: isSeat ? 'SEAT' : 'AISLE',
      rowLabel: isSeat ? (raw.rowLabel as string) : null,
      seatNumber: isSeat ? (raw.seatNumber as number) : null,
    });
  }
  return { rowCount, colCount, cells: out };
}

/** 살아 있는 예매 좌석이 새 배치에 같은 이름으로 그대로 있는가 — 아니면 그 좌석 id(SEAT_004) */
function brokenHeldSeats(
  showId: string,
  previous: MockSeatLayout | undefined,
  next: MockSeatLayout
): string[] {
  if (!previous) return [];
  const holders = liveSeatHolders(showId);
  const nextById = new Map(next.cells.map((cell) => [cell.id, cell]));
  return previous.cells
    .filter((cell) => holders.has(cell.id))
    .filter((cell) => {
      const now = nextById.get(cell.id);
      return (
        !now ||
        now.kind !== 'SEAT' ||
        now.rowLabel !== cell.rowLabel ||
        now.seatNumber !== cell.seatNumber
      );
    })
    .map((cell) => cell.id);
}

export const seatMapRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/shows\/(?<id>[^/]+)\/seat-map$/,
    auth: true,
    handle: (ctx) => {
      if (!findShow(ctx.params.id))
        return apiError(ctx, 404, 'SHW_001', SHOW_NOT_FOUND);
      const layout = getStore().seatLayouts.get(ctx.params.id);
      if (!layout)
        return apiError(
          ctx,
          404,
          'SEAT_003',
          '좌석 지정 예매 회차가 아닙니다.'
        );
      return json(toAdminSeatMap(ctx.params.id, layout));
    },
  },
  {
    method: 'PUT',
    pattern: /^\/v1\/admin\/shows\/(?<id>[^/]+)\/seat-map$/,
    auth: true,
    handle: (ctx) => {
      if (!findShow(ctx.params.id))
        return apiError(ctx, 404, 'SHW_001', SHOW_NOT_FOUND);
      const store = getStore();
      const previous = store.seatLayouts.get(ctx.params.id);
      const next = readLayout(ctx, previous);
      if (next instanceof Response) return next;
      const broken = brokenHeldSeats(ctx.params.id, previous, next);
      if (broken.length > 0) return seatConflict(ctx, 'SEAT_004', broken);
      store.seatLayouts.set(ctx.params.id, next);
      return json(toAdminSeatMap(ctx.params.id, next));
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/shows\/(?<id>[^/]+)\/seat-map\/copy-from$/,
    auth: true,
    handle: (ctx) => {
      const target = findShow(ctx.params.id);
      const sourceId =
        typeof ctx.body.sourceShowId === 'string' ? ctx.body.sourceShowId : '';
      const source = findShow(sourceId);
      if (!target || !source)
        return apiError(ctx, 404, 'SHW_001', SHOW_NOT_FOUND);
      if (
        source.performanceId !== target.performanceId ||
        source.id === target.id
      )
        return validationError(ctx);
      const store = getStore();
      const sourceLayout = store.seatLayouts.get(source.id);
      if (!sourceLayout)
        return apiError(
          ctx,
          404,
          'SEAT_003',
          '좌석 지정 예매 회차가 아닙니다.'
        );
      const previous = store.seatLayouts.get(target.id);
      const prevByPos = new Map(
        (previous?.cells ?? []).map((cell) => [
          `${cell.rowIndex}:${cell.colIndex}`,
          cell,
        ])
      );
      const next: MockSeatLayout = {
        rowCount: sourceLayout.rowCount,
        colCount: sourceLayout.colCount,
        cells: sourceLayout.cells.map((cell) => {
          const prev = prevByPos.get(`${cell.rowIndex}:${cell.colIndex}`);
          return {
            ...cell,
            id: prev && prev.kind === cell.kind ? prev.id : newId(),
          };
        }),
      };
      const broken = brokenHeldSeats(target.id, previous, next);
      if (broken.length > 0) return seatConflict(ctx, 'SEAT_004', broken);
      store.seatLayouts.set(target.id, next);
      return json(toAdminSeatMap(target.id, next));
    },
  },
  {
    method: 'PUT',
    pattern: /^\/v1\/admin\/reservations\/(?<id>[^/]+)\/seats$/,
    auth: true,
    handle: (ctx) => {
      const r = findReservation(ctx.params.id);
      if (!r) return apiError(ctx, 404, 'RSV_013', '예매를 찾을 수 없습니다.');
      if (ctx.body.version !== r.version) return staleVersionError(ctx);
      const ids = ctx.body.seatIds;
      if (
        !Array.isArray(ids) ||
        ids.some((id) => typeof id !== 'string') ||
        new Set(ids).size !== ids.length
      )
        return seatInvalid(ctx);
      const seatIds = ids as string[];
      if (seatIds.length !== r.quantity)
        return seatInvalid(ctx, '좌석 수와 매수가 맞지 않습니다.');
      const layout = getStore().seatLayouts.get(r.showId);
      const seatSet = new Set(
        (layout?.cells ?? [])
          .filter((cell) => cell.kind === 'SEAT')
          .map((cell) => cell.id)
      );
      if (seatIds.some((id) => !seatSet.has(id))) return seatInvalid(ctx);
      const holders = liveSeatHolders(r.showId);
      const clashes = seatIds.filter(
        (id) => holders.has(id) && holders.get(id)?.id !== r.id
      );
      if (clashes.length > 0) return seatConflict(ctx, 'SEAT_001', clashes);
      r.seatIds = [...seatIds];
      r.version += 1;
      return json(toAdminReservationItem(r));
    },
  },
];
