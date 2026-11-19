'use client';

// ----------------------------------------------------------------------
// AdminLayout ViewModel — 현재 경로, 드로어 상태, 로그아웃(BFF 쿠키 삭제 → 로그인 이동).
// 페이지 이동 뒤 포커스를 h1(#page-title)로 옮긴다(designer §4 "이동 후 포커스 h1").
// ----------------------------------------------------------------------
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import { paths } from '@/app/paths';
import { useLogoutMutation } from '@/src/api/auth-queries';
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

  return { pathname, isDrawerOpen, openDrawer, closeDrawer, handleLogout };
}
