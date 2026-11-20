import { describe, expect, it } from 'vitest';

import {
  fromInviteCodeItemResponse,
  toInviteLink,
} from '@/src/api/invite-code-mapper';

describe('fromInviteCodeItemResponse', () => {
  it('빈 코드는 null 로 정규화한다', () => {
    // Arrange
    const res = {
      memberId: 'm-1',
      name: '홍길동',
      type: 'ACTOR' as const,
      inviteCode: '',
    };
    // Act
    const member = fromInviteCodeItemResponse(res);
    // Assert
    expect(member).toEqual({ ...res, inviteCode: null });
  });
});

describe('toInviteLink', () => {
  it('홈페이지 주소·공연·코드로 예매 링크를 만든다(끝 / 제거)', () => {
    expect(toInviteLink('https://example.test/', 'p-1', 'ABC234')).toBe(
      'https://example.test/works/p-1/book?ref=ABC234'
    );
  });

  it('주소·공연·코드 중 하나라도 없으면 null 을 준다', () => {
    expect(toInviteLink(null, 'p-1', 'ABC234')).toBeNull();
    expect(toInviteLink('https://example.test', null, 'ABC234')).toBeNull();
    expect(toInviteLink('https://example.test', 'p-1', null)).toBeNull();
  });
});
