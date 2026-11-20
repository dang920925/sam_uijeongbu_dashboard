// ----------------------------------------------------------------------
// 목 대시보드 요약(FN-19) — develop §3.4 `GET /admin/dashboard/summary`.
// 공연 총수·진행·예정(미삭제, 상한 없음 — B10 재발 방지), 배우 수(type=ACTOR·미삭제), 대기 신청 수(PENDING),
// 일정 수(미삭제), 최근 공연 5·대기 신청 5(createdAt desc — 같은 시각이면 시간순 id desc).
// `POST /v1/__mock/seed/dashboard`(auth 없음)는 E2E 전용 픽스처 주입 — 단원·신청서·일정 핸들러가
// 다른 작업자 소유라 요약 집계 검증에 필요한 행만 직접 넣는다(시드 데이터 아님, 요청할 때만).
// ----------------------------------------------------------------------
import {
  json,
  newId,
  noContent,
  str,
  validationError,
  type MockContext,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { isWaitingApplication } from '@/src/_mock/backend/handlers/applications';
import { getStore } from '@/src/_mock/backend/mock-store';
import {
  APPLICATION_PROGRESSES,
  type ApplicationProgress,
  type MemberType,
} from '@/src/types/codes';
import type { DashboardSummaryResponse } from '@/src/types/dashboard';

const RECENT_LIMIT = 5;

function byCreatedThenIdDesc<T extends { createdAt: string; id: string }>(
  a: T,
  b: T
): number {
  return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
}

function buildSummary(): DashboardSummaryResponse {
  const store = getStore();
  const performances = store.performances.filter((p) => p.deletedAt === null);
  // (U39) 대기 = 진행 RECEIVED 또는 연락 전(끝난 신청 제외) — 연락 전 건수는 끝나지 않은 연락 전
  const pending = store.applications.filter(isWaitingApplication);
  return {
    performances: {
      total: performances.length,
      ongoing: performances.filter((p) => p.status === 'ONGOING').length,
      upcoming: performances.filter((p) => p.status === 'UPCOMING').length,
    },
    actorCount: store.members.filter(
      (m) => m.type === 'ACTOR' && m.deletedAt === null
    ).length,
    pendingApplicationCount: pending.length,
    uncontactedPendingCount: store.applications.filter(
      (a) =>
        a.contactedAt === null &&
        a.progress !== 'JOINED' &&
        a.progress !== 'DROPPED'
    ).length,
    scheduleCount: store.schedules.filter((s) => s.deletedAt === null).length,
    recentPerformances: [...performances]
      .sort(byCreatedThenIdDesc)
      .slice(0, RECENT_LIMIT)
      .map(({ id, title, type, status }) => ({ id, title, type, status })),
    pendingApplications: [...pending]
      .sort(byCreatedThenIdDesc)
      .slice(0, RECENT_LIMIT)
      .map(({ id, applicantName, phone, appType, createdAt }) => ({
        id,
        applicantName,
        phone,
        appType,
        createdAt,
      })),
  };
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (v): v is Record<string, unknown> => typeof v === 'object' && v !== null
      )
    : [];
}

/** E2E 픽스처 주입 — 이름은 fixture- 접두사만 받는다(실데이터처럼 보이지 않게) */
function seed(ctx: MockContext): Response {
  const store = getStore();
  const base = Date.now();
  let offset = 0;
  const nextCreatedAt = () => new Date(base + offset++).toISOString();
  const members = records(ctx.body.members);
  const applications = records(ctx.body.applications);
  const schedules = records(ctx.body.schedules);
  const names = [
    ...members.map((m) => str(m.name)),
    ...applications.map((a) => str(a.applicantName)),
    ...schedules.map((s) => str(s.title)),
  ];
  if (names.some((name) => !name?.startsWith('fixture-')))
    return validationError(ctx);

  for (const m of members) {
    store.members.push({
      id: newId(),
      name: str(m.name) ?? '',
      type: m.type === 'ACTOR' ? 'ACTOR' : ('GENERAL' as MemberType),
      phone: null,
      isVisible: true,
      inviterListed: m.inviterListed !== false,
      joinedAt: null,
      createdAt: nextCreatedAt(),
      profileImageUrl: null,
      deletedAt: m.deleted === true ? nextCreatedAt() : null,
    });
  }
  for (const a of applications) {
    store.applications.push({
      id: newId(),
      appType: 'CONSULTATION',
      applicantName: str(a.applicantName) ?? '',
      phone: str(a.phone) ?? '',
      performance: null,
      preferredDate: null,
      preferredTime: null,
      motivation: null,
      consultationMethod: 'PHONE',
      question: null,
      age: null,
      gender: null,
      status:
        a.status === 'APPROVED' || a.status === 'REJECTED'
          ? a.status
          : 'PENDING',
      processedAt: null,
      createdAt: nextCreatedAt(),
      memberId: null,
      interestedPerformances: [],
      interestUndecided: null,
      contactedAt: a.contacted === true ? nextCreatedAt() : null,
      contactNote: null,
      // (U39) 시드가 진행을 주면 그대로(코드값 검사), 아니면 거절 → DROPPED · 그 밖 RECEIVED
      progress: APPLICATION_PROGRESSES.includes(
        a.progress as ApplicationProgress
      )
        ? (a.progress as ApplicationProgress)
        : a.status === 'REJECTED'
          ? 'DROPPED'
          : 'RECEIVED',
      progressUpdatedAt: null,
    });
  }
  for (const s of schedules) {
    const createdAt = nextCreatedAt();
    store.schedules.push({
      id: newId(),
      title: str(s.title) ?? '',
      type: 'EVENT',
      startAt: createdAt,
      endAt: null,
      location: null,
      description: null,
      classId: null,
      performanceId: null,
      status: 'ACTIVE',
      cancelReason: null,
      observationClosed: null,
      deletedAt: s.deleted === true ? createdAt : null,
    });
  }
  return noContent();
}

export const dashboardRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/dashboard\/summary$/,
    auth: true,
    handle: () => json(buildSummary()),
  },
  {
    method: 'POST',
    pattern: /^\/v1\/__mock\/seed\/dashboard$/,
    auth: false,
    handle: seed,
  },
];
