// ----------------------------------------------------------------------
// R1(U24 1단계·U25·§6.1a) 시안 대조용 캡처 — `pnpm exec playwright test --project=setup --project=capture r1.screens`.
// SCR-D11 · D12 · D13 · D15 · 헤더 예매번호로 찾기 · 메뉴(SCR-D00-NAV)를 xs 390 / md 834 / lg 1440 으로 찍는다.
// 데이터는 목 백엔드에 `fixture-` 픽스처(가짜 계좌·연락처)로 만든다 — 실데이터·실제 계좌 금지.
// ----------------------------------------------------------------------
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { test, type APIRequestContext, type Page } from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const OUT = resolve(
  process.env.SCREEN_DIR ??
    '../../output/sam-uijeongbu/front-end-screens/dashboard'
);
const VIEWPORTS = {
  lg: { width: 1440, height: 900 },
  md: { width: 834, height: 1112 },
  xs: { width: 390, height: 844 },
};
type Vp = keyof typeof VIEWPORTS;
const MOCK = '/api/backend/v1/__mock/booking/reservation';

async function seed(request: APIRequestContext) {
  await resetMock(request);
  const perf = await adminApi<{ id: string }>(
    request,
    'POST',
    '/admin/performances',
    {
      title: 'fixture-공연-예매',
      type: 'PLAY',
      status: 'UPCOMING',
      isVisible: true,
      description: null,
      posterImageUrl: null,
      detailImageUrls: [],
    }
  );
  const id = perf.id;
  await request.put(`/api/backend/v1/admin/performances/${id}/booking-policy`, {
    data: {
      depositBank: 'fixture-은행',
      depositAccountNumber: '000-0000-0000',
      depositAccountHolder: 'fixture-예금주',
      maxTicketsPerBooking: 4,
      depositDeadlineHours: 48,
      refundPolicyText: 'fixture-환불 규정',
      inquiryContact: '010-0000-0000 (문자)',
    },
  });
  const general = await adminApi<{ id: string }>(
    request,
    'POST',
    `/admin/performances/${id}/price-tiers`,
    { name: '일반', price: 20000, visibility: 'PUBLIC' }
  );
  const staff = await adminApi<{ id: string }>(
    request,
    'POST',
    `/admin/performances/${id}/price-tiers`,
    { name: '스태프', price: 10000, visibility: 'LINK_ONLY' }
  );
  const shows: { id: string }[] = [];
  for (const [date, time] of [
    ['2099-12-12', '14:00'],
    ['2099-12-12', '18:00'],
    ['2099-12-13', '13:00'],
    ['2099-12-13', '17:00'],
  ]) {
    shows.push(
      await adminApi(request, 'POST', `/admin/performances/${id}/shows`, {
        showDate: date,
        startTime: time,
        venue: 'fixture-소극장',
        totalSeats: 60,
        bookingOpenAt: '2026-11-27T10:00:00+09:00',
      })
    );
  }
  const people = [
    ['fixture-가나', 'CONFIRMED', 2, 1, 1],
    ['fixture-다라', 'PENDING', 1, 0, 0],
    ['fixture-마바', 'CONFIRMED', 3, 0, 3],
    ['fixture-사아', 'PENDING', 2, 1, 0],
    ['fixture-자차', 'CANCELLED', 1, 0, 0],
  ] as const;
  for (const [i, [name, status, g, s, admitted]] of people.entries()) {
    await request.post(MOCK, {
      data: {
        showId: shows[0].id,
        bookerName: name,
        bookerPhone: `0100000000${i}`,
        items: [
          { tierId: general.id, quantity: g },
          ...(s > 0 ? [{ tierId: staff.id, quantity: s }] : []),
        ],
        status,
        admittedCount: admitted,
        code: `48${i}${i + 1}`,
        ...(i === 3 ? { depositDueAt: '2026-01-01T00:00:00.000Z' } : {}),
      },
    });
  }
  await adminApi(request, 'POST', '/admin/reservations', {
    showId: shows[0].id,
    bookerName: 'fixture-초대',
    customLine: { quantity: 2, amount: 0 },
    status: 'CONFIRMED',
    memo: 'fixture-초대 — 연출 지인',
  });
  return { id, showId: shows[0].id };
}

async function shoot(page: Page, name: string, vp: Vp) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}__${vp}.png`, fullPage: true });
}

test.describe.configure({ mode: 'serial' });

test('R1 화면을 xs·md·lg 로 캡처한다', async ({ page, request }) => {
  test.setTimeout(240_000);
  mkdirSync(OUT, { recursive: true });
  const { id, showId } = await seed(request);
  for (const vp of ['lg', 'md', 'xs'] as const) {
    await page.setViewportSize(VIEWPORTS[vp]);
    await page.goto(`/performances/${id}/shows`);
    await shoot(page, 'SCR-D11-shows', vp);
    await page.goto(`/reservations?performanceId=${id}`);
    await shoot(page, 'SCR-D12-reservations', vp);
    await page.goto(`/admission?showId=${showId}`);
    await shoot(page, 'SCR-D13-admission', vp);
    await page.goto('/account');
    await shoot(page, 'SCR-D15-account', vp);
  }
  // 헤더 예매번호로 찾기 — 1건 → 드로어(lg·xs)
  for (const vp of ['lg', 'xs'] as const) {
    await page.setViewportSize(VIEWPORTS[vp]);
    await page.goto('/');
    if (vp === 'xs')
      await page.getByRole('button', { name: '예매번호로 찾기' }).click();
    const input = page.getByRole('combobox', { name: '예매번호로 찾기' });
    await input.first().fill('4801');
    await input.first().press('Enter');
    await page.getByRole('dialog').first().waitFor();
    await shoot(page, 'SCR-D00-NAV-find-one', vp);
  }
  // 메뉴 드로어(xs)
  await page.setViewportSize(VIEWPORTS.xs);
  await page.goto('/');
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await shoot(page, 'SCR-D00-NAV-drawer', 'xs');
});
