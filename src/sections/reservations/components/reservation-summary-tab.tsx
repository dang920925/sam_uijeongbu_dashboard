// ----------------------------------------------------------------------
// 집계 탭(designer tab-summary) — 회차별 집계 · 등급별 집계(회차 × 등급, 공연 합계·확정 금액) · 단원별 초대.
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';

import { ErrorRetry } from '@/src/components/error-retry';
import { SectionStack } from '@/src/components/section-stack';
import { SummaryTableCard } from '@/src/sections/reservations/components/summary-table-card';
import type { SummaryTable } from '@/src/sections/reservations/utils/summary-view';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D12 } from '@/src/shared/messages/d12';

interface ReservationSummaryTabProps {
  showSummary: SummaryTable | null;
  tierSummary: SummaryTable | null;
  inviterSummary: SummaryTable | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}

export function ReservationSummaryTab({
  showSummary,
  tierSummary,
  inviterSummary,
  isLoading,
  errorMessage,
  onRetry,
}: ReservationSummaryTabProps) {
  if (errorMessage)
    return (
      <Card>
        <ErrorRetry message={errorMessage} onRetry={onRetry} />
      </Card>
    );
  if (isLoading || !showSummary || !tierSummary || !inviterSummary)
    return (
      <div aria-busy='true' aria-label={MSG_COMMON.LOADING_ARIA}>
        <Skeleton variant='rounded' height={240} />
      </div>
    );
  return (
    <SectionStack>
      <SummaryTableCard
        title={MSG_D12.SUM_SHOW_TITLE}
        caption={MSG_D12.SUM_SHOW_CAP}
        table={showSummary}
      />
      <SummaryTableCard
        title={MSG_D12.SUM_TIER_TITLE}
        caption={`${MSG_D12.SUM_TIER_CAP} · ${MSG_D12.SUM_TIER_AMOUNT_NOTE}`}
        table={tierSummary}
      />
      <SummaryTableCard
        title={MSG_D12.SUM_INV_TITLE}
        caption={MSG_D12.SUM_INV_CAP}
        table={inviterSummary}
      />
    </SectionStack>
  );
}
