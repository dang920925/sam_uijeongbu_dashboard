// ----------------------------------------------------------------------
// SCR-D02 요약(FN-19) — 빈 상태, 공연 25건이면 total=25(B10 재발 방지 — FN-19 수용 기준),
// 최근 공연 = 등록 최신 5(유형 한국어 라벨 B16), 배우·대기 신청·일정 수, 대기 신청 5(연락처 없으면 '-'),
// 조회 실패 → 오류 문구 + 다시 시도.
// 단원·신청서·일정 픽스처는 요약 목 핸들러의 `__mock/seed/dashboard` 로 넣는다(다른 화면 핸들러에 기대지 않게).
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-1-w1-';
const TYPES = ['MUSICAL', 'PLAY', 'SEMINAR', 'ETC'] as const;

interface SummaryResponse {
  performances: { total: number; ongoing: number; upcoming: number };
  actorCount: number;
  pendingApplicationCount: number;
  scheduleCount: number;
}

function kpiCard(page: Page, title: string) {
  return page.locator('.MuiCard-root').filter({ hasText: title });
}

test.describe('SCR-D02 요약', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('데이터가 없으면 KPI 0 과 빈 문구 2개를 보인다', async ({ page }) => {
    // Act
    await page.goto('/');
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: '대시보드' })
    ).toBeVisible();
    await expect(page.getByText('SAM 의정부 현황 요약')).toBeVisible();
    await expect(
      kpiCard(page, '전체 공연').getByText('0', { exact: true })
    ).toBeVisible();
    await expect(page.getByText('진행중 0개 · 예정 0개')).toBeVisible();
    await expect(page.getByText('등록된 공연이 없습니다')).toBeVisible();
    await expect(page.getByText('대기 중인 신청서가 없습니다')).toBeVisible();
  });

  test('공연 25건이면 전체 공연 25 를 보이고 최근 공연은 등록 최신 5건이다', async ({
    page,
    request,
  }) => {
    // Arrange — 진행중 3 · 예정 4 · 종료 18
    for (let i = 1; i <= 25; i += 1) {
      await adminApi(request, 'POST', '/admin/performances', {
        title: `${PREFIX}공연-${String(i).padStart(2, '0')}`,
        type: TYPES[i % 4],
        status: i <= 3 ? 'ONGOING' : i <= 7 ? 'UPCOMING' : 'ENDED',
      });
    }
    // Act
    const summary = await adminApi<SummaryResponse>(
      request,
      'GET',
      '/admin/dashboard/summary'
    );
    await page.goto('/');
    // Assert
    expect(summary.performances).toEqual({
      total: 25,
      ongoing: 3,
      upcoming: 4,
    });
    await expect(
      kpiCard(page, '전체 공연').getByText('25', { exact: true })
    ).toBeVisible();
    await expect(page.getByText('진행중 3개 · 예정 4개')).toBeVisible();
    const recent = page.getByRole('region', { name: '최근 공연' });
    await expect(recent.getByRole('listitem')).toHaveCount(5);
    const first = recent.getByRole('listitem').first();
    await expect(first).toContainText(`${PREFIX}공연-25`);
    await expect(first).toContainText('연극');
    await expect(first).toContainText('종료');
    await expect(recent.getByRole('listitem').last()).toContainText(
      `${PREFIX}공연-21`
    );
  });

  test('배우·대기 신청서·일정 수와 대기 신청 최신 5건(연락처 없으면 -)을 보인다', async ({
    page,
    request,
  }) => {
    // Arrange — 배우 2(일반·삭제 배우 제외), 대기 6(승인 1 제외), 일정 3(삭제 1 제외)
    const seeded = await request.post('/api/backend/v1/__mock/seed/dashboard', {
      data: {
        members: [
          { name: `${PREFIX}배우1`, type: 'ACTOR' },
          { name: `${PREFIX}배우2`, type: 'ACTOR' },
          { name: `${PREFIX}일반`, type: 'GENERAL' },
          { name: `${PREFIX}삭제배우`, type: 'ACTOR', deleted: true },
        ],
        applications: [
          {
            applicantName: `${PREFIX}승인`,
            phone: '010-0000-0000',
            status: 'APPROVED',
          },
          ...[1, 2, 3, 4, 5].map((n) => ({
            applicantName: `${PREFIX}신청-${n}`,
            phone: '010-0000-0000',
          })),
          { applicantName: `${PREFIX}신청-6`, phone: '' },
        ],
        schedules: [
          { title: `${PREFIX}일정1` },
          { title: `${PREFIX}일정2` },
          { title: `${PREFIX}일정3` },
          { title: `${PREFIX}삭제일정`, deleted: true },
        ],
      },
    });
    expect(seeded.status()).toBe(204);
    // Act
    await page.goto('/');
    // Assert
    await expect(
      kpiCard(page, '등록 배우').getByText('2', { exact: true })
    ).toBeVisible();
    await expect(
      kpiCard(page, '대기 신청서').getByText('6', { exact: true })
    ).toBeVisible();
    await expect(
      kpiCard(page, '등록 일정').getByText('3', { exact: true })
    ).toBeVisible();
    const pending = page.getByRole('region', { name: '대기 중인 신청서' });
    const rows = pending.getByRole('listitem');
    await expect(rows).toHaveCount(5);
    await expect(rows.first()).toContainText(`${PREFIX}신청-6`);
    await expect(rows.first().getByText('-', { exact: true })).toBeVisible();
    await expect(rows.last()).toContainText(`${PREFIX}신청-2`);
    await expect(pending.getByText('대기', { exact: true })).toHaveCount(5);
  });

  test('요약 조회가 실패하면 오류 문구와 다시 시도를 보이고, 다시 시도하면 회복한다', async ({
    page,
  }) => {
    // Arrange
    const url = '**/api/backend/v1/admin/dashboard/summary';
    await page.route(url, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 500,
          status: 'Internal Server Error',
          message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          code: 'COMMON_004',
          timestamp: new Date().toISOString(),
          path: '/api/v1/admin/dashboard/summary',
        }),
      })
    );
    await page.goto('/');
    await expect(
      page.getByText('일시적인 오류로 현황을 불러오지 못했습니다')
    ).toBeVisible();
    // Act
    await page.unroute(url);
    await page.getByRole('button', { name: '다시 시도' }).click();
    // Assert
    await expect(page.getByText('등록된 공연이 없습니다')).toBeVisible();
  });
});
