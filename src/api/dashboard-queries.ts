'use client';

// ----------------------------------------------------------------------
// 대시보드 요약 쿼리 키와 훅(FN-19). 공연·단원·신청서·일정 변경 쪽이 ROOT_KEYS.dashboard 를 무효화한다.
// ----------------------------------------------------------------------
import { useQuery } from '@tanstack/react-query';

import { fetchDashboardSummary } from '@/src/api/dashboard';
import { ROOT_KEYS } from '@/src/api/root-keys';

export const dashboardKeys = {
  all: ROOT_KEYS.dashboard,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: fetchDashboardSummary,
  });
}
