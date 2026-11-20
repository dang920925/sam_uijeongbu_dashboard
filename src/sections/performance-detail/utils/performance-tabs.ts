// ----------------------------------------------------------------------
// 공연 상세 탭(design §6 SCR-D11 "기본 정보 · 회차·예매 · (R3) 배역·캐스팅") — 탭은 경로로 구분한다.
// R3 SCR-D14 가 들어오면 'cast' 한 줄(paths.performances.cast)을 더한다.
// ----------------------------------------------------------------------
import { paths } from '@/app/paths';
import { MSG_D04 } from '@/src/shared/messages/d04';

export type PerformanceTabKey = 'info' | 'shows';

export interface PerformanceTab {
  key: PerformanceTabKey;
  label: string;
  href: string;
}

export function performanceTabs(performanceId: string): PerformanceTab[] {
  return [
    {
      key: 'info',
      label: MSG_D04.TAB_INFO,
      href: paths.performances.detail(performanceId),
    },
    {
      key: 'shows',
      label: MSG_D04.TAB_SHOWS,
      href: paths.performances.shows(performanceId),
    },
  ];
}
