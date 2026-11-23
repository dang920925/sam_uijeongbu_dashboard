// ----------------------------------------------------------------------
// (U47) 공연 삭제 E2E(목 백엔드) — 기본 정보 탭 맨 아래 '공연 삭제'(위험) → 확인 창(작품명 문구 + 확인 체크) →
// 삭제 뒤 목록으로 + 홈페이지 재검증(U27) 호출. 살아 있는 예매가 있으면 409 PERF_002 문구를 창 안에 보인다.
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-u47-';
const API = '/api/backend/v1';

interface Created {
  id: string;
}

async function createPerformance(request: APIRequestContext, title: string) {
  return adminApi<Created>(request, 'POST', '/admin/performances', {
    title,
    type: 'PLAY',
    status: 'UPCOMING',
    isVisible: true,
  });
}

async function openDelete(page: Page, id: string) {
  await page.goto(`/performances/${id}`);
  await page
    .getByRole('button', { name: '공연 삭제' })
    .filter({ visible: true })
    .click();
  return page.getByRole('dialog');
}

test.describe('U47 공연 삭제', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
    await request.post(`${API}/__mock/fault/clear`);
  });

  test('확인 체크를 해야 삭제되고, 삭제하면 목록으로 돌아가며 홈페이지 재검증을 부른다', async ({
    page,
    request,
  }) => {
    const { id } = await createPerformance(request, `${PREFIX}작품`);
    const dialog = await openDelete(page, id);
    await expect(dialog.getByTestId('performance-delete-message')).toHaveText(
      `'${PREFIX}작품'을 삭제합니다. 되돌릴 수 없습니다.`
    );
    const confirm = dialog.getByRole('button', { name: '공연 삭제' });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel('되돌릴 수 없다는 것을 확인했습니다.').check();
    await confirm.click();

    await expect(page).toHaveURL('/performances');
    await expect(page.getByText('공연을 삭제했습니다.')).toBeVisible();
    await expect
      .poll(
        async () => {
          const res = await request.get(`${API}/__mock/revalidate-log`);
          return ((await res.json()) as { calls: { tags: string[] }[] }).calls;
        },
        { timeout: 10_000 }
      )
      .toContainEqual(
        expect.objectContaining({
          tags: expect.arrayContaining(['public:performances']),
        })
      );
    const detail = await request.get(`${API}/admin/performances/${id}`);
    expect(detail.status()).toBe(404);
  });

  test('입금 대기 예매가 있으면 409 PERF_002 문구를 창 안에 보이고 지우지 않는다', async ({
    page,
    request,
  }) => {
    const { id } = await createPerformance(request, `${PREFIX}예매있음`);
    const show = await adminApi<Created>(
      request,
      'POST',
      `/admin/performances/${id}/shows`,
      {
        showDate: '2099-12-12',
        startTime: '14:00',
        venue: `${PREFIX}소극장`,
        totalSeats: 20,
        bookingOpenAt: new Date(Date.now() - 86400000).toISOString(),
      }
    );
    const tier = await adminApi<Created>(
      request,
      'POST',
      `/admin/performances/${id}/price-tiers`,
      { name: `${PREFIX}일반`, price: 10000, visibility: 'PUBLIC' }
    );
    const seeded = await request.post(`${API}/__mock/booking/reservation`, {
      data: {
        showId: show.id,
        code: '4701',
        bookerName: `${PREFIX}대기`,
        bookerPhone: '010-4701-0001',
        items: [{ tierId: tier.id, quantity: 1 }],
      },
    });
    expect(seeded.status()).toBe(201);

    const dialog = await openDelete(page, id);
    await dialog.getByLabel('되돌릴 수 없다는 것을 확인했습니다.').check();
    await dialog.getByRole('button', { name: '공연 삭제' }).click();
    await expect(
      dialog.getByText('예매가 있는 공연은 삭제할 수 없습니다.', {
        exact: false,
      })
    ).toBeVisible();
    await expect(page).toHaveURL(`/performances/${id}`);
    const detail = await request.get(`${API}/admin/performances/${id}`);
    expect(detail.status()).toBe(200);
  });
});
