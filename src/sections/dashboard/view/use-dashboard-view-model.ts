'use client';

// ----------------------------------------------------------------------
// 요약(SCR-D02) ViewModel — 서버 요약(FN-19) 1회 조회 → KPI·목록 행으로 가공(utils 위임). JSX 없음.
// "다시 시도" 로 재조회하는 동안은 오류 대신 스켈레톤을 보인다(버튼 연타 방지).
// ----------------------------------------------------------------------
import { useDashboardSummary } from '@/src/api/dashboard-queries';
import {
  toDashboardKpis,
  toPendingApplicationRows,
  toRecentPerformanceRows,
} from '@/src/sections/dashboard/utils/build-dashboard-view';

export function useDashboardViewModel() {
  const query = useDashboardSummary();
  const summary = query.data;
  return {
    isLoading: query.isPending || (query.isError && query.isFetching),
    isError: query.isError,
    kpis: summary ? toDashboardKpis(summary) : [],
    recentRows: summary ? toRecentPerformanceRows(summary) : [],
    pendingRows: summary ? toPendingApplicationRows(summary) : [],
    onRetry: () => {
      void query.refetch();
    },
  };
}
