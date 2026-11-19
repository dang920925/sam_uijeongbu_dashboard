// ----------------------------------------------------------------------
// 연동 SCR-D03 공연 관리(FN-09) — 실서버 GET/POST /admin/performances.
// - 현재 상태: 빈 문구. 생성 실패(5xx)는 BFF 경로만 흉내 내 다이얼로그 안 문구.
// - 채운 상태: "공연 추가" → 서버 201 → 목록에 실제 등록일(B1, 서버 createdAt UTC → KST), 20건은 한 쪽,
//   21건부터 페이지네이션(서버 size=20 · totalPages), 비노출·포스터 썸네일(D5, 업로드 API 공개 URL), 행 → 상세.
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
  uploadFixtureImage,
} from '@/e2e-pw/integration/support/integration-api';

const PREFIX = fixturePrefix('performances');

interface Created {
  id: string;
  createdAt: string;
}

const rows = (page: Page) => page.getByRole('row', { name: /상세 보기$/ });
const rowOf = (page: Page, title: string) =>
  page.getByRole('row', { name: `${title} 상세 보기`, exact: true });

/** 서버 datetime(UTC Z) → KST 'YYYY.MM.DD' */
function kstDateOf(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })
    .format(new Date(iso))
    .replaceAll('-', '.');
}

async function createPerformances(count: number, from = 1) {
  for (let i = from; i < from + count; i += 1) {
    await adminApi('POST', '/admin/performances', {
      title: `${PREFIX}목록-${String(i).padStart(2, '0')}`,
      type: 'PLAY',
      status: 'UPCOMING',
    });
  }
}

test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

test.describe('연동 SCR-D03 공연 관리 — 현재 상태', () => {
  test('공연이 없으면 빈 문구를 보인다', async ({ page }) => {
    // Act
    await page.goto('/performances');
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: '공연 관리' })
    ).toBeVisible();
    await expect(page.getByText('공연 목록을 관리합니다')).toBeVisible();
    await expect(page.getByText('등록된 공연이 없습니다')).toBeVisible();
    await expect(page.getByRole('button', { name: '다음 페이지' })).toHaveCount(
      0
    );
  });

  test('목록 조회가 실패하면 오류 문구와 다시 시도를 보인다', async ({
    page,
  }) => {
    // Arrange
    await page.route('**/api/backend/v1/admin/performances?*', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 503,
          status: 'SERVICE_UNAVAILABLE',
          message: '서비스를 일시적으로 이용할 수 없습니다.',
          code: 'COMMON_005',
          timestamp: new Date().toISOString(),
          path: '/api/v1/admin/performances',
        }),
      })
    );
    // Act
    await page.goto('/performances');
    // Assert
    await expect(
      page.getByText('일시적인 오류로 공연 목록을 불러오지 못했습니다')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  });

  test('빈 제목은 다이얼로그 안 문구로 막고, 생성 실패(5xx)는 다이얼로그 안에 실패 문구를 보인다', async ({
    page,
  }) => {
    // Arrange
    await page.route('**/api/backend/v1/admin/performances', (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 500,
              status: 'INTERNAL_SERVER_ERROR',
              message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
              code: 'COMMON_004',
              timestamp: new Date().toISOString(),
              path: '/api/v1/admin/performances',
            }),
          })
        : route.continue()
    );
    await page.goto('/performances');
    await page.getByRole('button', { name: '공연 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '공연 추가' });
    const submit = dialog.getByRole('button', { name: '추가', exact: true });
    // Act — 빈 제목
    await submit.click();
    // Assert
    await expect(dialog.getByText('공연 제목을 입력해주세요')).toBeVisible();
    // Act — 서버 실패
    await dialog.getByLabel('공연 제목').fill(`${PREFIX}실패`);
    await submit.click();
    // Assert
    await expect(
      dialog.getByText('공연 생성 중 오류가 발생했습니다')
    ).toBeVisible();
    await expect(dialog.getByLabel('공연 제목')).toHaveValue(`${PREFIX}실패`);
  });
});

test.describe('연동 SCR-D03 공연 관리 — 채운 상태', () => {
  test.afterEach(() => cleanupFixtures(FIXTURE_BASE));

  test('공연 추가로 만들면 다이얼로그가 닫히고 목록에 서버 등록일(KST)과 함께 보인다', async ({
    page,
  }) => {
    // Arrange
    const title = `${PREFIX}새 공연`;
    await page.goto('/performances');
    await page.getByRole('button', { name: '공연 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '공연 추가' });
    await dialog.getByLabel('공연 제목').fill(title);
    // Act
    const created = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/backend/v1/admin/performances') &&
        r.request().method() === 'POST'
    );
    await dialog.getByRole('button', { name: '추가', exact: true }).click();
    // Assert
    const response = await created;
    expect(response.status()).toBe(201);
    const body = (await response.json()) as Created;
    await expect(dialog).toBeHidden();
    const row = rowOf(page, title);
    await expect(row).toContainText(kstDateOf(body.createdAt));
    await expect(row).toContainText('연극');
    await expect(row).toContainText('예정');
    await expect(row).toContainText('노출');
    await expect(row).not.toContainText('비노출');
  });

  test('20건이면 페이지네이션이 없고 21건부터 보이며 2쪽으로 넘어간다', async ({
    page,
  }) => {
    // Arrange
    await createPerformances(20);
    await page.goto('/performances');
    await expect(rows(page)).toHaveCount(20);
    await expect(page.getByRole('button', { name: '다음 페이지' })).toHaveCount(
      0
    );
    await createPerformances(1, 21);
    // Act
    await page.reload();
    await expect(rows(page)).toHaveCount(20);
    await expect(rowOf(page, `${PREFIX}목록-21`)).toBeVisible();
    const second = page.waitForResponse((r) =>
      r.url().includes('/admin/performances?page=2&size=20')
    );
    await page.getByRole('button', { name: '2', exact: true }).click();
    // Assert
    expect((await second).status()).toBe(200);
    await expect(rows(page)).toHaveCount(1);
    await expect(rowOf(page, `${PREFIX}목록-01`)).toBeVisible();
  });

  test('비노출·포스터를 목록에서 구분하고 행을 누르면 공연 상세로 간다', async ({
    page,
  }) => {
    // Arrange
    const poster = await uploadFixtureImage('PERFORMANCE_POSTER');
    const hidden = await adminApi<Created>('POST', '/admin/performances', {
      title: `${PREFIX}숨김`,
      type: 'MUSICAL',
      status: 'ONGOING',
      posterImageUrl: poster,
      isVisible: false,
    });
    await adminApi('POST', '/admin/performances', {
      title: `${PREFIX}노출`,
      type: 'SEMINAR',
      status: 'ENDED',
    });
    await page.goto('/performances');
    const hiddenRow = rowOf(page, `${PREFIX}숨김`);
    const visibleRow = rowOf(page, `${PREFIX}노출`);
    // Assert — 노출 여부·썸네일(서버 공개 URL 이 실제로 열린다)
    await expect(hiddenRow).toContainText('비노출');
    await expect(hiddenRow).toContainText('뮤지컬');
    await expect(hiddenRow).toContainText('진행중');
    await expect(hiddenRow.locator(`img[src="${poster}"]`)).toHaveCount(1);
    await expect
      .poll(() =>
        hiddenRow
          .locator('img')
          .evaluate((img: HTMLImageElement) => img.naturalWidth)
      )
      .toBeGreaterThan(0);
    await expect(visibleRow).not.toContainText('비노출');
    await expect(visibleRow).toContainText('세미나');
    await expect(visibleRow).toContainText('종료');
    await expect(
      visibleRow.getByRole('img', { name: '포스터 없음' })
    ).toBeVisible();
    // Act
    await hiddenRow.click();
    // Assert
    await expect(page).toHaveURL(new RegExp(`/performances/${hidden.id}$`));
  });
});
