import { describe, expect, it } from 'vitest';

import {
  fromAdminStaffItemResponse,
  toDisplayOrder,
  toStaffFormInput,
  toStaffUpsertRequest,
} from '@/src/api/staff-mapper';

const RESPONSE = {
  id: 's1',
  name: 'fixture-연출',
  role: '연출',
  profileImageUrl: null,
  bio: null,
  displayOrder: 2,
  isVisible: false,
  createdAt: '2026-11-19T00:00:00.000Z',
};

describe('staff-mapper', () => {
  it('이름·역할 공백을 지우고 빈 소개는 null, 노출 순서는 정수로 요청을 만든다', () => {
    // Act
    const request = toStaffUpsertRequest({
      name: ' 홍 ',
      role: ' 연출 ',
      profileImageUrl: null,
      bio: '  ',
      displayOrder: '3',
      isVisible: true,
      histories: [{ key: 'h1', year: ' 2024 ', content: ' fixture-연혁 ' }],
    });
    // Assert
    expect(request).toEqual({
      name: '홍',
      role: '연출',
      profileImageUrl: null,
      bio: null,
      displayOrder: 3,
      isVisible: true,
      histories: [{ year: 2024, content: 'fixture-연혁' }],
    });
  });

  it('노출 순서 입력이 숫자가 아니거나 음수면 0, 소수는 버린다', () => {
    expect(toDisplayOrder('')).toBe(0);
    expect(toDisplayOrder('abc')).toBe(0);
    expect(toDisplayOrder('-2')).toBe(0);
    expect(toDisplayOrder('4.7')).toBe(4);
  });

  it('응답의 null 을 화면 모델에 그대로 두고 수정 폼 값으로 바꾼다', () => {
    // Act
    const staff = fromAdminStaffItemResponse(RESPONSE);
    const form = toStaffFormInput(staff);
    // Assert
    expect(staff).toEqual({ ...RESPONSE, histories: [] });
    expect(form).toEqual({
      name: 'fixture-연출',
      role: '연출',
      profileImageUrl: null,
      bio: '',
      displayOrder: '2',
      isVisible: false,
      histories: [],
    });
  });

  it('연혁 응답을 입력 줄로 옮긴다(순서 유지, 옛 응답이면 빈 배열)', () => {
    const staff = fromAdminStaffItemResponse({
      ...RESPONSE,
      histories: [
        { year: 2024, content: 'a' },
        { year: 2019, content: 'b' },
      ],
    });

    expect(
      toStaffFormInput(staff).histories.map((row) => [row.year, row.content])
    ).toEqual([
      ['2024', 'a'],
      ['2019', 'b'],
    ]);
  });
});
