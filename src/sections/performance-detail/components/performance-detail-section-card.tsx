// ----------------------------------------------------------------------
// SCR-D04 카드 틀 — 머리(Title.Bold h2 + 오른쪽 동작) + 본문. 패딩 24 / xs 16(designer `ad-card`).
// isFlush: 본문을 카드 가장자리까지(표·카드 리스트).
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';
import type { ReactNode } from 'react';

import { Typo } from '@/src/components/typo';

interface PerformanceDetailSectionCardProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  isFlush?: boolean;
}

export function PerformanceDetailSectionCard({
  title,
  action,
  children,
  isFlush = false,
}: PerformanceDetailSectionCardProps) {
  return (
    <Card component='section'>
      <div className='flex items-center justify-between gap-3 p-4 md:p-6'>
        <Typo.Title.Bold component='h2'>{title}</Typo.Title.Bold>
        {action}
      </div>
      <div className={isFlush ? 'pb-2' : 'px-4 pb-4 md:px-6 md:pb-6'}>
        {children}
      </div>
    </Card>
  );
}
