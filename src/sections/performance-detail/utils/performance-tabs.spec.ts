import { describe, expect, it } from 'vitest';

import { performanceTabs } from '@/src/sections/performance-detail/utils/performance-tabs';

describe('performanceTabs', () => {
  it('기본 정보·회차·예매·배역·캐스팅·팀 계정 탭을 공연 id 경로로 만든다', () => {
    // Act
    const tabs = performanceTabs('p-1');
    // Assert
    expect(tabs).toEqual([
      { key: 'info', label: '기본 정보', href: '/performances/p-1' },
      { key: 'shows', label: '회차·예매', href: '/performances/p-1/shows' },
      { key: 'cast', label: '배역·캐스팅', href: '/performances/p-1/cast' },
      { key: 'teams', label: '팀 계정', href: '/performances/p-1/teams' },
    ]);
  });
});
