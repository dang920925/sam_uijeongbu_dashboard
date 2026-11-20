// ----------------------------------------------------------------------
// 사이드바 메뉴 — 현행(Layout.tsx:14-21) + D5 확정 2개 + R1(U24·U25) 3개. 아이콘 lucide → solar(designer §2.8).
// R1 시안(SHELL-ADMIN-R1)대로 업무 묶음 사이에 구분선을 두고, 계정 설정은 하단(로그아웃 위)에 둔다.
// 묶음: 대시보드 / 공연·예매·입장 / 단원·신청서 / 콘텐츠(갤러리·일정·연출진·팝업).
// 나중에 들어올 자리(기획 §15·§17): R3 배역·캐스팅(SCR-D14)은 공연 상세의 탭이라 메뉴가 늘지 않고,
// U23 캘린더·U29 일정 취소는 기존 "일정 관리" 화면 변경이다. 새 메뉴가 생기면 해당 묶음 배열에 한 줄 더한다.
// ----------------------------------------------------------------------
import { paths } from '@/app/paths';
import { MSG_D00 } from '@/src/shared/messages/d00';

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** '/' 는 정확히 일치할 때만 활성 */
  exact?: boolean;
}

/** 본문 메뉴 — 바깥 배열 하나가 구분선으로 나뉘는 묶음 */
export const NAV_GROUPS: NavItem[][] = [
  [
    {
      href: paths.dashboard,
      label: MSG_D00.NAV_DASHBOARD,
      icon: 'solar:widget-5-linear',
      exact: true,
    },
  ],
  [
    {
      href: paths.performances.root,
      label: MSG_D00.NAV_PERFORMANCES,
      icon: 'solar:masks-linear',
    },
    {
      href: paths.reservations,
      label: MSG_D00.NAV_RESERVATIONS,
      icon: 'solar:ticket-sale-linear',
    },
    {
      href: paths.admission,
      label: MSG_D00.NAV_ADMISSION,
      icon: 'solar:login-3-linear',
    },
  ],
  [
    {
      href: paths.members.root,
      label: MSG_D00.NAV_MEMBERS,
      icon: 'solar:users-group-rounded-linear',
    },
    {
      href: paths.applications,
      label: MSG_D00.NAV_APPLICATIONS,
      icon: 'solar:document-text-linear',
    },
  ],
  [
    {
      href: paths.gallery,
      label: MSG_D00.NAV_GALLERY,
      icon: 'solar:gallery-linear',
    },
    {
      href: paths.schedules,
      label: MSG_D00.NAV_SCHEDULES,
      icon: 'solar:calendar-linear',
    },
    {
      href: paths.staff,
      label: MSG_D00.NAV_STAFF,
      icon: 'solar:clapperboard-linear',
    },
    {
      href: paths.popups,
      label: MSG_D00.NAV_POPUPS,
      icon: 'solar:window-frame-linear',
    },
  ],
];

/** 하단 메뉴(로그아웃 위) — SCR-D15 계정 설정(design §6 "사이드바 하단") */
export const NAV_FOOTER_ITEMS: NavItem[] = [
  {
    href: paths.account,
    label: MSG_D00.NAV_ACCOUNT,
    icon: 'solar:user-id-linear',
  },
];

/** 본문 메뉴를 한 줄로(순서 검사·첫 메뉴 포커스용) */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flat();

export function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
