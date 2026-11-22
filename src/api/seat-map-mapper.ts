// ----------------------------------------------------------------------
// 좌석 매퍼(U35 — develop §19.2 · back-end §16) — 관리 좌석 지도 ↔ 화면 모델, 예매 좌석 표시.
// 지도 첫 행이 무대 쪽, 칸 위치는 0부터. VOID 칸은 저장 요청에서 뺀다(보내지 않은 칸 = VOID).
// ----------------------------------------------------------------------
import type {
  AdminSeatMapResponse,
  ReservationSeatResponse,
  SeatKind,
} from '@/src/types/booking';

export interface AdminSeatCell {
  key: string;
  rowIndex: number;
  colIndex: number;
  kind: SeatKind;
  seatId: string | null;
  /** 좌석 칸만 "B3" */
  seatLabel: string;
  rowLabel: string | null;
  seatNumber: number | null;
  sold: boolean;
  reservationId: string | null;
  bookerName: string | null;
}

export interface AdminSeatRow {
  key: string;
  label: string | null;
  cells: AdminSeatCell[];
}

export interface AdminSeatMap {
  seatSelectionEnabled: boolean;
  rowCount: number;
  colCount: number;
  total: number;
  remaining: number;
  rows: AdminSeatRow[];
}

export function formatSeatLabel(rowLabel: string, seatNumber: number): string {
  return `${rowLabel}${seatNumber}`;
}

export function fromAdminSeatMapResponse(
  res: AdminSeatMapResponse
): AdminSeatMap {
  return {
    seatSelectionEnabled: res.seatSelectionEnabled,
    rowCount: res.rowCount,
    colCount: res.colCount,
    total: res.total,
    remaining: res.remaining,
    rows: res.rows.map((row, r) => ({
      key: `r${r}`,
      label: row.label,
      cells: row.cells.map((cell, c) => {
        const rowLabel = cell.rowLabel ?? row.label;
        const isSeat =
          cell.kind === 'SEAT' &&
          cell.seatId !== null &&
          rowLabel !== null &&
          cell.seatNumber !== null;
        return {
          key: `r${r}c${c}`,
          rowIndex: r,
          colIndex: c,
          kind: isSeat ? 'SEAT' : cell.kind === 'SEAT' ? 'VOID' : cell.kind,
          seatId: isSeat ? cell.seatId : null,
          seatLabel:
            isSeat && rowLabel && cell.seatNumber !== null
              ? formatSeatLabel(rowLabel, cell.seatNumber)
              : '',
          rowLabel: isSeat ? rowLabel : null,
          seatNumber: isSeat ? cell.seatNumber : null,
          sold: isSeat ? cell.sold : false,
          reservationId: isSeat ? cell.reservationId : null,
          bookerName: isSeat ? cell.bookerName : null,
        };
      }),
    })),
  };
}

const compareSeats = (
  a: ReservationSeatResponse,
  b: ReservationSeatResponse
): number =>
  a.rowLabel === b.rowLabel
    ? a.seatNumber - b.seatNumber
    : a.rowLabel.length - b.rowLabel.length ||
      (a.rowLabel < b.rowLabel ? -1 : 1);

/** 예매 좌석 → "B3·B4"(열·번호 순, design §14). 없으면 null */
export function formatReservationSeats(
  seats: readonly ReservationSeatResponse[] | null | undefined,
  separator = '·'
): string | null {
  if (!seats || seats.length === 0) return null;
  return [...seats]
    .sort(compareSeats)
    .map((seat) => formatSeatLabel(seat.rowLabel, seat.seatNumber))
    .join(separator);
}

/**
 * 좌석 칸 글자 — 좌석이 있으면 "B3·B4", 좌석 지정 공연인데 없으면 unassigned("좌석 미정"),
 * 좌석 지정이 아니면 null(칸을 비운다). seatSelection 을 모르면(null) 좌석이 있을 때만 보인다.
 */
export function toSeatText(
  seats: readonly ReservationSeatResponse[] | null | undefined,
  seatSelection: boolean | null,
  unassigned: string
): string | null {
  const text = formatReservationSeats(seats);
  if (text) return text;
  return seatSelection ? unassigned : null;
}
