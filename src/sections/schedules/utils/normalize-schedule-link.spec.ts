import { describe, expect, it } from 'vitest';

import { EMPTY_SCHEDULE_FORM } from '@/src/api/schedule-mapper';
import { normalizeScheduleLink } from '@/src/sections/schedules/utils/normalize-schedule-link';

const form = {
  ...EMPTY_SCHEDULE_FORM,
  title: 'fixture',
  performanceId: 'p-deleted',
  classId: 'c1',
};

describe('normalizeScheduleLink', () => {
  it('공연 목록에 없는 연결 공연은 "선택 안 함"으로 비우고 반도 비운다', () => {
    expect(normalizeScheduleLink(form, new Set(['p1']))).toMatchObject({
      performanceId: '',
      classId: '',
    });
  });

  it('목록에 있는 공연이거나 목록을 아직 못 받았으면 그대로 둔다', () => {
    expect(
      normalizeScheduleLink({ ...form, performanceId: 'p1' }, new Set(['p1']))
        .performanceId
    ).toBe('p1');
    expect(normalizeScheduleLink(form, null)).toBe(form);
  });

  it('서버가 null 로 준 공연(반만 연결)은 반을 그대로 둔다', () => {
    const classOnly = { ...form, performanceId: '' };
    expect(normalizeScheduleLink(classOnly, new Set(['p1']))).toBe(classOnly);
  });
});
