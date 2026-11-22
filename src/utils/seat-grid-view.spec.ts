import type { AdminSeatMap } from '@/src/api/seat-map-mapper';
import {
  findSeatCell,
  pickedLabels,
  resolvePicked,
  toggleSeatPick,
  toPickerRows,
  toStatusRows,
} from '@/src/utils/seat-grid-view';

const seat = (
  id: string,
  c: number,
  n: number,
  holder: { id: string; name: string } | null = null
) => ({
  key: `r0c${c}`,
  rowIndex: 0,
  colIndex: c,
  kind: 'SEAT' as const,
  seatId: id,
  seatLabel: `A${n}`,
  rowLabel: 'A',
  seatNumber: n,
  sold: holder !== null,
  reservationId: holder?.id ?? null,
  bookerName: holder?.name ?? null,
});

const MAP: AdminSeatMap = {
  seatSelectionEnabled: true,
  rowCount: 1,
  colCount: 4,
  total: 3,
  remaining: 1,
  rows: [
    {
      key: 'r0',
      label: 'A',
      cells: [
        seat('s1', 0, 1),
        {
          key: 'r0c1',
          rowIndex: 0,
          colIndex: 1,
          kind: 'AISLE',
          seatId: null,
          seatLabel: '',
          rowLabel: null,
          seatNumber: null,
          sold: false,
          reservationId: null,
          bookerName: null,
        },
        seat('s2', 2, 2, { id: 'rsv-me', name: 'fixture-나' }),
        seat('s3', 3, 3, { id: 'rsv-other', name: 'fixture-남' }),
      ],
    },
  ],
};

describe('seat-grid-view', () => {
  it('resolvePicked 는 다른 예매 좌석을 빼고 이 예매의 좌석은 남긴다', () => {
    expect(resolvePicked(MAP, ['s3', 's2', 's1'], 2, 'rsv-me')).toEqual([
      's2',
      's1',
    ]);
    expect(resolvePicked(MAP, ['s2'], 1)).toEqual([]);
  });

  it('toggleSeatPick 은 매수만큼만 더하고 고른 좌석은 해제한다', () => {
    expect(toggleSeatPick(['s1'], 's2', 1)).toEqual(['s1']);
    expect(toggleSeatPick(['s1'], 's1', 1)).toEqual([]);
    expect(toggleSeatPick([], 's1', 1)).toEqual(['s1']);
  });

  it('toPickerRows 는 선택·이 예매 좌석·다른 예매·통로를 구분한다', () => {
    const cells = toPickerRows(MAP, ['s1'], 2, 'rsv-me')[0].cells;
    expect(cells.map((c) => c.tone)).toEqual([
      'selected',
      'aisle',
      'mine',
      'sold',
    ]);
    expect(cells[3]).toMatchObject({ disabled: true });
    expect(cells[1].interactive).toBe(false);
    // 꽉 차면 빈 좌석은 누를 수 없다
    const full = toPickerRows(MAP, ['s1'], 1)[0].cells;
    expect(full[0].pressed).toBe(true);
  });

  it('toStatusRows 는 예매 완료 칸만 버튼이고 이름을 읽어 준다', () => {
    const cells = toStatusRows(MAP)[0].cells;
    expect(cells[3]).toMatchObject({
      interactive: true,
      ariaLabel: 'A열 3번, 예매 완료 — fixture-남',
    });
    expect(cells[0].interactive).toBe(false);
  });

  it('findSeatCell·pickedLabels', () => {
    expect(findSeatCell(MAP, 'r0c2')?.seatId).toBe('s2');
    expect(findSeatCell(MAP, 'r0c1')).toBeNull();
    expect(pickedLabels(MAP, ['s3', 's1'])).toBe('A1, A3');
  });
});
