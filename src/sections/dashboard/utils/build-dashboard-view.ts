// ----------------------------------------------------------------------
// 요약(SCR-D02) 화면 가공 — 요약 모델 → KPI 4·목록 행(순수 함수, + spec).
// - KPI 순서·문구·색은 현행 Dashboard.tsx:81-108(파랑·에메랄드·앰버·보라).
// - 최근 공연 유형은 영문 코드 대신 한국어 라벨(B16), 상태 배지는 D03·D04 와 같은 매핑(예정=노랑, 사용자 확정).
// - 대기 신청서 설명 줄 = "승인 대기 중 · 연락 전 {n}건"(U31 보강 — design §10.1).
// - 대기 신청 연락처가 비면 '-'(현행 `app.phone || '-'`), 배지는 "대기"(warning).
// ----------------------------------------------------------------------
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D02 } from '@/src/shared/messages/d02';
import type { LabelTone } from '@/src/theme/semantic';
import {
  APPLICATION_STATUS_LABEL,
  PERFORMANCE_STATUS_LABEL,
  PERFORMANCE_TYPE_LABEL,
} from '@/src/types/codes';
import type { DashboardSummary } from '@/src/types/dashboard';
import {
  APPLICATION_STATUS_TONE,
  PERFORMANCE_STATUS_TONE,
} from '@/src/utils/status-tone';

export type DashboardKpiTone = 'blue' | 'emerald' | 'amber' | 'purple';

export interface DashboardKpi {
  key: string;
  title: string;
  value: string;
  description: string;
  icon: string;
  tone: DashboardKpiTone;
}

export interface DashboardListRow {
  id: string;
  primary: string;
  secondary: string;
  labelText: string;
  labelTone: LabelTone;
}

export function toDashboardKpis(summary: DashboardSummary): DashboardKpi[] {
  const { performances } = summary;
  return [
    {
      key: 'performances',
      title: MSG_D02.KPI_PERFORMANCES,
      value: String(performances.total),
      description: MSG_D02.KPI_PERFORMANCES_DESC(
        performances.ongoing,
        performances.upcoming
      ),
      icon: 'solar:masks-linear',
      tone: 'blue',
    },
    {
      key: 'actors',
      title: MSG_D02.KPI_ACTORS,
      value: String(summary.actorCount),
      description: MSG_D02.KPI_ACTORS_DESC,
      icon: 'solar:users-group-rounded-linear',
      tone: 'emerald',
    },
    {
      key: 'pending',
      title: MSG_D02.KPI_PENDING,
      value: String(summary.pendingApplicationCount),
      description: MSG_D02.KPI_PENDING_DESC_UNCONTACTED(
        summary.uncontactedPendingCount
      ),
      icon: 'solar:document-text-linear',
      tone: 'amber',
    },
    {
      key: 'schedules',
      title: MSG_D02.KPI_SCHEDULES,
      value: String(summary.scheduleCount),
      description: MSG_D02.KPI_SCHEDULES_DESC,
      icon: 'solar:calendar-linear',
      tone: 'purple',
    },
  ];
}

export function toRecentPerformanceRows(
  summary: DashboardSummary
): DashboardListRow[] {
  return summary.recentPerformances.map((p) => ({
    id: p.id,
    primary: p.title,
    secondary: PERFORMANCE_TYPE_LABEL[p.type],
    labelText: PERFORMANCE_STATUS_LABEL[p.status],
    labelTone: PERFORMANCE_STATUS_TONE[p.status],
  }));
}

export function toPendingApplicationRows(
  summary: DashboardSummary
): DashboardListRow[] {
  return summary.pendingApplications.map((a) => ({
    id: a.id,
    primary: a.applicantName,
    secondary: a.phone.trim() === '' ? MSG_COMMON.EMPTY_VALUE : a.phone,
    labelText: APPLICATION_STATUS_LABEL.PENDING,
    labelTone: APPLICATION_STATUS_TONE.PENDING,
  }));
}
