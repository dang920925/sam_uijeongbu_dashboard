'use client';

// ----------------------------------------------------------------------
// 관리자 내비 목록 — 사이드바(lg, 라벨) · 레일(md, 아이콘만 + aria-label) · 드로어(xs) 공용.
// 어두운 내비 위 포커스 링은 흰색(designer W3 리드 요청 1).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { isNavActive, NAV_ITEMS } from '@/src/layouts/admin/config-navigation';
import { MSG_D00 } from '@/src/shared/messages/d00';

interface AdminNavProps {
  pathname: string;
  variant: 'sidebar' | 'rail';
  onNavigate?: () => void;
  onLogout: () => void;
  /** xs 드로어: 열리면 포커스를 첫 메뉴로(designer §3.3 전환표 — qa1 QA1-025) */
  autoFocusFirst?: boolean;
}

const itemSx = (isActive: boolean, isRail: boolean) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: isRail ? 'center' : 'flex-start',
  gap: 3,
  minHeight: 44,
  width: isRail ? 44 : '100%',
  px: isRail ? 0 : 3,
  borderRadius: 1.5,
  color: isActive ? 'semantic.nav.itemActive' : 'semantic.nav.item',
  bgcolor: isActive ? 'semantic.nav.itemActiveBg' : 'transparent',
  transition: 'background-color 150ms, color 150ms',
  '&:hover': {
    bgcolor: isActive
      ? 'semantic.nav.itemActiveBg'
      : 'semantic.nav.itemHoverBg',
    color: 'semantic.nav.itemActive',
  },
  '&:focus-visible': {
    outline: 2,
    outlineStyle: 'solid',
    outlineColor: 'semantic.nav.itemActive',
    outlineOffset: 2,
  },
});

export function AdminNav({
  pathname,
  variant,
  onNavigate,
  onLogout,
  autoFocusFirst = false,
}: AdminNavProps) {
  const isRail = variant === 'rail';
  // React autoFocus 는 링크(a)에 동작하지 않아 마운트 뒤 직접 옮긴다(드로어 열림 = 마운트)
  const firstItemRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (!autoFocusFirst) return;
    const frame = requestAnimationFrame(() => firstItemRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [autoFocusFirst]);
  return (
    <>
      <nav
        aria-label={MSG_D00.NAV_LABEL}
        className='flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4'
      >
        {NAV_ITEMS.map((item, index) => {
          const isActive = isNavActive(item, pathname);
          const link = (
            <ButtonBase
              key={item.href}
              ref={index === 0 ? firstItemRef : undefined}
              component={Link}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              aria-label={isRail ? item.label : undefined}
              sx={itemSx(isActive, isRail)}
            >
              <Iconify icon={item.icon} size='md' />
              {isRail ? null : (
                <Typo.Badge.Medium color='inherit'>
                  {item.label}
                </Typo.Badge.Medium>
              )}
            </ButtonBase>
          );
          return isRail ? (
            <Tooltip key={item.href} title={item.label} placement='right'>
              {link}
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          p: 3,
          borderTop: 1,
          borderColor: 'semantic.nav.border',
        }}
      >
        <ButtonBase
          onClick={onLogout}
          aria-label={isRail ? MSG_D00.LOGOUT : undefined}
          sx={itemSx(false, isRail)}
        >
          <Iconify icon='solar:logout-2-linear' size='md' />
          {isRail ? null : (
            <Typo.Badge.Medium color='inherit'>
              {MSG_D00.LOGOUT}
            </Typo.Badge.Medium>
          )}
        </ButtonBase>
      </Box>
    </>
  );
}
