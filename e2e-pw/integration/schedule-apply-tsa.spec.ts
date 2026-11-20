// ----------------------------------------------------------------------
// T-SA 연동(리드) — U29 일정 취소 · U31 신청서 연락·진행 · U23 캘린더(달을 걸치는 주) · 요약 연락 전 건수.
// 관리 API 는 대시보드 BFF(세션 쿠키)로 부른다 — 화면과 같은 경로이고 U27 재검증 호출 경로이기도 하다.
// ----------------------------------------------------------------------
import { expect, test, type APIRequestContext } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
  relayPost,
} from '@/e2e-pw/integration/support/integration-api';

const PREFIX = fixturePrefix('tsa');
const API = '/api/backend/v1/admin';

function kstDate(offsetDays: number): string {
  return new Date(Date.now() + 9 * 3600_000 + offsetDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

async function bff<T>(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  data?: unknown
): Promise<{ status: number; body: T }> {
  const response = await request.fetch(`${API}${path}`, { method, data });
  const text = await response.text();
  return {
    status: response.status(),
    body: (text ? JSON.parse(text) : undefined) as T,
  };
}

test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

test.describe('T-SA 일정 취소·신청 연락·캘린더', () => {
  test.describe.configure({ mode: 'serial' });

  let performanceId = '';
  let scheduleId = '';
  const practiceDate = kstDate(4);

  test.beforeAll(async () => {
    performanceId = (
      await adminApi<{ id: string }>('POST', '/admin/performances', {
        title: `${PREFIX}작품`,
        type: 'PLAY',
        status: 'ONGOING',
        description: null,
        posterImageUrl: null,
        detailImageUrls: [],
        isVisible: true,
      })
    ).id;
    const classId = (
      await adminApi<{ id: string }>(
        'POST',
        `/admin/performances/${performanceId}/classes`,
        {
          name: `${PREFIX}반`,
          daysOfWeek: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
          startTime: '19:00',
          endTime: '21:00',
          deadline: null,
          location: null,
          status: 'ACTIVE',
        }
      )
    ).id;
    scheduleId = (
      await adminApi<{ id: string }>('POST', '/admin/schedules', {
        title: `${PREFIX}연습`,
        type: 'PRACTICE',
        startAt: `${practiceDate}T19:00:00+09:00`,
        endAt: `${practiceDate}T21:00:00+09:00`,
        location: null,
        description: null,
        classId,
        performanceId: null,
      })
    ).id;
    // 그 날짜·공연의 참관 신청 2건(대기) + 다른 날짜 1건 — cancel-impact 는 2건이어야 한다
    for (const [index, date] of [
      practiceDate,
      practiceDate,
      kstDate(6),
    ].entries()) {
      const res = await relayPost('/applications', {
        appType: 'WORK_OBSERVATION',
        performanceId,
        applicantName: `${PREFIX}참관${index}`,
        phone: `010-3200-000${index}`,
        preferredDate: date,
        agreedToPrivacy: true,
      });
      expect(res.status, JSON.stringify(res.body)).toBe(201);
    }
  });

  test('cancel-impact 는 그 날짜·공연의 참관 신청 건수를 주고, 취소·이중 취소·해제가 계약대로다', async ({
    request,
  }) => {
    const impact = await bff<{
      observationApplications: { count: number };
    }>(request, 'GET', `/schedules/${scheduleId}/cancel-impact`);
    expect(impact.status).toBe(200);
    expect(impact.body.observationApplications.count).toBe(2);

    const cancelled = await bff<{ status: string; cancelReason: string }>(
      request,
      'POST',
      `/schedules/${scheduleId}/cancel`,
      { reason: '공연 단체관람', observationClosed: true }
    );
    expect(cancelled.status).toBe(200);
    expect(cancelled.body).toMatchObject({
      status: 'CANCELLED',
      cancelReason: '공연 단체관람',
    });
    const again = await bff<{ code: string }>(
      request,
      'POST',
      `/schedules/${scheduleId}/cancel`,
      { reason: '다시', observationClosed: false }
    );
    expect(again.body.code).toBe('SCH_003');

    // 신청서 목록에 그 날 취소가 붙는다(scheduleCancellation)
    const list = await bff<{
      items: { applicantName: string; scheduleCancellation: unknown }[];
    }>(request, 'GET', `/applications?performanceId=${performanceId}`);
    const onDate = list.body.items.filter((item) =>
      item.applicantName.startsWith(`${PREFIX}참관`)
    );
    expect(onDate.filter((item) => item.scheduleCancellation).length).toBe(2);
  });

  test('신청서 연락·진행 PATCH, 연락 전·진행 필터, 연락 시각 정렬, 요약 연락 전 건수', async ({
    request,
  }) => {
    const summaryBefore = await bff<{ uncontactedPendingCount: number }>(
      request,
      'GET',
      '/dashboard/summary'
    );
    const list = await bff<{ items: { id: string; applicantName: string }[] }>(
      request,
      'GET',
      `/applications?performanceId=${performanceId}`
    );
    const target = list.body.items.find(
      (item) => item.applicantName === `${PREFIX}참관0`
    );
    expect(target).toBeDefined();
    const contact = await bff<{
      contactedAt: string | null;
      contactNote: string;
    }>(request, 'PATCH', `/applications/${target?.id}/contact`, {
      contacted: true,
      note: '문자 보냄',
    });
    expect(contact.status).toBe(200);
    expect(contact.body.contactedAt).not.toBeNull();
    expect(contact.body.contactNote).toBe('문자 보냄');

    const progress = await bff<{ progress: string }>(
      request,
      'PATCH',
      `/applications/${target?.id}/progress`,
      { progress: 'SCHEDULED' }
    );
    expect(progress.status).toBe(200);
    expect(progress.body.progress).toBe('SCHEDULED');
    const wrong = await bff<{ code: string }>(
      request,
      'PATCH',
      `/applications/${target?.id}/progress`,
      { progress: 'JOINED' }
    );
    expect(wrong.body.code).toBe('APP_012');

    const uncontacted = await bff<{ items: { applicantName: string }[] }>(
      request,
      'GET',
      `/applications?performanceId=${performanceId}&contacted=false`
    );
    expect(
      uncontacted.body.items.map((item) => item.applicantName)
    ).not.toContain(`${PREFIX}참관0`);
    const scheduled = await bff<{ items: { applicantName: string }[] }>(
      request,
      'GET',
      `/applications?performanceId=${performanceId}&progress=SCHEDULED`
    );
    expect(scheduled.body.items.map((item) => item.applicantName)).toEqual([
      `${PREFIX}참관0`,
    ]);
    const sorted = await bff<{ items: { applicantName: string }[] }>(
      request,
      'GET',
      `/applications?performanceId=${performanceId}&sort=contactedAt&order=desc`
    );
    expect(sorted.body.items[0].applicantName).toBe(`${PREFIX}참관0`);

    const summaryAfter = await bff<{ uncontactedPendingCount: number }>(
      request,
      'GET',
      '/dashboard/summary'
    );
    expect(summaryAfter.body.uncontactedPendingCount).toBe(
      summaryBefore.body.uncontactedPendingCount - 1
    );
  });

  test('캘린더: 달을 걸치는 주·월 보기가 두 달 일정을 함께 보인다', async ({
    page,
  }) => {
    for (const [date, label] of [
      ['2026-12-31', '연말'],
      ['2027-01-01', '새해'],
    ] as const) {
      await adminApi('POST', '/admin/schedules', {
        title: `${PREFIX}${label}`,
        type: 'EVENT',
        startAt: `${date}T14:00:00+09:00`,
        endAt: null,
        location: null,
        description: null,
        classId: null,
        performanceId: null,
      });
    }
    for (const view of ['week', 'month']) {
      await page.goto(`/schedules?view=${view}&date=2027-01-01`);
      await expect(page.getByText(`${PREFIX}연말`).first()).toBeVisible();
      await expect(page.getByText(`${PREFIX}새해`).first()).toBeVisible();
    }
  });

  test('취소 해제(SCH_004 — 취소 아닌 일정 해제)는 계약대로다', async ({
    request,
  }) => {
    const restored = await bff<{ status: string }>(
      request,
      'POST',
      `/schedules/${scheduleId}/restore`
    );
    expect(restored.status).toBe(200);
    expect(restored.body.status).toBe('ACTIVE');
    const again = await bff<{ code: string }>(
      request,
      'POST',
      `/schedules/${scheduleId}/restore`
    );
    expect(again.body.code).toBe('SCH_004');
  });
});
