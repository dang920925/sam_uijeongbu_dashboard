import { describe, expect, it } from 'vitest';

import {
  formatClassDays,
  formatClassTime,
  toClassRowDisplay,
  toPerformanceInfoDisplay,
} from '@/src/sections/performance-detail/utils/performance-detail-display';
import {
  hasClassFormError,
  validateClassForm,
} from '@/src/sections/performance-detail/utils/validate-class-form';
import type { ClassFormInput } from '@/src/types/performance-class';
import type { Performance } from '@/src/types/performance';

const performance: Performance = {
  id: 'p1',
  title: 'fixture-공연',
  type: 'MUSICAL',
  status: 'ONGOING',
  isVisible: false,
  seatSelectionEnabled: false,
  posterImageUrl: null,
  createdAt: '2026-11-18T15:30:00.000Z',
  description: '  ',
  detailImageUrls: ['a', 'b'],
  castPublic: false,
  updatedAt: '2026-11-18T15:30:00.000Z',
};

describe('performance-detail-display', () => {
  it('요일을 월~일 순서 라벨로 잇는다', () => {
    expect(formatClassDays(['FRI', 'MON'])).toBe('월, 금');
  });

  it('요일이 없으면 "-" 로 표시한다', () => {
    expect(formatClassDays([])).toBe('-');
  });

  it('시간은 "HH:MM ~ HH:MM" 로, 하나라도 없으면 "-" 로 표시한다', () => {
    expect(formatClassTime('19:00', '21:00')).toBe('19:00 ~ 21:00');
    expect(formatClassTime('19:00', null)).toBe('-');
  });

  it('공연 정보를 라벨·KST 등록일·노출·상세 이미지 수로 가공한다', () => {
    // Act
    const info = toPerformanceInfoDisplay(performance);
    // Assert
    expect(info.typeLabel).toBe('뮤지컬');
    expect(info.statusLabel).toBe('진행중');
    expect(info.statusTone).toBe('success');
    expect(info.createdAtText).toBe('2026.11.19');
    expect(info.visibleText).toBe('비노출');
    expect(info.detailImageCountText).toBe('2장');
    expect(info.description).toBeNull();
  });

  it('반 행의 마감일이 없으면 "-", 상태는 라벨과 tone 으로 가공한다', () => {
    const row = toClassRowDisplay({
      id: 'c1',
      performanceId: 'p1',
      name: 'fixture-A반',
      daysOfWeek: ['MON'],
      startTime: '19:00',
      endTime: '21:00',
      deadline: null,
      location: null,
      status: 'INACTIVE',
      createdAt: '2026-11-01T00:00:00.000Z',
    });
    expect(row.deadlineText).toBe('-');
    expect(row.statusLabel).toBe('비활성');
    expect(row.statusTone).toBe('neutral');
  });
});

describe('validateClassForm', () => {
  const base: ClassFormInput = {
    name: 'fixture-A반',
    daysOfWeek: [],
    startTime: '',
    endTime: '',
    deadline: '',
    location: '',
    status: 'ACTIVE',
  };

  it('반 이름이 비면 서버와 같은 문구를 돌려준다', () => {
    const errors = validateClassForm({ ...base, name: '  ' });
    expect(errors.name).toBe('반 이름을 입력해주세요.');
    expect(hasClassFormError(errors)).toBe(true);
  });

  it('종료 시간이 시작 시간보다 늦지 않으면 CLS_003 문구를 돌려준다', () => {
    const errors = validateClassForm({
      ...base,
      startTime: '21:00',
      endTime: '21:00',
    });
    expect(errors.time).toBe('종료 일시는 시작 일시 이후여야 합니다.');
  });

  it('올바른 입력이면 오류가 없다', () => {
    expect(
      hasClassFormError(
        validateClassForm({ ...base, startTime: '19:00', endTime: '21:00' })
      )
    ).toBe(false);
  });
});
