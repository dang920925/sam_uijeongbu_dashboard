import { describe, expect, it } from 'vitest';

import { toCastGrid } from '@/src/sections/performance-cast/utils/cast-grid';
import { formatShowLabel } from '@/src/sections/performance-cast/utils/format-show-label';

const ON = { castPublic: true, performanceVisible: true };
const actor = (name: string, isVisible = true) => ({
  actorProfileId: `p-${name}`,
  memberId: `m-${name}`,
  name,
  isVisible,
  note: null,
});

describe('formatShowLabel', () => {
  it('"M/D (요일) HH:mm" 으로 만든다', () => {
    expect(formatShowLabel('2026-12-12', '14:00')).toBe('12/12 (토) 14:00');
    expect(formatShowLabel('bad', '14:00')).toBe('bad 14:00');
  });
});

describe('toCastGrid', () => {
  it('행 = 배역, 칸 = 회차 순 · 출연 묶음 이름 · 미정 · 지정 여부 · 이유를 담는다', () => {
    const model = toCastGrid(
      {
        shows: [{ id: 's1', showDate: '2026-12-12', startTime: '14:00' }],
        roles: [
          { id: 'r1', name: '햄릿' },
          { id: 'r2', name: null },
        ],
        cells: [
          {
            showId: 's1',
            roleId: 'r1',
            isOverride: true,
            publicNow: false,
            actors: [actor('가'), actor('나', false)],
          },
          {
            showId: 's1',
            roleId: 'r2',
            isOverride: false,
            publicNow: false,
            actors: [],
          },
        ],
      },
      ON
    );

    expect(model.shows).toEqual([{ id: 's1', label: '12/12 (토) 14:00' }]);
    expect(model.rows[0].cells[0]).toMatchObject({
      names: '가, 나',
      isOverride: true,
      reason: '공개 안 됨 — 비노출 배우 포함',
    });
    expect(model.rows[1]).toMatchObject({ roleLabel: '출연' });
    expect(model.rows[1].cells[0]).toMatchObject({
      names: '미정',
      isEmpty: true,
    });
  });

  it('회차가 없으면 칸도 없다', () => {
    expect(
      toCastGrid({ shows: [], roles: [{ id: 'r', name: 'x' }], cells: [] }, ON)
        .rows[0].cells
    ).toEqual([]);
  });
});
