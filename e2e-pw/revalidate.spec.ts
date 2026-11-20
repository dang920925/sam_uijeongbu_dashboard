// ----------------------------------------------------------------------
// U27(FN-45) — 관리 변경 2xx 뒤 BFF 가 응답 후(after) 홈페이지 재검증을 부른다(develop §12.1 R-1·R-4 의 목 확인).
// E2E 의 CLIENT_PUBLIC_URL 은 목의 기록 경로(`/api/backend/v1/__mock/client`)라, 받은 태그·경로를
// `GET /api/backend/v1/__mock/revalidate-log` 로 읽는다. 실서버 첫 GET 신선도(R-3·R-6)는 integration 몫.
// ----------------------------------------------------------------------
import { expect, test, type APIRequestContext } from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-r1-lead-';

interface RevalidateCall {
  tags: string[];
  paths: string[];
}

async function revalidateLog(
  request: APIRequestContext
): Promise<RevalidateCall[]> {
  const res = await request.get('/api/backend/v1/__mock/revalidate-log');
  return ((await res.json()) as { calls: RevalidateCall[] }).calls;
}

test.describe('U27 홈페이지 즉시 반영 호출', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
    await request.post('/api/backend/v1/__mock/fault/clear');
  });

  test('연출진을 화면에서 추가하면 응답 뒤 public:staff 재검증을 부른다', async ({
    page,
    request,
  }) => {
    // Arrange
    await page.goto('/staff');
    await page.getByRole('button', { name: '연출진 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '연출진 추가' });
    // Act
    await dialog.getByPlaceholder('이름 입력').fill(`${PREFIX}연출`);
    await dialog.getByPlaceholder('예: 예술감독 · 연출').fill('연출');
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert
    await expect(page.getByText('저장되었습니다')).toBeVisible();
    await expect
      .poll(async () => revalidateLog(request), { timeout: 10_000 })
      .toContainEqual(
        expect.objectContaining({
          tags: ['public:staff'],
          paths: ['/', '/about'],
        })
      );
  });

  test('조회(GET)·실패 응답·공개 무관 경로(예매)는 부르지 않는다', async ({
    request,
  }) => {
    // Act — 실패 응답(400)과 GET
    await request.post('/api/backend/v1/admin/staff', { data: {} });
    await request.get('/api/backend/v1/admin/staff');
    await request.post('/api/backend/v1/admin/reservations', {
      data: { showId: 'none' },
    });
    // Assert — 응답 뒤 작업이 돌 시간을 준 뒤에도 기록 없음
    await expect
      .poll(async () => (await revalidateLog(request)).length, {
        timeout: 2_000,
      })
      .toBe(0);
  });

  test('홈페이지 재검증이 실패해도 관리 저장은 성공한다(R-4)', async ({
    page,
    request,
  }) => {
    // Arrange — 재검증 수신 경로를 500 으로 고장 낸다
    await request.post('/api/backend/v1/__mock/fault', {
      data: {
        method: 'POST',
        pattern: '^/v1/__mock/client/api/revalidate$',
        status: 500,
        count: 5,
      },
    });
    // Act
    const created = await adminApi<{ id: string; name: string }>(
      request,
      'POST',
      '/admin/staff',
      { name: `${PREFIX}실패해도`, role: '연출', isVisible: true }
    );
    // Assert
    expect(created.name).toBe(`${PREFIX}실패해도`);
    await page.goto('/staff');
    await expect(
      page
        .getByRole('main')
        .getByText(`${PREFIX}실패해도`)
        .filter({ visible: true })
    ).toHaveCount(1);
  });
});
