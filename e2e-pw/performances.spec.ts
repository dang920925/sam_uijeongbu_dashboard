// ----------------------------------------------------------------------
// SCR-D03 공연 관리(FN-09·FN-18) — 빈 상태, "공연 추가" 성공 시 닫히고 목록에 실제 등록일(B1),
// 생성 실패는 다이얼로그 안 문구, 21건 이상일 때만 페이지네이션(20건 단위 — B10), 행 클릭 → 상세,
// 노출/비노출·포스터 썸네일(D5). desktop 은 표 행, mobile 은 카드(role=button)로 찾는다.
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import {
  adminApi,
  resetMock,
  uploadFixtureImage,
} from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-1-w1-';

interface CreatedPerformance {
  id: string;
}

function rows(page: Page, isMobile: boolean) {
  const name = /상세 보기$/;
  return isMobile
    ? page.getByRole('button', { name })
    : page.getByRole('row', { name });
}

function rowOf(page: Page, isMobile: boolean, title: string) {
  const name = `${title} 상세 보기`;
  return isMobile
    ? page.getByRole('button', { name, exact: true })
    : page.getByRole('row', { name, exact: true });
}

function todayKst(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })
    .format(new Date())
    .replaceAll('-', '.');
}

async function createPerformances(
  request: Parameters<typeof adminApi>[0],
  count: number,
  from = 1
) {
  for (let i = from; i < from + count; i += 1) {
    await adminApi(request, 'POST', '/admin/performances', {
      title: `${PREFIX}목록-${String(i).padStart(2, '0')}`,
      type: 'PLAY',
      status: 'UPCOMING',
    });
  }
}

test.describe('SCR-D03 공연 관리', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('공연이 없으면 빈 문구를 보인다', async ({ page }) => {
    // Act
    await page.goto('/performances');
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: '공연 관리' })
    ).toBeVisible();
    await expect(page.getByText('공연 목록을 관리합니다')).toBeVisible();
    await expect(page.getByText('등록된 공연이 없습니다')).toBeVisible();
  });

  test('공연 추가로 만들면 다이얼로그가 닫히고 목록에 실제 등록일과 함께 보인다', async ({
    page,
    isMobile,
  }) => {
    // Arrange
    const title = `${PREFIX}새 공연`;
    await page.goto('/performances');
    await page.getByRole('button', { name: '공연 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '공연 추가' });
    await expect(dialog).toBeVisible();
    // Act
    await dialog.getByLabel('공연 제목').fill(title);
    await dialog.getByRole('button', { name: '추가', exact: true }).click();
    // Assert
    await expect(dialog).toBeHidden();
    const row = rowOf(page, isMobile, title);
    await expect(row).toBeVisible();
    await expect(row).toContainText(todayKst());
    await expect(row).toContainText('연극');
    await expect(row).toContainText('예정');
    if (!isMobile) await expect(row).toContainText('노출');
  });

  test('빈 제목은 다이얼로그 안 문구로 막고, 생성 실패는 다이얼로그 안에 실패 문구를 보인다', async ({
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
              status: 'Internal Server Error',
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
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('공연 제목')).toHaveValue(`${PREFIX}실패`);
  });

  test('20건이면 페이지네이션이 없고 21건부터 보이며 2쪽으로 넘어간다', async ({
    page,
    request,
    isMobile,
  }) => {
    // Arrange
    await createPerformances(request, 20);
    await page.goto('/performances');
    await expect(rows(page, isMobile)).toHaveCount(20);
    await expect(page.getByRole('button', { name: '다음 페이지' })).toHaveCount(
      0
    );
    await createPerformances(request, 1, 21);
    // Act
    await page.reload();
    await expect(rows(page, isMobile)).toHaveCount(20);
    await page.getByRole('button', { name: '2', exact: true }).click();
    // Assert
    await expect(rows(page, isMobile)).toHaveCount(1);
  });

  test('비노출·포스터를 목록에서 구분하고 행을 누르면 공연 상세로 간다', async ({
    page,
    request,
    isMobile,
  }) => {
    // Arrange
    const poster = await uploadFixtureImage(request, 'PERFORMANCE_POSTER');
    const hidden = await adminApi<CreatedPerformance>(
      request,
      'POST',
      '/admin/performances',
      {
        title: `${PREFIX}숨김`,
        type: 'MUSICAL',
        status: 'ONGOING',
        posterImageUrl: poster,
        isVisible: false,
      }
    );
    await adminApi(request, 'POST', '/admin/performances', {
      title: `${PREFIX}노출`,
      type: 'SEMINAR',
      status: 'ENDED',
    });
    await page.goto('/performances');
    const hiddenRow = rowOf(page, isMobile, `${PREFIX}숨김`);
    const visibleRow = rowOf(page, isMobile, `${PREFIX}노출`);
    // Assert — 노출 여부·썸네일
    await expect(hiddenRow).toContainText('비노출');
    await expect(hiddenRow.locator('img')).toHaveCount(1);
    await expect(visibleRow).not.toContainText('비노출');
    await expect(
      visibleRow.getByRole('img', { name: '포스터 없음' })
    ).toBeVisible();
    // Act
    await hiddenRow.click();
    // Assert
    await expect(page).toHaveURL(new RegExp(`/performances/${hidden.id}$`));
  });
});
