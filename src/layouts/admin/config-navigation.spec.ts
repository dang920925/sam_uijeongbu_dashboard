import { describe, expect, it } from 'vitest';

import {
  isNavActive,
  NAV_FOOTER_ITEMS,
  NAV_GROUPS,
  NAV_ITEMS,
} from '@/src/layouts/admin/config-navigation';

describe('config-navigation', () => {
  it('메뉴는 현행 6개 + D5 2개 + R1 예매 관리·입장 체크를 시안 순서대로 둔다', () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      '대시보드',
      '공연 관리',
      '예매 관리',
      '입장 체크',
      '단원 관리',
      '신청서 관리',
      '갤러리',
      '일정 관리',
      '연출진 관리',
      '팝업 관리',
    ]);
  });

  it('구분선으로 나뉘는 묶음은 4개이고 계정 설정은 하단 메뉴에 있다', () => {
    expect(NAV_GROUPS.map((group) => group.length)).toEqual([1, 3, 2, 4]);
    expect(NAV_FOOTER_ITEMS.map((item) => item.label)).toEqual(['계정 설정']);
  });

  it('공연 상세·회차 탭 경로에서 "공연 관리" 가 활성이고 대시보드는 정확히 "/" 일 때만 활성이다', () => {
    const [dashboard, performances] = NAV_ITEMS;
    expect(isNavActive(performances, '/performances/abc')).toBe(true);
    expect(isNavActive(performances, '/performances/abc/shows')).toBe(true);
    expect(isNavActive(dashboard, '/performances')).toBe(false);
    expect(isNavActive(dashboard, '/')).toBe(true);
  });
});
