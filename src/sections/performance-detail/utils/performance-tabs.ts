// ----------------------------------------------------------------------
// 공연 상세 탭(design §6 SCR-D11 "기본 정보 · 회차·예매 · (R3) 배역·캐스팅") — 탭은 경로로 구분한다.
// U34 '팀 계정' · R3 SCR-D14 '배역·캐스팅'(paths.performances.cast) — v1.3.0 순서: 기본 정보 · 회차·예매 · 배역·캐스팅 · 팀 계정.
// ----------------------------------------------------------------------
import { paths } from '@/app/paths';
import { MSG_D04 } from '@/src/shared/messages/d04';

export type PerformanceTabKey = 'info' | 'shows' | 'cast' | 'teams';

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
    {
      key: 'cast',
      label: MSG_D04.TAB_CAST,
      href: paths.performances.cast(performanceId),
    },
    // U34 팀 계정(연습실 예약용 — design §13)
    {
      key: 'teams',
      label: MSG_D04.TAB_TEAMS,
      href: paths.performances.teams(performanceId),
    },
  ];
}
