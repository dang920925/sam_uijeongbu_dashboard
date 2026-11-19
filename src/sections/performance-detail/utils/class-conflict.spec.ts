import { describe, expect, it } from 'vitest';

import {
  getDayToggleStates,
  hasClassConflict,
  isOccupyingClass,
  toggleDay,
  type ClassSlot,
} from '@/src/sections/performance-detail/utils/class-conflict';
import type { PerformanceClass } from '@/src/types/performance-class';

const TODAY = '2026-11-19';
const OPTIONS = { today: TODAY, excludeId: null };

function makeClass(over: Partial<PerformanceClass> = {}): PerformanceClass {
  return {
    id: 'c1',
    performanceId: 'p1',
    name: 'fixture-반',
    daysOfWeek: ['MON'],
    startTime: '19:00',
    endTime: '21:00',
    deadline: null,
    location: null,
    status: 'ACTIVE',
    createdAt: '2026-11-01T00:00:00.000Z',
    ...over,
  };
}

const slot = (over: Partial<ClassSlot> = {}): ClassSlot => ({
  daysOfWeek: ['MON'],
  startTime: '20:00',
  endTime: '22:00',
  status: 'ACTIVE',
  ...over,
});

describe('isOccupyingClass', () => {
  it('마감일이 오늘이면 아직 시간을 차지한다고 본다', () => {
    // Arrange
    const item = makeClass({ deadline: TODAY });
    // Act · Assert
    expect(isOccupyingClass(item, TODAY)).toBe(true);
  });

  it('마감일이 어제면 시간을 차지하지 않는다', () => {
    expect(isOccupyingClass(makeClass({ deadline: '2026-11-18' }), TODAY)).toBe(
      false
    );
  });

  it('비활성 반은 시간을 차지하지 않는다', () => {
    expect(isOccupyingClass(makeClass({ status: 'INACTIVE' }), TODAY)).toBe(
      false
    );
  });
});

describe('hasClassConflict', () => {
  it('월 19:00~21:00 반이 있을 때 월 20:00~22:00 은 겹친다', () => {
    // Arrange
    const classes = [makeClass()];
    // Act
    const result = hasClassConflict(slot(), classes, OPTIONS);
    // Assert
    expect(result).toBe(true);
  });

  it('기존 반 마감일이 어제면 같은 시간이어도 겹치지 않는다', () => {
    const classes = [makeClass({ deadline: '2026-11-18' })];
    expect(hasClassConflict(slot(), classes, OPTIONS)).toBe(false);
  });

  it('비활성 반과는 충돌하지 않는다', () => {
    const classes = [makeClass({ status: 'INACTIVE' })];
    expect(hasClassConflict(slot(), classes, OPTIONS)).toBe(false);
  });

  it('끝나는 시각과 시작 시각이 맞닿기만 하면 겹치지 않는다', () => {
    const classes = [makeClass()];
    expect(
      hasClassConflict(
        slot({ startTime: '21:00', endTime: '22:00' }),
        classes,
        OPTIONS
      )
    ).toBe(false);
  });

  it('요일이 다르면 겹치지 않는다', () => {
    expect(
      hasClassConflict(slot({ daysOfWeek: ['TUE'] }), [makeClass()], OPTIONS)
    ).toBe(false);
  });

  it('수정 중인 자기 반은 빼고 본다', () => {
    expect(
      hasClassConflict(slot(), [makeClass({ id: 'self' })], {
        today: TODAY,
        excludeId: 'self',
      })
    ).toBe(false);
  });

  it('새 반이 비활성이면 충돌로 보지 않는다', () => {
    expect(
      hasClassConflict(slot({ status: 'INACTIVE' }), [makeClass()], OPTIONS)
    ).toBe(false);
  });

  it('요일이나 시간이 비어 있으면 검사하지 않는다', () => {
    const classes = [makeClass()];
    expect(hasClassConflict(slot({ daysOfWeek: [] }), classes, OPTIONS)).toBe(
      false
    );
    expect(hasClassConflict(slot({ endTime: '' }), classes, OPTIONS)).toBe(
      false
    );
  });
});

describe('getDayToggleStates', () => {
  it('겹치지 않는 선택이면 고르면 겹칠 요일만 비활성으로 표시한다', () => {
    // Arrange — 기존: 금 19~21 / 후보: 화·목 20~22
    const classes = [makeClass({ daysOfWeek: ['FRI'] })];
    // Act
    const states = getDayToggleStates(
      slot({ daysOfWeek: ['TUE', 'THU'] }),
      classes,
      OPTIONS
    );
    // Assert
    expect(states.filter((s) => s.isConflict).map((s) => s.day)).toEqual([
      'FRI',
    ]);
    expect(states.filter((s) => s.isSelected).map((s) => s.day)).toEqual([
      'TUE',
      'THU',
    ]);
  });

  it('선택이 이미 겹치면 나머지 미선택 요일이 전부 비활성이다(현행 로직)', () => {
    const states = getDayToggleStates(
      slot({ daysOfWeek: ['MON'] }),
      [makeClass()],
      OPTIONS
    );
    expect(states.filter((s) => s.isConflict)).toHaveLength(6);
  });
});

describe('toggleDay', () => {
  it('요일을 더하면 월~일 순서로 정렬한다', () => {
    expect(toggleDay(['WED'], 'MON')).toEqual(['MON', 'WED']);
  });

  it('선택된 요일을 누르면 뺀다', () => {
    expect(toggleDay(['MON', 'WED'], 'MON')).toEqual(['WED']);
  });
});
