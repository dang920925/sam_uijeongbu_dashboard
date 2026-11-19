// ----------------------------------------------------------------------
// PageHead — 페이지 머리: h1(Title.Bold) + 부제(Badge, secondary) 왼쪽, 주 동작 오른쪽(xs wrap).
// 화면당 h1 1개(designer.md §6). 헤더 "SAM 의정부 관리자 대시보드" 는 h1 이 아니다.
// ----------------------------------------------------------------------
import type { ReactNode } from 'react';

import { Typo } from '@/src/components/typo';

interface PageHeadProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** 제목 왼쪽(예: ← 뒤로 버튼) */
  leading?: ReactNode;
}

export function PageHead({ title, subtitle, actions, leading }: PageHeadProps) {
  return (
    <div className='flex flex-wrap items-start justify-between gap-4'>
      <div className='flex min-w-0 items-start gap-3'>
        {leading}
        <div className='flex min-w-0 flex-col gap-1'>
          <Typo.Title.Bold component='h1' tabIndex={-1} id='page-title'>
            {title}
          </Typo.Title.Bold>
          {subtitle ? (
            <Typo.Badge.Regular color='text.secondary'>
              {subtitle}
            </Typo.Badge.Regular>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className='flex flex-wrap items-center gap-2'>{actions}</div>
      ) : null}
    </div>
  );
}
