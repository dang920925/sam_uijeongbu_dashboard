// ----------------------------------------------------------------------
// 연동 SCR-D02 요약(FN-19) — 실서버 GET /admin/dashboard/summary 값이 화면 KPI·목록에 그대로 보이는지.
// - 현재 상태(빈 DB): KPI 0 · 빈 문구 2개.
// - 채운 상태: 공연 25(진행 3·예정 4) → total 25(B10), 최근 공연 = 등록 최신 5(유형 한국어 라벨 B16),
//   배우 2(일반·삭제 배우 제외) · 대기 신청 6(승인 1 제외 — 공개 신청 API 로 접수) · 일정 3(삭제 1 제외),
//   대기 신청 최신 5(연락처·"대기" 배지).
// - 조회 실패(5xx)는 BFF 경로만 흉내 낸다 → 오류 문구 + 다시 시도로 회복.
// 연락처 '-' 갈래는 실서버에서 만들 수 없다(신청 phone 은 서버 필수 검증) — 매퍼·utils 단위 테스트가 맡는다.
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
  relayApplication,
} from '@/e2e-pw/integration/support/integration-api';

const PREFIX = fixturePrefix('dashboard');
const TYPES = ['MUSICAL', 'PLAY', 'SEMINAR', 'ETC'] as const;

interface Created {
  id: string;
}

function kpiCard(page: Page, title: string) {
  return page.locator('.MuiCard-root').filter({ hasText: title });
}

/** 같은 연락처·유형의 대기 신청은 APP_006 이라 연락처를 매번 바꾼다 */
async function consult(name: string, phone: string): Promise<Created> {
  const res = await relayApplication({
    appType: 'CONSULTATION',
    applicantName: name,
    phone,
    agreedToPrivacy: true,
    consultationMethod: 'PHONE',
  });
  expect(res.status).toBe(201);
  return res.body as Created;
}

test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

test.describe('연동 SCR-D02 요약 — 현재 상태', () => {
  test('데이터가 없으면 KPI 0 과 빈 문구 2개를 보인다', async ({ page }) => {
    // Act
    await page.goto('/');
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: '대시보드' })
    ).toBeVisible();
    await expect(page.getByText('SAM 의정부 현황 요약')).toBeVisible();
    for (const title of ['전체 공연', '등록 배우', '대기 신청서', '등록 일정'])
      await expect(
        kpiCard(page, title).getByText('0', { exact: true })
      ).toBeVisible();
    await expect(page.getByText('진행중 0개 · 예정 0개')).toBeVisible();
    await expect(page.getByText('등록된 공연이 없습니다')).toBeVisible();
    await expect(page.getByText('대기 중인 신청서가 없습니다')).toBeVisible();
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
          status: 'INTERNAL_SERVER_ERROR',
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

test.describe('연동 SCR-D02 요약 — 채운 상태', () => {
  test.afterEach(() => cleanupFixtures(FIXTURE_BASE));

  test('공연 25건이면 전체 25·진행 3·예정 4, 최근 공연은 등록 최신 5건(한국어 유형 라벨)이다', async ({
    page,
  }) => {
    // Arrange — 진행중 3 · 예정 4 · 종료 18
    for (let i = 1; i <= 25; i += 1) {
      await adminApi('POST', '/admin/performances', {
        title: `${PREFIX}공연-${String(i).padStart(2, '0')}`,
        type: TYPES[i % 4],
        status: i <= 3 ? 'ONGOING' : i <= 7 ? 'UPCOMING' : 'ENDED',
      });
    }
    // Act
    await page.goto('/');
    // Assert
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

  test('배우·대기 신청서·일정 수와 대기 신청 최신 5건을 보인다', async ({
    page,
  }) => {
    // Arrange — 배우 2(일반·삭제 배우 제외)
    await adminApi('POST', '/admin/members', {
      name: `${PREFIX}배우1`,
      type: 'ACTOR',
    });
    await adminApi('POST', '/admin/members', {
      name: `${PREFIX}배우2`,
      type: 'ACTOR',
    });
    await adminApi('POST', '/admin/members', {
      name: `${PREFIX}일반`,
      type: 'GENERAL',
    });
    const deletedActor = await adminApi<Created>('POST', '/admin/members', {
      name: `${PREFIX}삭제배우`,
      type: 'ACTOR',
    });
    await adminApi('DELETE', `/admin/members/${deletedActor.id}`);
    // 대기 6(승인 1 제외)
    const approved = await consult(`${PREFIX}승인`, '010-7000-0000');
    await adminApi('POST', `/admin/applications/${approved.id}/approve`);
    for (let n = 1; n <= 6; n += 1)
      await consult(`${PREFIX}신청-${n}`, `010-7000-000${n}`);
    // 일정 3(삭제 1 제외)
    for (const title of ['일정1', '일정2', '일정3', '삭제일정']) {
      const schedule = await adminApi<Created>('POST', '/admin/schedules', {
        title: `${PREFIX}${title}`,
        type: 'PRACTICE',
        startAt: '2030-01-01T19:00:00+09:00',
      });
      if (title === '삭제일정')
        await adminApi('DELETE', `/admin/schedules/${schedule.id}`);
    }
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
    await expect(rows.first()).toContainText('010-7000-0006');
    await expect(rows.last()).toContainText(`${PREFIX}신청-2`);
    await expect(pending.getByText('대기', { exact: true })).toHaveCount(5);
    await expect(pending.getByText(`${PREFIX}승인`)).toHaveCount(0);
  });
});
