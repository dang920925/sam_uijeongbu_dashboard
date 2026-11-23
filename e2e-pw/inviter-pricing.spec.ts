// ----------------------------------------------------------------------
// U41 초대 유형별 가격(develop §22 · §22.1 · design §17) — SCR-D11 가격 카드(기본가·SAM 관계자가 → 준비 상태) ·
// SCR-D12 예매 목록 '초대한 사람' 열·적용 가격·필터(IP-7 · IP-9) · 집계 묶음 · SCR-D13 입장 명단 초대 줄.
// + v1.3.1 드롭다운 아이콘 여백(글자 시작 = 화살표 오른쪽 여백 — 테마 MuiSelect) 실측.
// 픽스처 접두사 fixture-u41-.
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-u41-';
const API = '/api/backend/v1';
const DAY_MS = 24 * 60 * 60 * 1000;

interface Created {
  id: string;
}

const POLICY = {
  depositBank: `${PREFIX}은행`,
  depositAccountNumber: '0000-00-0000000',
  depositAccountHolder: `${PREFIX}극단`,
  maxTicketsPerBooking: 4,
  depositDeadlineHours: 24,
  refundPolicyText: `${PREFIX}환불 규정`,
};

async function seedBase(request: APIRequestContext) {
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
      totalSeats: 20,
      bookingOpenAt: new Date(Date.now() - DAY_MS).toISOString(),
    }
  );
  const policy = await request.fetch(
    `${API}/admin/performances/${perf.id}/booking-policy`,
    { method: 'PUT', data: POLICY }
  );
  expect(policy.ok()).toBe(true);
  return { performanceId: perf.id, showId: show.id };
}

/** 가격 저장 + 예매 4건(배우 A 대기·확정 · SAM 관계자 · 연출/스태프) */
async function seedBooked(request: APIRequestContext) {
  const base = await seedBase(request);
  await adminApi(
    request,
    'PUT',
    `/admin/performances/${base.performanceId}/inviter-prices`,
    { base: 20000, samRelated: 10000 }
  );
  const tiers = await adminApi<{
    items: { id: string; role: string | null }[];
  }>(request, 'GET', `/admin/performances/${base.performanceId}/price-tiers`);
  const baseTier = tiers.items.find((t) => t.role === 'BASE')!;
  const samTier = tiers.items.find((t) => t.role === 'SAM_RELATED')!;
  const actor = await adminApi<Created>(request, 'POST', '/admin/members', {
    name: `${PREFIX}가배우`,
    type: 'ACTOR',
    phone: null,
  });
  const seed = (body: Record<string, unknown>) =>
    request
      .post(`${API}/__mock/booking/reservation`, {
        data: { showId: base.showId, ...body },
      })
      .then((res) => {
        expect(res.status()).toBe(201);
      });
  await seed({
    code: '4101',
    bookerName: `${PREFIX}배우대기`,
    bookerPhone: '010-4101-0001',
    items: [{ tierId: baseTier.id, quantity: 2 }],
    inviterCategory: 'MEMBER',
    inviterMemberId: actor.id,
  });
  await seed({
    code: '4102',
    bookerName: `${PREFIX}배우확정`,
    bookerPhone: '010-4102-0002',
    items: [{ tierId: baseTier.id, quantity: 1 }],
    inviterCategory: 'MEMBER',
    inviterMemberId: actor.id,
    status: 'CONFIRMED',
  });
  await seed({
    code: '4103',
    bookerName: `${PREFIX}샘`,
    bookerPhone: '010-4103-0003',
    items: [{ tierId: samTier.id, quantity: 3 }],
    inviterCategory: 'SAM_RELATED',
  });
  await seed({
    code: '4104',
    bookerName: `${PREFIX}스태프`,
    bookerPhone: '010-4104-0004',
    items: [{ tierId: baseTier.id, quantity: 1 }],
    inviterCategory: 'STAFF_RELATED',
  });
  return { ...base, actorId: actor.id };
}

function row(page: Page, code: string) {
  return page
    .locator(`[data-reservation-code="${code}"]`)
    .filter({ visible: true });
}

test.describe('U41 초대 유형별 가격', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('SCR-D11 가격 카드 — 비어 있으면 준비 경고, 두 가격을 저장하면 경고가 풀리고 등급 카드는 없다(IP-5)', async ({
    page,
    request,
  }) => {
    const { performanceId } = await seedBase(request);
    // 예전 링크 전용 등급(화면에서 숨김)
    await adminApi(
      request,
      'POST',
      `/admin/performances/${performanceId}/price-tiers`,
      { name: `${PREFIX}스태프`, price: 5000, visibility: 'LINK_ONLY' }
    );
    await page.goto(`/performances/${performanceId}/shows`);
    const card = page.getByTestId('inviter-price-card');
    await expect(card).toBeVisible();
    await expect(page.getByText('기본가, SAM 관계자가')).toBeVisible();
    await expect(page.getByText(`${PREFIX}스태프`)).toHaveCount(0);
    await expect(page.getByText('가격 등급 추가')).toHaveCount(0);
    // 빈 칸으로 저장하면 칸 오류
    await card.getByRole('button', { name: '저장' }).click();
    await expect(card.getByText('가격을 입력해주세요')).toHaveCount(2);
    // 저장
    await card.getByLabel('기본가').fill('20000');
    await card.getByLabel('SAM 관계자가').fill('10,000');
    await card.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('저장되었습니다')).toBeVisible();
    await expect(page.getByText('기본가, SAM 관계자가')).toHaveCount(0);
    const saved = await adminApi<{ base: number; samRelated: number }>(
      request,
      'GET',
      `/admin/performances/${performanceId}/inviter-prices`
    );
    expect(saved).toEqual({ base: 20000, samRelated: 10000 });
    // 다시 열면 서버 값
    await page.reload();
    await expect(
      page.getByTestId('inviter-price-card').getByLabel('기본가')
    ).toHaveValue('20000');
  });

  test('SCR-D12 초대한 사람 열 · 적용 가격 · 필터(배우 + 입금 대기 — IP-9) · 집계 묶음(IP-7)', async ({
    page,
    request,
  }) => {
    await seedBooked(request);
    await page.goto('/reservations');
    await expect(row(page, '4103')).toBeVisible();
    await expect(row(page, '4103')).toContainText('SAM 관계자');
    await expect(row(page, '4103')).toContainText('1매 10,000원');
    await expect(row(page, '4101')).toContainText(`${PREFIX}가배우`);
    await expect(row(page, '4101')).toContainText('1매 20,000원');
    await expect(row(page, '4104')).toContainText('연출·스태프 관계자');

    // 필터 — 배우 A + 입금 대기 → 4101 만
    const filter = page.getByTestId('reservation-inviter-filter');
    await filter.click();
    await page.getByRole('option', { name: `${PREFIX}가배우` }).click();
    await page
      .getByRole('group', { name: '상태' })
      .getByRole('button', { name: '입금 대기' })
      .click();
    await expect(row(page, '4101')).toBeVisible();
    await expect(row(page, '4102')).toHaveCount(0);
    await expect(row(page, '4103')).toHaveCount(0);

    // SAM 관계자 필터
    await filter.click();
    await page.getByRole('option', { name: 'SAM 관계자', exact: true }).click();
    await expect(row(page, '4103')).toBeVisible();
    await expect(row(page, '4101')).toHaveCount(0);

    // 집계 탭 — 묶음 이름
    await page.getByRole('tab', { name: '집계' }).click();
    const summary = page.getByRole('main');
    await expect(summary.getByText(`${PREFIX}가배우`).first()).toBeVisible();
    await expect(summary.getByText('연출·스태프 관계자').first()).toBeVisible();
    await expect(
      summary.getByText('SAM 관계자', { exact: true }).first()
    ).toBeVisible();
  });

  test('SCR-D13 입장 명단에 초대한 사람·적용 가격 줄이 나온다(IP-7)', async ({
    page,
    request,
  }) => {
    const { showId } = await seedBooked(request);
    await page.goto(`/admission?showId=${showId}`);
    const inviter = page
      .getByTestId('admission-inviter')
      .filter({ visible: true });
    await expect(
      inviter.filter({ hasText: 'SAM 관계자 · 1매 10,000원' })
    ).toHaveCount(1);
    await expect(
      inviter.filter({ hasText: `${PREFIX}가배우 · 1매 20,000원` }).first()
    ).toBeVisible();
  });

  test('드롭다운 화살표 오른쪽 여백 = 글자 시작 여백(medium·small — v1.3.1)', async ({
    page,
    request,
  }, testInfo) => {
    await seedBooked(request);
    const measure = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('.MuiSelect-select')]
          .filter((el) => (el as HTMLElement).offsetParent !== null)
          .map((el) => {
            const root = el.closest('.MuiInputBase-root') as HTMLElement;
            const path = root.querySelector('.MuiSelect-icon path') as Element;
            const r = root.getBoundingClientRect();
            const g = path.getBoundingClientRect();
            return {
              size: root.classList.contains('MuiInputBase-sizeSmall')
                ? 'small'
                : 'medium',
              left: parseFloat(getComputedStyle(el).paddingLeft),
              right: Math.round((r.right - g.right) * 10) / 10,
            };
          })
      );
    await page.goto('/reservations');
    await expect(page.getByTestId('reservation-inviter-filter')).toBeVisible();
    const small = await measure();
    await page.goto('/applications');
    await expect(page.locator('.MuiSelect-select').first()).toBeVisible();
    const medium = await measure();
    const all = [...small, ...medium];
    expect(all.some((m) => m.size === 'small')).toBe(true);
    expect(all.some((m) => m.size === 'medium')).toBe(true);
    for (const m of all)
      expect(Math.abs(m.left - m.right)).toBeLessThanOrEqual(0.5);
    await testInfo.attach('select-padding', {
      body: JSON.stringify(all),
      contentType: 'application/json',
    });
    if (testInfo.project.name === 'desktop') {
      await page.goto('/reservations');
      await page
        .getByTestId('reservation-inviter-filter')
        .scrollIntoViewIfNeeded();
      await page.screenshot({
        path: testInfo.outputPath('select-padding-dashboard.png'),
      });
    }
  });
});
