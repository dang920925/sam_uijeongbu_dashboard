import {
  countSeats,
  cycleKind,
  defaultKindGrid,
  labelGrid,
  parseGridSize,
  resizeKindGrid,
  rowLabelOf,
  toEditorRows,
  toggleCell,
  toSaveSeatMapRequest,
} from '@/src/sections/performance-shows/utils/seat-layout';

describe('seat-layout', () => {
  it('기본 배치는 8열 × 9칸, 가운데 통로 → 64석(사용자 참고 이미지)', () => {
    const grid = defaultKindGrid();
    expect(grid).toHaveLength(8);
    expect(grid[0][4]).toBe('AISLE');
    expect(countSeats(grid)).toBe(64);
  });

  it('열 이름은 좌석 있는 행에만 A, B… 번호는 통로를 건너뛴다', () => {
    const labeled = labelGrid([
      ['SEAT', 'AISLE', 'SEAT'],
      ['VOID', 'VOID', 'VOID'],
      ['VOID', 'SEAT', 'SEAT'],
    ]);
    expect(labeled[0].map((c) => c.seatNumber)).toEqual([1, null, 2]);
    expect(labeled[1][0].rowLabel).toBeNull();
    expect(labeled[2][1]).toEqual({
      kind: 'SEAT',
      rowLabel: 'B',
      seatNumber: 1,
    });
    expect(rowLabelOf(25)).toBe('Z');
    expect(rowLabelOf(26)).toBe('AA');
    expect(rowLabelOf(39)).toBe('AN');
  });

  it('칸은 좌석 → 통로 → 사용 안 함 → 좌석 순, 잠긴 칸은 그대로', () => {
    expect(cycleKind('SEAT')).toBe('AISLE');
    expect(cycleKind('AISLE')).toBe('VOID');
    expect(cycleKind('VOID')).toBe('SEAT');
    const grid = [['SEAT', 'SEAT']] as const;
    expect(toggleCell([[...grid[0]]], 0, 1, new Set())[0][1]).toBe('AISLE');
    expect(toggleCell([[...grid[0]]], 0, 1, new Set(['0:1']))[0][1]).toBe(
      'SEAT'
    );
  });

  it('크기를 바꿔도 있던 칸은 남고 새 칸은 좌석이다', () => {
    const grid = resizeKindGrid([['AISLE']], 2, 2);
    expect(grid).toEqual([
      ['AISLE', 'SEAT'],
      ['SEAT', 'SEAT'],
    ]);
  });

  it('저장 요청은 VOID 칸을 빼고 좌석에 열 이름·번호를 붙인다', () => {
    const req = toSaveSeatMapRequest([
      ['SEAT', 'AISLE', 'VOID'],
      ['VOID', 'VOID', 'VOID'],
    ]);
    expect(req).toEqual({
      rowCount: 2,
      colCount: 3,
      cells: [
        {
          rowIndex: 0,
          colIndex: 0,
          kind: 'SEAT',
          rowLabel: 'A',
          seatNumber: 1,
        },
        { rowIndex: 0, colIndex: 1, kind: 'AISLE' },
      ],
    });
  });

  it('크기 입력은 1~40 · 1~60 정수만', () => {
    expect(parseGridSize('8', '9')).toEqual({ rows: 8, cols: 9 });
    expect(parseGridSize('41', '9')).toBeNull();
    expect(parseGridSize('8', '0')).toBeNull();
    expect(parseGridSize('1.5', '9')).toBeNull();
  });

  it('편집 칸은 잠긴 좌석을 locked·aria-disabled 로 둔다', () => {
    const rows = toEditorRows([['SEAT', 'AISLE']], new Set(['0:0']));
    expect(rows[0].cells[0]).toMatchObject({ tone: 'locked', disabled: true });
    expect(rows[0].cells[1]).toMatchObject({
      tone: 'aisle',
      ariaLabel: '1행 2칸, 통로',
    });
    expect(rows[0].label).toBe('A');
  });
});
