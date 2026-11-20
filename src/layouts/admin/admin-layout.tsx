'use client';

// ----------------------------------------------------------------------
// AdminLayout(SCR-D00) — lg 사이드바 240 / md 아이콘 레일 72 / xs 햄버거 → 왼쪽 드로어 240(D11).
// 헤더 64 "SAM 의정부 관리자 대시보드"(xs "SAM 의정부", h1 아님) + 오른쪽 '예매번호로 찾기'(quick-search, §6.1a). 본문 여백 xs 16 / md↑ 24.
// 랜드마크: nav(사이드바) · header · main.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import type { ReactNode } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { AdminNav } from '@/src/layouts/admin/admin-nav';
import { QuickSearch } from '@/src/layouts/admin/quick-search/quick-search';
import { useAdminLayout } from '@/src/layouts/admin/use-admin-layout';
import { MSG_D00 } from '@/src/shared/messages/d00';
import { LAYOUT, SHADOW } from '@/src/theme/layout-tokens';

interface AdminLayoutProps {
  children: ReactNode;
}

const logoSx = {
  height: LAYOUT.header,
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  borderBottom: 1,
  borderColor: 'semantic.nav.border',
  color: 'semantic.nav.itemActive',
  letterSpacing: '0.025em',
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const { pathname, isDrawerOpen, openDrawer, closeDrawer, handleLogout } =
    useAdminLayout();

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        bgcolor: 'background.default',
      }}
    >
      <Box
        component='aside'
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          width: LAYOUT.sidebar,
          flexShrink: 0,
          bgcolor: 'semantic.nav.bg',
          position: 'sticky',
          top: 0,
          height: '100dvh',
        }}
      >
        <Box sx={{ ...logoSx, px: 6 }}>
          <Typo.Title.Bold color='inherit'>{MSG_D00.LOGO}</Typo.Title.Bold>
        </Box>
        <AdminNav
          pathname={pathname}
          variant='sidebar'
          onLogout={handleLogout}
        />
      </Box>

      <Box
        component='aside'
        sx={{
          display: { xs: 'none', md: 'flex', lg: 'none' },
          flexDirection: 'column',
          alignItems: 'center',
          width: LAYOUT.rail,
          flexShrink: 0,
          bgcolor: 'semantic.nav.bg',
          position: 'sticky',
          top: 0,
          height: '100dvh',
        }}
      >
        <Box sx={{ ...logoSx, width: '100%', justifyContent: 'center' }}>
          <Typo.Caption.Bold color='inherit'>
            {MSG_D00.RAIL_LOGO}
          </Typo.Caption.Bold>
        </Box>
        <AdminNav pathname={pathname} variant='rail' onLogout={handleLogout} />
      </Box>

      <Drawer
        open={isDrawerOpen}
        onClose={closeDrawer}
        // 컨테이너 대신 첫 메뉴(autoFocusFirst)가 포커스를 받게(qa1 QA1-025). 포커스 가둠은 그대로
        ModalProps={{ disableAutoFocus: true }}
        sx={{ display: { md: 'none' } }}
        slotProps={{
          paper: {
            sx: {
              width: LAYOUT.sidebar,
              bgcolor: 'semantic.nav.bg',
              boxShadow: SHADOW.drawer,
              border: 0,
            },
          },
        }}
      >
        <Box sx={{ ...logoSx, px: 6 }}>
          <Typo.Title.Bold color='inherit'>{MSG_D00.LOGO}</Typo.Title.Bold>
        </Box>
        <AdminNav
          pathname={pathname}
          variant='sidebar'
          onNavigate={closeDrawer}
          onLogout={handleLogout}
          autoFocusFirst
        />
      </Drawer>

      <Box
        sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}
      >
        <Box
          component='header'
          sx={{
            height: LAYOUT.header,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            px: { xs: 4, md: 6 },
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            color: 'semantic.text.header',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <IconButton
            aria-label={MSG_D00.OPEN_MENU}
            onClick={openDrawer}
            sx={{
              display: { md: 'none' },
              ml: -2,
              color: 'text.primary',
              width: 44,
              height: 44,
            }}
          >
            <Iconify icon='solar:hamburger-menu-linear' size='lg' />
          </IconButton>
          <Typo.Body.Semibold
            color='inherit'
            sx={{ display: { xs: 'none', md: 'block' } }}
          >
            {MSG_D00.HEADER}
          </Typo.Body.Semibold>
          <Typo.Body.Semibold color='inherit' sx={{ display: { md: 'none' } }}>
            {MSG_D00.LOGO}
          </Typo.Body.Semibold>
          <QuickSearch />
        </Box>
        <Box
          component='main'
          sx={{ flex: 1, p: { xs: 4, md: 6 }, minWidth: 0 }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
