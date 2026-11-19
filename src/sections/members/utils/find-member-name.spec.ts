import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { memberKeys } from '@/src/api/member-queries';
import { findMemberNameInLists } from '@/src/sections/members/utils/find-member-name';

const member = {
  id: 'm1',
  name: 'fixture-단원',
  type: 'ACTOR' as const,
  phone: null,
  isVisible: false,
  joinedAt: null,
  createdAt: '2026-11-19T00:00:00.000Z',
  profileImageUrl: null,
};

describe('findMemberNameInLists', () => {
  it('캐시된 목록 어느 쪽에서든 단원 이름을 찾는다', () => {
    // Arrange
    const client = new QueryClient();
    client.setQueryData(memberKeys.list({ page: 2 }), {
      items: [member],
      totalCount: 21,
      totalPages: 2,
      currentPage: 2,
    });
    // Act / Assert
    expect(findMemberNameInLists(client, 'm1')).toBe('fixture-단원');
    expect(findMemberNameInLists(client, 'none')).toBeNull();
  });
});
