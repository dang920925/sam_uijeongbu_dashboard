import { describe, expect, it } from 'vitest';

import {
  splitWorkChips,
  toWorkChips,
  WORK_CHIP_LIMIT,
} from '@/src/sections/applications/utils/work-chips';

const FOUR = [
  { id: 'p1', title: 'Dear' },
  { id: 'p2', title: 'HADESTOWN' },
  { id: 'p3', title: '안내놔? 못내놔!' },
  { id: 'p4', title: 'fixture-u31-작품' },
];

describe('work-chips', () => {
  it('상담은 희망 작품 칩만, "아직 모르겠어요"는 맨 뒤 undecided 칩이다', () => {
    // Act
    const chips = toWorkChips({
      appType: 'CONSULTATION',
      performance: null,
      interestedPerformances: [],
      interestUndecided: true,
    });
    // Assert
    expect(chips).toEqual([
      { key: 'undecided', text: '아직 모르겠어요', kind: 'undecided' },
    ]);
  });

  it('참관은 "참관 {작품}" 칩 다음에 관심 작품 칩이 온다', () => {
    // Act
    const chips = toWorkChips({
      appType: 'WORK_OBSERVATION',
      performance: { id: 'p9', title: 'HADESTOWN' },
      interestedPerformances: FOUR.slice(0, 1),
      interestUndecided: null,
    });
    // Assert
    expect(chips.map((c) => [c.text, c.kind])).toEqual([
      ['참관 HADESTOWN', 'observation'],
      ['Dear', 'interest'],
    ]);
  });

  it('옛 신청은 칩이 없다', () => {
    expect(
      toWorkChips({
        appType: 'CONSULTATION',
        performance: null,
        interestedPerformances: [],
        interestUndecided: null,
      })
    ).toEqual([]);
  });

  it('폭별 최대 수를 넘으면 앞에서 자르고 나머지 수를 센다', () => {
    // Arrange
    const chips = toWorkChips({
      appType: 'CONSULTATION',
      performance: null,
      interestedPerformances: FOUR,
      interestUndecided: false,
    });
    // Act
    const lg = splitWorkChips(chips, WORK_CHIP_LIMIT.lg);
    const md = splitWorkChips(chips, WORK_CHIP_LIMIT.md);
    const xs = splitWorkChips(chips, WORK_CHIP_LIMIT.xs);
    // Assert
    expect(lg.visible.map((c) => c.text)).toEqual(['Dear', 'HADESTOWN']);
    expect(lg.overflow).toBe(2);
    expect(md.overflow).toBe(3);
    expect(xs.overflow).toBe(1);
  });

  it('최대 수 이하면 모두 보이고 넘침이 0 이다', () => {
    const chips = toWorkChips({
      appType: 'CONSULTATION',
      performance: null,
      interestedPerformances: FOUR.slice(0, 2),
      interestUndecided: false,
    });
    expect(splitWorkChips(chips, 2)).toEqual({ visible: chips, overflow: 0 });
  });
});
