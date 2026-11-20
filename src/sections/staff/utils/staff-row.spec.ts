import { describe, expect, it } from 'vitest';

import { toStaffRow } from '@/src/sections/staff/utils/staff-row';

const STAFF = {
  id: 's1',
  name: 'fixture-연출',
  role: '연출',
  profileImageUrl: null,
  bio: null,
  displayOrder: 1,
  isVisible: true,
  createdAt: '2026-11-19T00:00:00.000Z',
};

describe('toStaffRow', () => {
  it('노출이면 success "노출", 소개가 없으면 "-" 로 표시한다', () => {
    expect(toStaffRow(STAFF)).toMatchObject({
      bio: '-',
      visibleLabel: '노출',
      visibleTone: 'success',
    });
  });

  it('비노출이면 neutral "비노출" 로 표시한다', () => {
    expect(
      toStaffRow({ ...STAFF, isVisible: false, bio: '소개' })
    ).toMatchObject({
      bio: '소개',
      visibleLabel: '비노출',
      visibleTone: 'neutral',
    });
  });
});
