// ----------------------------------------------------------------------
// 좌석 지도 → SeatGrid 칸 표시(U35) — 순수 함수.
// - 고르기(좌석 변경·수동 등록): 고른 좌석 selected, 이 예매가 가진 좌석은 다시 고를 수 있고(mine),
//   다른 예매 좌석은 sold(누를 수 없음). 매수만큼 고르면 나머지 빈 좌석은 aria-disabled.
// - 현황: 예매 완료 칸만 버튼(누르면 그 예매), 빈 좌석은 이름만 읽힌다.
// ----------------------------------------------------------------------
import type { AdminSeatCell, AdminSeatMap } from '@/src/api/seat-map-mapper';
import type {
  SeatGridCellView,
  SeatGridRowView,
} from '@/src/components/seat-grid';
import { MSG_SEAT } from '@/src/shared/messages/seat';

const EMPTY = (cell: AdminSeatCell): SeatGridCellView => ({
  key: cell.key,
  tone: cell.kind === 'AISLE' ? 'aisle' : 'void',
  text: '',
  ariaLabel: '',
  interactive: false,
});

/** 칸 key → 좌석 칸(좌석이 아니면 null) */
export function findSeatCell(
  map: AdminSeatMap | null | undefined,
  key: string
): AdminSeatCell | null {
  for (const row of map?.rows ?? [])
    for (const cell of row.cells)
      if (cell.key === key) return cell.seatId ? cell : null;
  return null;
}

/** 고를 수 있는 좌석인가 — 빈 좌석 또는 이 예매가 가진 좌석 */
function isOpenFor(cell: AdminSeatCell, ownReservationId: string | null) {
  return (
    !cell.sold ||
    (ownReservationId !== null && cell.reservationId === ownReservationId)
  );
}

/** 고른 좌석 정리 — 지도에서 고를 수 있는 것만, 매수만큼 */
export function resolvePicked(
  map: AdminSeatMap | null | undefined,
  picked: readonly string[],
  quantity: number,
  ownReservationId: string | null = null
): string[] {
  if (!map) return picked.slice(0, Math.max(0, quantity));
  const open = new Set<string>();
  for (const row of map.rows)
    for (const cell of row.cells)
      if (cell.seatId && isOpenFor(cell, ownReservationId))
        open.add(cell.seatId);
  return picked.filter((id) => open.has(id)).slice(0, Math.max(0, quantity));
}

export function toggleSeatPick(
  picked: readonly string[],
  seatId: string,
  quantity: number
): string[] {
  if (picked.includes(seatId)) return picked.filter((id) => id !== seatId);
  return picked.length < quantity ? [...picked, seatId] : [...picked];
}

/** 고른 좌석 이름(지도 순서) "A3, A4" */
export function pickedLabels(
  map: AdminSeatMap | null | undefined,
  picked: readonly string[]
): string {
  const wanted = new Set(picked);
  const labels: string[] = [];
  for (const row of map?.rows ?? [])
    for (const cell of row.cells)
      if (cell.seatId && wanted.has(cell.seatId)) labels.push(cell.seatLabel);
  return labels.join(', ');
}

export function toPickerRows(
  map: AdminSeatMap,
  picked: readonly string[],
  quantity: number,
  ownReservationId: string | null = null
): SeatGridRowView[] {
  const pickedSet = new Set(picked);
  const full = picked.length >= quantity;
  return map.rows.map((row) => ({
    key: row.key,
    label: row.label ?? '',
    cells: row.cells.map((cell) => {
      if (!cell.seatId || cell.rowLabel === null || cell.seatNumber === null)
        return EMPTY(cell);
      const { rowLabel, seatNumber } = cell;
      const own =
        ownReservationId !== null && cell.reservationId === ownReservationId;
      if (pickedSet.has(cell.seatId))
        return {
          key: cell.key,
          tone: 'selected' as const,
          text: String(seatNumber),
          ariaLabel: MSG_SEAT.SEAT_ARIA(rowLabel, seatNumber),
          interactive: true,
          pressed: true,
        };
      if (cell.sold && !own)
        return {
          key: cell.key,
          tone: 'sold' as const,
          text: '',
          ariaLabel: MSG_SEAT.SEAT_ARIA_SOLD(rowLabel, seatNumber, null),
          interactive: true,
          disabled: true,
          pressed: false,
        };
      return {
        key: cell.key,
        tone: own ? ('mine' as const) : ('available' as const),
        text: String(seatNumber),
        ariaLabel: full
          ? MSG_SEAT.SEAT_ARIA_FULL(rowLabel, seatNumber)
          : own
            ? MSG_SEAT.SEAT_ARIA_MINE(rowLabel, seatNumber)
            : MSG_SEAT.SEAT_ARIA(rowLabel, seatNumber),
        interactive: true,
        disabled: full,
        pressed: false,
      };
    }),
  }));
}

/** 현황 지도 — 예매 완료 칸만 버튼(누르면 그 예매), 빈 좌석은 읽기만 */
export function toStatusRows(map: AdminSeatMap): SeatGridRowView[] {
  return map.rows.map((row) => ({
    key: row.key,
    label: row.label ?? '',
    cells: row.cells.map((cell) => {
      if (!cell.seatId || cell.rowLabel === null || cell.seatNumber === null)
        return EMPTY(cell);
      return cell.sold
        ? {
            key: cell.key,
            tone: 'sold' as const,
            text: '',
            ariaLabel: MSG_SEAT.SEAT_ARIA_SOLD(
              cell.rowLabel,
              cell.seatNumber,
              cell.bookerName
            ),
            interactive: true,
          }
        : {
            key: cell.key,
            tone: 'available' as const,
            text: String(cell.seatNumber),
            ariaLabel: MSG_SEAT.SEAT_ARIA(cell.rowLabel, cell.seatNumber),
            interactive: false,
          };
    }),
  }));
}
