// ----------------------------------------------------------------------
// 요약(SCR-D02) 페이지 틀 — 머리("대시보드"/부제)는 로딩·오류·기본 상태 모두 같은 자리에 둔다.
// ----------------------------------------------------------------------
import type { ReactNode } from 'react';

import { PageContainer } from '@/src/components/page-container';
import { PageHead } from '@/src/components/page-head';
import { SectionStack } from '@/src/components/section-stack';
import { MSG_D02 } from '@/src/shared/messages/d02';

interface DashboardPageShellProps {
  children: ReactNode;
}

export function DashboardPageShell({ children }: DashboardPageShellProps) {
  return (
    <PageContainer>
      <SectionStack>
        <PageHead title={MSG_D02.TITLE} subtitle={MSG_D02.SUBTITLE} />
        {children}
      </SectionStack>
    </PageContainer>
  );
}
