// ----------------------------------------------------------------------
// SCR-D11 카드 틀 — 머리(Title.Bold h2 + 부제 + 오른쪽 동작) + 본문 + 바닥(선택).
// 패딩 24 / xs 16(designer `ad-card`). isFlush: 본문을 카드 가장자리까지(표·카드 리스트).
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';
import type { ReactNode } from 'react';

import { Typo } from '@/src/components/typo';

interface ShowsSectionCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  isFlush?: boolean;
  /** h2 id — section 이름(aria-labelledby) */
  titleId?: string;
}

export function ShowsSectionCard({
  title,
  subtitle,
  action,
  footer,
  children,
  isFlush = false,
  titleId,
}: ShowsSectionCardProps) {
  return (
    <Card component='section' aria-labelledby={titleId}>
      <div className='flex items-center justify-between gap-3 p-4 md:p-6'>
        <div className='flex min-w-0 flex-col gap-1'>
          <Typo.Title.Bold component='h2' id={titleId}>
            {title}
          </Typo.Title.Bold>
          {subtitle ? (
            <Typo.Caption.Regular color='text.secondary'>
              {subtitle}
            </Typo.Caption.Regular>
          ) : null}
        </div>
        {action ? <div className='shrink-0'>{action}</div> : null}
      </div>
      <div className={isFlush ? '' : 'px-4 pb-4 md:px-6 md:pb-6'}>
        {children}
      </div>
      {footer}
    </Card>
  );
}
