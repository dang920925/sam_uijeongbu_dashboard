'use client';

// ----------------------------------------------------------------------
// SCR-D12 '입금 알림' 탭 View(R2) — 설명 → 알림 문구 시험 카드 → 판정 결과 거르기 + 목록 카드(+ 페이지) → 예매 연결 다이얼로그.
// 목록 칸(스켈레톤·오류·빈·표)은 Container 가 골라 넘긴다. props 만으로 렌더.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import type { ReactNode } from 'react';

import { Pagination } from '@/src/components/pagination';
import { SegmentPill } from '@/src/components/segment-pill';
import { Typo } from '@/src/components/typo';
import { DepositMatchDialog } from '@/src/sections/deposit-notifications/components/deposit-match-dialog';
import { DepositPreviewCard } from '@/src/sections/deposit-notifications/components/deposit-preview-card';
import type { DepositNotificationsViewModel } from '@/src/sections/deposit-notifications/view/use-deposit-notifications-view-model';
import { MSG_DEP } from '@/src/shared/messages/deposit-notifications';

interface DepositNotificationsViewProps {
  vm: DepositNotificationsViewModel;
  list: ReactNode;
}

export function DepositNotificationsView({
  vm,
  list,
}: DepositNotificationsViewProps) {
  return (
    <div className='flex flex-col gap-6'>
      <Typo.Body.Regular color='text.secondary'>
        {MSG_DEP.INTRO}
      </Typo.Body.Regular>
      <Card>
        <Box
          sx={{ p: { xs: 4, md: 6 }, borderBottom: 1, borderColor: 'divider' }}
        >
          <SegmentPill
            ariaLabel={MSG_DEP.FILTER_ARIA}
            options={vm.filterOptions}
            value={vm.filter}
            onChange={vm.onFilterChange}
          />
        </Box>
        <Box
          aria-busy={vm.isFetching}
          sx={{
            opacity: vm.isFetching && !vm.isLoading ? 0.6 : 1,
            transition: (t) => t.transitions.create('opacity'),
          }}
        >
          {list}
        </Box>
        <Pagination
          page={vm.page}
          totalPages={vm.totalPages}
          onChange={vm.onPageChange}
        />
      </Card>
      <DepositPreviewCard preview={vm.preview} />
      <DepositMatchDialog match={vm.match} />
    </div>
  );
}
