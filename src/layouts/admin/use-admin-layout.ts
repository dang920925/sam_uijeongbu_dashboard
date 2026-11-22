'use client';

// ----------------------------------------------------------------------
// AdminLayout ViewModel — 현재 경로, 드로어 상태, 로그아웃(BFF 쿠키 삭제 → 로그인 이동).
// 페이지 이동 뒤 포커스를 h1(#page-title)로 옮긴다(designer §4 "이동 후 포커스 h1").
// (U40) 요약을 읽어 메뉴 배지(예매 관리: 입금 대기 · 신청서 관리: 연락 전)를 주고, 앱 아이콘 배지를 입금 대기 수로 맞춘다
// (지원하지 않는 브라우저는 조용히 — lib/app-badge). 요약은 예매·신청 변경 때 무효화돼 다시 읽힌다.
// ----------------------------------------------------------------------
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import { paths } from '@/app/paths';
import { useLogoutMutation } from '@/src/api/auth-queries';
import { useDashboardSummary } from '@/src/api/dashboard-queries';
import { syncAppBadge } from '@/src/lib/app-badge';
import type { NavBadgeKey } from '@/src/utils/nav-badge';
import { focusPageTitleWhenReady } from '@/src/layouts/admin/focus-page-title';
import { useLayoutStore } from '@/src/stores/layout-store';

export function useAdminLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const isDrawerOpen = useLayoutStore((s) => s.isNavDrawerOpen);
  const openDrawer = useLayoutStore((s) => s.openNavDrawer);
  const closeDrawer = useLayoutStore((s) => s.closeNavDrawer);
  const logoutMutation = useLogoutMutation();
  const previousPath = useRef(pathname);
  const summary = useDashboardSummary().data;
  const pendingReservationCount = summary?.pendingReservationCount;

  useEffect(() => {
    if (pendingReservationCount === undefined) return;
    syncAppBadge(pendingReservationCount);
  }, [pendingReservationCount]);

  const badges: Partial<Record<NavBadgeKey, number>> = summary
    ? {
        reservations: summary.pendingReservationCount,
        applications: summary.uncontactedPendingCount,
      }
    : {};

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    closeDrawer();
    return focusPageTitleWhenReady(document);
  }, [pathname, closeDrawer]);

  const handleLogout = useCallback(() => {
    logoutMutation.mutate(undefined, {
      onSettled: () => router.replace(paths.login),
    });
  }, [logoutMutation, router]);

  return {
    pathname,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    handleLogout,
    badges,
  };
}
