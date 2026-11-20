import { describe, expect, it } from 'vitest';

import { EMPTY_SCHEDULE_FORM } from '@/src/api/schedule-mapper';
import {
  emptyAddForm,
  monthAddForm,
  weekAddForm,
} from '@/src/sections/schedules/utils/schedule-add-default';

describe('schedule-add-default', () => {
  it('머리 버튼·목록 보기 추가 기본값은 현행 빈 값이다(U-6·J-63)', () => {
    expect(emptyAddForm()).toEqual(EMPTY_SCHEDULE_FORM);
  });

  it('월 빈 자리 추가 기본값은 "{날짜}T00:00" 이다(U-6·J-19)', () => {
    expect(monthAddForm('2026-12-03')).toMatchObject({
      startAt: '2026-12-03T00:00',
      endAt: '',
      type: 'PRACTICE',
    });
  });

  it('주 빈 칸 19:30 은 시작 19:30·종료 20:30 이다(J-60·E-13)', () => {
    expect(weekAddForm('2026-12-08', 19 * 60 + 30)).toMatchObject({
      startAt: '2026-12-08T19:30',
      endAt: '2026-12-08T20:30',
    });
  });

  it('23:30 칸의 종료는 다음 날 00:30 이다', () => {
    expect(weekAddForm('2026-12-31', 23 * 60 + 30)).toMatchObject({
      startAt: '2026-12-31T23:30',
      endAt: '2027-01-01T00:30',
    });
  });
});
