// ----------------------------------------------------------------------
// 대시보드 요약 매퍼(FN-19) — 서버 계약(camelCase) → 화면 모델. 순수 함수(+ spec).
// 계약에 없는 필드는 버리고, 목록이 빠져 오면 빈 배열로 둔다(develop §3.1 "배열은 빈 배열").
// ----------------------------------------------------------------------
import type {
  DashboardSummary,
  DashboardSummaryResponse,
} from '@/src/types/dashboard';

export function fromDashboardSummaryResponse(
  res: DashboardSummaryResponse
): DashboardSummary {
  return {
    performances: {
      total: res.performances.total,
      ongoing: res.performances.ongoing,
      upcoming: res.performances.upcoming,
    },
    actorCount: res.actorCount,
    pendingApplicationCount: res.pendingApplicationCount,
    scheduleCount: res.scheduleCount,
    recentPerformances: (res.recentPerformances ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      status: p.status,
    })),
    pendingApplications: (res.pendingApplications ?? []).map((a) => ({
      id: a.id,
      applicantName: a.applicantName,
      phone: a.phone,
      appType: a.appType,
      createdAt: a.createdAt,
    })),
  };
}
