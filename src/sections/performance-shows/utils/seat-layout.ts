// ----------------------------------------------------------------------
// 좌석 배치 편집기(U35 — design §14 SCR-D11) — 순수 함수.
// - 격자는 칸 종류(SEAT·AISLE·VOID) 2차원 배열. 행 0 = 무대 쪽.
// - 칸을 누르면 좌석 → 통로 → 사용 안 함 → 좌석. 예매된 좌석(locked)은 바꾸지 않는다(서버도 409 SEAT_004).
// - 열 이름: 좌석이 있는 행에만 위에서부터 A, B, …, Z, AA…(≤5자). 번호: 왼쪽부터 1, 통로·사용 안 함은 건너뜀.
// - 저장: VOID 칸은 빼고 보낸다(back-end §16 — 보내지 않은 칸 = VOID, 본문 128KB).
// ----------------------------------------------------------------------
import type { AdminSeatMap } from '@/src/api/seat-map-mapper';
import type { SeatGridRowView } from '@/src/components/seat-grid';
import { MSG_SEAT } from '@/src/shared/messages/seat';
import type { SaveSeatMapRequest, SeatKind } from '@/src/types/booking';

export type KindGrid = SeatKind[][];

export const SEAT_ROWS_MAX = 40;
export const SEAT_COLS_MAX = 60;
/** 새 배치 기본 크기 — 사용자 참고 이미지(A~H × 4·통로·4) */
export const DEFAULT_ROWS = 8;
export const DEFAULT_COLS = 9;

const KIND_LABEL: Record<SeatKind, string> = {
  SEAT: MSG_SEAT.LEGEND_SEAT,
  AISLE: MSG_SEAT.LEGEND_AISLE,
  VOID: MSG_SEAT.LEGEND_VOID,
};

/** 0 → A … 25 → Z, 26 → AA */
export function rowLabelOf(index: number): string {
  let n = index;
  let label = '';
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

/** 새 배치 — 가운데 열을 통로로 둔 기본 격자 */
export function defaultKindGrid(
  rows = DEFAULT_ROWS,
  cols = DEFAULT_COLS
): KindGrid {
  const aisle = cols >= 3 ? Math.floor(cols / 2) : -1;
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (_, c) => (c === aisle ? 'AISLE' : 'SEAT'))
  );
}

export function toKindGrid(map: AdminSeatMap | null): KindGrid {
  if (!map) return defaultKindGrid();
  return Array.from({ length: map.rowCount }, (_, r) =>
    Array.from(
      { length: map.colCount },
      (_, c) => map.rows[r]?.cells[c]?.kind ?? 'VOID'
    )
  );
}

/** 예매된 좌석 위치 "r:c"(편집기에서 잠근다) */
export function lockedPositions(map: AdminSeatMap | null): Set<string> {
  const out = new Set<string>();
  for (const row of map?.rows ?? [])
    for (const cell of row.cells)
      if (cell.sold) out.add(`${cell.rowIndex}:${cell.colIndex}`);
  return out;
}

/** 크기 바꾸기 — 있던 칸은 그대로, 새 칸은 좌석 */
export function resizeKindGrid(
  grid: KindGrid,
  rows: number,
  cols: number
): KindGrid {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => grid[r]?.[c] ?? 'SEAT')
  );
}

export function cycleKind(kind: SeatKind): SeatKind {
  return kind === 'SEAT' ? 'AISLE' : kind === 'AISLE' ? 'VOID' : 'SEAT';
}

export function toggleCell(
  grid: KindGrid,
  r: number,
  c: number,
  locked: ReadonlySet<string>
): KindGrid {
  if (locked.has(`${r}:${c}`)) return grid;
  return grid.map((row, ri) =>
    ri === r ? row.map((kind, ci) => (ci === c ? cycleKind(kind) : kind)) : row
  );
}

export interface LabeledCell {
  kind: SeatKind;
  rowLabel: string | null;
  seatNumber: number | null;
}

/** 열 이름·번호 자동 붙이기 */
export function labelGrid(grid: KindGrid): LabeledCell[][] {
  let rowIndex = 0;
  return grid.map((row) => {
    const hasSeat = row.includes('SEAT');
    const label = hasSeat ? rowLabelOf(rowIndex) : null;
    if (hasSeat) rowIndex += 1;
    let n = 0;
    return row.map((kind) => {
      if (kind !== 'SEAT' || !label)
        return { kind, rowLabel: null, seatNumber: null };
      n += 1;
      return { kind, rowLabel: label, seatNumber: n };
    });
  });
}

export function countSeats(grid: KindGrid): number {
  return grid.reduce(
    (sum, row) => sum + row.filter((kind) => kind === 'SEAT').length,
    0
  );
}

export function toSaveSeatMapRequest(grid: KindGrid): SaveSeatMapRequest {
  const labeled = labelGrid(grid);
  const cells: SaveSeatMapRequest['cells'] = [];
  labeled.forEach((row, rowIndex) =>
    row.forEach((cell, colIndex) => {
      if (cell.kind === 'VOID') return;
      cells.push(
        cell.kind === 'SEAT' && cell.rowLabel && cell.seatNumber !== null
          ? {
              rowIndex,
              colIndex,
              kind: 'SEAT',
              rowLabel: cell.rowLabel,
              seatNumber: cell.seatNumber,
            }
          : { rowIndex, colIndex, kind: 'AISLE' }
      );
    })
  );
  return { rowCount: grid.length, colCount: grid[0]?.length ?? 0, cells };
}

/** 크기 입력 검사 — 정수 범위 밖이면 null */
export function parseGridSize(rows: string, cols: string) {
  const r = Number(rows);
  const c = Number(cols);
  if (
    !Number.isInteger(r) ||
    !Number.isInteger(c) ||
    r < 1 ||
    r > SEAT_ROWS_MAX ||
    c < 1 ||
    c > SEAT_COLS_MAX
  )
    return null;
  return { rows: r, cols: c };
}

/** 편집 격자 칸 — 모든 칸이 버튼(잠긴 칸은 aria-disabled) */
export function toEditorRows(
  grid: KindGrid,
  locked: ReadonlySet<string>
): SeatGridRowView[] {
  const labeled = labelGrid(grid);
  return labeled.map((row, r) => ({
    key: `r${r}`,
    label: row.find((cell) => cell.rowLabel)?.rowLabel ?? '',
    cells: row.map((cell, c) => {
      const isLocked = locked.has(`${r}:${c}`);
      const name =
        cell.rowLabel && cell.seatNumber !== null
          ? `${cell.rowLabel}${cell.seatNumber}`
          : '';
      return {
        key: `r${r}c${c}`,
        tone: isLocked
          ? ('locked' as const)
          : cell.kind === 'SEAT'
            ? ('available' as const)
            : cell.kind === 'AISLE'
              ? ('aisle' as const)
              : ('void' as const),
        text: cell.seatNumber !== null ? String(cell.seatNumber) : '',
        ariaLabel: isLocked
          ? MSG_SEAT.EDITOR_CELL_LOCKED(name)
          : MSG_SEAT.EDITOR_CELL_ARIA(
              r + 1,
              c + 1,
              name ? `${KIND_LABEL[cell.kind]} ${name}` : KIND_LABEL[cell.kind]
            ),
        interactive: true,
        disabled: isLocked,
      };
    }),
  }));
}

/** 미리보기(관객 화면) — 통로·사용 안 함은 빈칸, 좌석만 번호 */
export function toPreviewRows(grid: KindGrid): SeatGridRowView[] {
  return labelGrid(grid).map((row, r) => ({
    key: `p${r}`,
    label: row.find((cell) => cell.rowLabel)?.rowLabel ?? '',
    cells: row.map((cell, c) => ({
      key: `p${r}c${c}`,
      tone:
        cell.kind === 'SEAT'
          ? ('available' as const)
          : cell.kind === 'AISLE'
            ? ('aisle' as const)
            : ('void' as const),
      text: cell.seatNumber !== null ? String(cell.seatNumber) : '',
      ariaLabel: '',
      interactive: false,
    })),
  }));
}
