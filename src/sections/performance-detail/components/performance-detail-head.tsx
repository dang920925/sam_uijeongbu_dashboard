'use client';

// ----------------------------------------------------------------------
// 공연 상세 머리 — ← "공연 관리로 돌아가기" + h1 공연명 + "공연 상세 정보" + 탭(기본 정보 · 회차·예매).
// SCR-D04(기본 정보)와 SCR-D11(회차·예매)이 같이 쓴다(designer SCR-D11 시안 머리·탭).
// ----------------------------------------------------------------------
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { paths } from '@/app/paths';
import { Iconify } from '@/src/components/iconify';
import { PageHead } from '@/src/components/page-head';
import {
  performanceTabs,
  type PerformanceTabKey,
} from '@/src/sections/performance-detail/utils/performance-tabs';
import { MSG_D04 } from '@/src/shared/messages/d04';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface PerformanceDetailHeadProps {
  performanceId: string;
  title: ReactNode;
  current: PerformanceTabKey;
  actions?: ReactNode;
}

export function PerformanceDetailHead({
  performanceId,
  title,
  current,
  actions,
}: PerformanceDetailHeadProps) {
  return (
    <div className='flex flex-col gap-4'>
      <PageHead
        leading={
          <IconButton
            component={Link}
            href={paths.performances.root}
            aria-label={MSG_D04.BACK}
            sx={{ width: LAYOUT.control, height: LAYOUT.control }}
          >
            <Iconify icon='solar:arrow-left-linear' size='md' />
          </IconButton>
        }
        title={title}
        subtitle={MSG_D04.SUBTITLE}
        actions={actions}
      />
      <Tabs
        value={current}
        aria-label={MSG_D04.TABS_LABEL}
        variant='scrollable'
        allowScrollButtonsMobile
      >
        {performanceTabs(performanceId).map((tab) => (
          <Tab
            key={tab.key}
            value={tab.key}
            label={tab.label}
            component={Link}
            href={tab.href}
            aria-current={tab.key === current ? 'page' : undefined}
          />
        ))}
      </Tabs>
    </div>
  );
}
