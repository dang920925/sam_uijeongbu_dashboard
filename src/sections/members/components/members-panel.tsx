'use client';

// ----------------------------------------------------------------------
// 단원 상세 패널 틀 — lg: 표 옆 오른쪽 320 카드 / md·xs: MUI Drawer anchor right 전체 폭 시트(D11, designer W4 §1).
// 머리 = 이름(Title.Bold h2) + 닫기(aria-label "닫기", 현행 X 버튼). Drawer 는 포커스 가둠·Esc 닫기 MUI 기본.
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { ReactNode } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface MembersPanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const PANEL_TITLE_ID = 'member-panel-title';

export function MembersPanel({
  open,
  title,
  onClose,
  children,
}: MembersPanelProps) {
  const theme = useTheme();
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));

  const content = (
    <>
      <div className='flex items-center justify-between gap-3 px-4 pt-4 pb-3 lg:px-6 lg:pt-6'>
        <Typo.Title.Bold component='h2' id={PANEL_TITLE_ID}>
          {title}
        </Typo.Title.Bold>
        <IconButton
          aria-label={MSG_COMMON.CLOSE}
          onClick={onClose}
          sx={{ color: 'text.secondary' }}
        >
          <Iconify icon='solar:close-circle-linear' size='md' />
        </IconButton>
      </div>
      <div className='flex flex-col gap-4 px-4 pb-6 lg:px-6'>{children}</div>
    </>
  );

  if (isLg) {
    return open ? (
      <Card
        component='aside'
        aria-labelledby={PANEL_TITLE_ID}
        sx={{ width: LAYOUT.panel, flexShrink: 0, alignSelf: 'flex-start' }}
      >
        {content}
      </Card>
    ) : null;
  }
  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { width: '100%' },
          'aria-labelledby': PANEL_TITLE_ID,
        } as object,
      }}
    >
      {content}
    </Drawer>
  );
}
