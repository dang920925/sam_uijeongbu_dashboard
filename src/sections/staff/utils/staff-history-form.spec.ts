import { describe, expect, it } from 'vitest';

import {
  emptyHistoryRow,
  invalidHistoryRows,
  moveHistoryRow,
  toHistoryRequest,
  toHistoryRows,
} from '@/src/sections/staff/utils/staff-history-form';

describe('staff-history-form', () => {
  it('응답 연혁을 입력 줄로 바꾸고 다시 요청으로 되돌린다(순서 유지)', () => {
    const rows = toHistoryRows([
      { year: 2024, content: 'fixture-가' },
      { year: 2019, content: 'fixture-나' },
    ]);

    expect(rows.map((r) => r.year)).toEqual(['2024', '2019']);
    expect(toHistoryRequest(rows)).toEqual([
      { year: 2024, content: 'fixture-가' },
      { year: 2019, content: 'fixture-나' },
    ]);
    expect(toHistoryRows(undefined)).toEqual([]);
  });

  it('▲▼ 는 이웃과 자리를 바꾸고 끝에서는 그대로다', () => {
    const rows = toHistoryRows([
      { year: 2024, content: 'a' },
      { year: 2023, content: 'b' },
    ]);

    expect(moveHistoryRow(rows, rows[1].key, -1).map((r) => r.content)).toEqual(
      ['b', 'a']
    );
    expect(moveHistoryRow(rows, rows[0].key, -1).map((r) => r.content)).toEqual(
      ['a', 'b']
    );
  });

  it('연도 형식·범위 밖, 빈 내용, 201자는 잘못된 줄이다', () => {
    const ok = { ...emptyHistoryRow(), year: '2024', content: '내용' };

    expect(
      invalidHistoryRows([
        ok,
        { ...ok, year: '24' },
        { ...ok, year: '1899' },
        { ...ok, content: '  ' },
        { ...ok, content: 'a'.repeat(201) },
      ])
    ).toEqual([false, true, true, true, true]);
  });
});
