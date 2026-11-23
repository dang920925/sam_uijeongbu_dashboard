// ----------------------------------------------------------------------
// R2 SCR-D12 '입금 알림' 탭(사용자 결정 2026-11-23) — 목 백엔드.
// 푸시 주소(?tab=deposits)로 탭 열기 · 판정 라벨(입금 완료 · 일부 입금 · 확인 안 된 입금) · 일부 입금 받은 금액 ·
// 예매 목록의 '일부 입금' 라벨 · 확인 안 된 입금을 예매에 연결(입금 확인) · 무시 · 거르기 · 알림 문구 시험(저장 안 함).
// desktop(lg 표)·mobile(카드) 모두 보이는 요소만 골라 같은 흐름. 픽스처 접두사 fixture-r2-.
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-r2-';
const API = '/api/backend/v1';
const DAY_MS = 24 * 60 * 60 * 1000;

interface Created {
  id: string;
}

async function seedReservation(
  request: APIRequestContext,
  body: Record<string, unknown>
): Promise<void> {
  const response = await request.post(`${API}/__mock/booking/reservation`, {
    data: body,
  });
  expect(response.status()).toBe(201);
}

async function postDeposit(
  request: APIRequestContext,
  text: string
): Promise<void> {
  const response = await request.post(`${API}/__mock/deposit`, {
    data: { source: 'com.kakaobank.channel', title: '입금', text },
  });
  expect(response.status()).toBe(202);
}

/** 공연 1 · 회차 1 · 등급 10,000원 · 입금 대기 예매 3건(각 2매 20,000원) · 알림 4건 */
async function setup(request: APIRequestContext): Promise<void> {
  const perf = await adminApi<Created>(request, 'POST', '/admin/performances', {
    title: `${PREFIX}공연`,
    type: 'PLAY',
    status: 'UPCOMING',
    description: `${PREFIX}설명`,
    isVisible: false,
  });
  const show = await adminApi<Created>(
    request,
    'POST',
    `/admin/performances/${perf.id}/shows`,
    {
      showDate: '2099-12-12',
      startTime: '14:00',
      venue: `${PREFIX}소극장`,
      totalSeats: 20,
      bookingOpenAt: new Date(Date.now() - DAY_MS).toISOString(),
    }
  );
  const tier = await adminApi<Created>(
    request,
    'POST',
    `/admin/performances/${perf.id}/price-tiers`,
    { name: `${PREFIX}일반`, price: 10000, visibility: 'PUBLIC' }
  );
  for (const [code, name] of [
    ['7311', '알투가'],
    ['7322', '알투나'],
    ['7333', '알투다'],
  ]) {
    await seedReservation(request, {
      showId: show.id,
      code,
      bookerName: `${name}${PREFIX}`,
      bookerPhone: `010-7300-${code}`,
      items: [{ tierId: tier.id, quantity: 2 }],
    });
  }
  await postDeposit(request, '알투가7311님이 20,000원을 보내셨습니다');
  await postDeposit(request, '입금 10,000원 알투나7322 잔액 ***');
  await postDeposit(request, '입금 7,000원 모르는사람');
  await postDeposit(request, '입금 8,000원 엉뚱한이름');
}

function visible(page: Page, name: RegExp | string) {
  return page.getByText(name).filter({ visible: true });
}

async function openDeposits(page: Page) {
  await page.goto('/reservations?tab=deposits');
  await expect(page.getByRole('tab', { name: '입금 알림' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await expect(visible(page, /모르는사람/).first()).toBeVisible();
}

test.describe('SCR-D12 입금 알림(R2)', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
    await setup(request);
  });

  test('푸시 주소로 탭이 열리고 판정 라벨·일부 입금 받은 금액이 보인다', async ({
    page,
  }) => {
    await openDeposits(page);

    await expect(visible(page, '입금 완료').first()).toBeVisible();
    await expect(visible(page, '확인 안 된 입금').first()).toBeVisible();
    await expect(
      visible(page, '받은 금액 10,000원 / 20,000원').first()
    ).toBeVisible();
    await expect(visible(page, '카카오뱅크').first()).toBeVisible();
  });

  test('예매 목록에도 일부 입금 라벨과 받은 금액이 붙는다', async ({
    page,
  }) => {
    await openDeposits(page);
    await page.getByRole('tab', { name: '예매', exact: true }).click();

    const partialRow = page
      .locator('[data-reservation-code="7322"]')
      .filter({ visible: true });
    await expect(partialRow.getByText('일부 입금')).toBeVisible();
    await expect(
      partialRow.getByText('받은 금액 10,000원 / 20,000원')
    ).toBeVisible();
  });

  test('확인 안 된 입금을 예매번호로 찾아 연결하면 입금 확인된다', async ({
    page,
  }) => {
    await openDeposits(page);

    await page
      .getByRole('button', { name: /^7,000원 · .* 예매에 연결$/ })
      .filter({ visible: true })
      .click();
    const dialog = page.getByRole('dialog', {
      name: '예매에 연결하고 입금 확인',
    });
    await dialog.getByLabel('예매번호 4자리').fill('7333');
    await dialog.getByRole('button', { name: '찾기' }).click();
    await dialog.getByRole('radio', { name: /^7333 · 알투다7333/ }).check();
    await dialog.getByRole('button', { name: '연결하고 입금 확인' }).click();

    await expect(
      page.getByText('예매에 연결하고 입금 확인했습니다.')
    ).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(visible(page, '직접 연결').first()).toBeVisible();
    await page.getByRole('tab', { name: '예매', exact: true }).click();
    await expect(
      page
        .locator('[data-reservation-code="7333"]')
        .filter({ visible: true })
        .getByText('확정', { exact: true })
        .first()
    ).toBeVisible();
  });

  test('무시하면 무시함으로 바뀌고, 거르기로 확인 안 된 입금만 본다', async ({
    page,
  }) => {
    await openDeposits(page);

    await page
      .getByRole('button', { name: /^8,000원 · .* 무시$/ })
      .filter({ visible: true })
      .click();
    await expect(page.getByText('입금 알림을 무시했습니다.')).toBeVisible();
    await expect(visible(page, '무시함').first()).toBeVisible();

    await page
      .getByRole('group', { name: '판정 결과로 거르기' })
      .getByRole('button', { name: '확인 안 된 입금' })
      .click();
    await expect(visible(page, /모르는사람/).first()).toBeVisible();
    await expect(visible(page, /엉뚱한이름/)).toHaveCount(0);
    await expect(visible(page, /알투가7311님이/)).toHaveCount(0);
  });

  test('알림 문구 시험은 판정만 보여 주고 목록에 저장하지 않는다', async ({
    page,
    request,
  }) => {
    await openDeposits(page);
    const before = await adminApi<{ totalCount: number }>(
      request,
      'GET',
      '/admin/deposit-notifications'
    );

    await page
      .getByRole('textbox', { name: '알림 문구' })
      .fill('알투다7333님이 20,000원을 보내셨습니다');
    await page.getByRole('button', { name: '판정 미리 보기' }).click();

    const result = page.getByRole('status', { name: '판정' });
    await expect(result.getByText('입금 완료')).toBeVisible();
    await expect(result.getByText('20,000원').first()).toBeVisible();
    await expect(result.getByText('입금자명')).toBeVisible();
    await expect(result.getByText(/알투다7333/)).toBeVisible();
    const after = await adminApi<{ totalCount: number }>(
      request,
      'GET',
      '/admin/deposit-notifications'
    );
    expect(after.totalCount).toBe(before.totalCount);
  });

  test('알림 문구 시험은 예매번호만 일치하면 불일치 이유를 보여 준다', async ({
    page,
  }) => {
    await openDeposits(page);

    await page
      .getByRole('textbox', { name: '알림 문구' })
      .fill('입금 20,000원 다른사람7333');
    await page.getByRole('button', { name: '판정 미리 보기' }).click();

    const result = page.getByRole('status', { name: '판정' });
    await expect(result.getByText('확인 안 된 입금')).toBeVisible();
    await expect(
      result.getByText('입금자명 불일치(예매번호만 일치)')
    ).toBeVisible();
  });

  test('출처 앱 열을 보이고, 허용 밖 앱 알림은 판정 안 함으로 남는다', async ({
    page,
    request,
  }) => {
    const response = await request.post(`${API}/__mock/deposit`, {
      data: {
        appPackage: 'com.example.sms',
        appName: '문자',
        title: '알림',
        text: '알투다7333님이 20,000원을 보내셨습니다',
      },
    });
    expect(response.status()).toBe(202);
    await openDeposits(page);

    await expect(visible(page, '판정 안 함').first()).toBeVisible();
    await expect(visible(page, '문자').first()).toBeVisible();
    await page.getByRole('tab', { name: '예매', exact: true }).click();
    await expect(
      page
        .locator('[data-reservation-code="7333"]')
        .filter({ visible: true })
        .getByText('확정', { exact: true })
    ).toHaveCount(0);
  });
});
