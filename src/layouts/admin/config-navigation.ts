// ----------------------------------------------------------------------
// 사이드바 메뉴 — 순서·라벨은 현행(Layout.tsx:14-21) + D5 확정 2개. 아이콘 lucide → solar(designer §2.8).
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

export const NAV_ITEMS: NavItem[] = [
  {
    href: paths.dashboard,
    label: MSG_D00.NAV_DASHBOARD,
    icon: 'solar:widget-5-linear',
    exact: true,
  },
  {
    href: paths.performances.root,
    label: MSG_D00.NAV_PERFORMANCES,
    icon: 'solar:masks-linear',
  },
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
];

export function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
