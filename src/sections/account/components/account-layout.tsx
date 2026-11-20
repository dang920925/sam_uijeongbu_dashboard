// ----------------------------------------------------------------------
// SCR-D15 열 — 페이지 머리 + 카드를 최대 480 가운데 한 열에 맞춘다(designer 2.1 `--layout-account-max`).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

import { PageHead } from '@/src/components/page-head';
import { MSG_D15 } from '@/src/shared/messages/d15';
import { LAYOUT } from '@/src/theme/layout-tokens';

/** designer `--layout-account-max` */
const ACCOUNT_MAX_WIDTH = LAYOUT.accountMax;

interface AccountLayoutProps {
  children: ReactNode;
}

export function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <Box
      sx={{
        mx: 'auto',
        width: '100%',
        maxWidth: ACCOUNT_MAX_WIDTH,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <PageHead title={MSG_D15.TITLE} subtitle={MSG_D15.SUBTITLE} />
      {children}
    </Box>
  );
}
