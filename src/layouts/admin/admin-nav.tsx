'use client';

// ----------------------------------------------------------------------
// 관리자 내비 목록 — 사이드바(lg, 라벨) · 레일(md, 아이콘만 + aria-label) · 드로어(xs) 공용.
// 어두운 내비 위 포커스 링은 흰색(designer W3 리드 요청 1).
// R1: 묶음 사이 구분선(role=separator) · 하단 계정 설정(SHELL-ADMIN-R1 시안).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
import { Fragment, useEffect, useRef } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import {
  isNavActive,
  NAV_FOOTER_ITEMS,
  NAV_GROUPS,
  type NavItem,
} from '@/src/layouts/admin/config-navigation';
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
  const renderItem = (item: NavItem, isFirst: boolean) => {
    const isActive = isNavActive(item, pathname);
    const link = (
      <ButtonBase
        key={item.href}
        ref={isFirst ? firstItemRef : undefined}
        component={Link}
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        aria-label={isRail ? item.label : undefined}
        sx={itemSx(isActive, isRail)}
      >
        <Iconify icon={item.icon} size='md' />
        {isRail ? null : (
          <Typo.Badge.Medium color='inherit'>{item.label}</Typo.Badge.Medium>
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
  };
  return (
    <>
      <nav
        aria-label={MSG_D00.NAV_LABEL}
        className='flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4'
      >
        {NAV_GROUPS.map((group, groupIndex) => (
          <Fragment key={group[0]?.href ?? groupIndex}>
            {groupIndex > 0 ? (
              <Box
                role='separator'
                sx={{
                  my: 2,
                  mx: isRail ? 'auto' : 3,
                  width: isRail ? 32 : 'auto',
                  borderTop: 1,
                  borderColor: 'semantic.nav.border',
                }}
              />
            ) : null}
            {group.map((item, index) =>
              renderItem(item, groupIndex === 0 && index === 0)
            )}
          </Fragment>
        ))}
      </nav>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          p: 3,
          borderTop: 1,
          borderColor: 'semantic.nav.border',
        }}
      >
        {NAV_FOOTER_ITEMS.map((item) => renderItem(item, false))}
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
