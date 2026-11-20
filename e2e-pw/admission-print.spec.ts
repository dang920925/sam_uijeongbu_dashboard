// ----------------------------------------------------------------------
// 회차 입장 명단 인쇄·PDF 저장(오프라인 대비 — 지휘자 추가 2026-11-20) — 인쇄 화면이 열리면 window.print() 를
// 한 번 부르고, 머리말·확정/입금 대기 구역·등급별 매수·끝 4자리만·입장 체크 칸·바닥글을 보인다. 취소 예매는 뺀다.
// window.print 는 테스트에서 가로채 호출만 기록한다.
// ----------------------------------------------------------------------
import { expect, test, type APIRequestContext } from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-print-';
const TITLE = `${PREFIX}작품`;

interface Created {
  id: string;
}

async function seed(request: APIRequestContext) {
  const perf = await adminApi<Created>(request, 'POST', '/admin/performances', {
    title: TITLE,
    type: 'PLAY',
    status: 'UPCOMING',
    description: null,
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
      totalSeats: 50,
      bookingOpenAt: '2026-01-01T00:00:00+09:00',
    }
  );
  const tier = (name: string, price: number, visibility: string) =>
    adminApi<Created>(
      request,
      'POST',
      `/admin/performances/${perf.id}/price-tiers`,
      {
        name,
        price,
        visibility,
      }
    );
  const general = await tier('일반', 10000, 'PUBLIC');
  const staff = await tier('스태프', 5000, 'LINK_ONLY');
  const reserve = (data: Record<string, unknown>) =>
    adminApi(request, 'POST', '/__mock/booking/reservation', {
      showId: show.id,
      ...data,
    });
  await reserve({
    bookerName: '하늘',
    bookerPhone: '010-1111-5678',
    items: [
      { tierId: general.id, quantity: 2 },
      { tierId: staff.id, quantity: 1 },
    ],
    status: 'CONFIRMED',
    admittedCount: 1,
    code: '1001',
  });
  await reserve({
    bookerName: '가람',
    bookerPhone: '010-2222-0001',
    items: [{ tierId: general.id, quantity: 1 }],
    status: 'CONFIRMED',
    code: '3003',
  });
  await reserve({
    bookerName: '나무',
    bookerPhone: '010-3333-0002',
    items: [{ tierId: general.id, quantity: 2 }],
    code: '2002',
  });
  await reserve({
    bookerName: '취소된손님',
    bookerPhone: '010-4444-0003',
    items: [{ tierId: general.id, quantity: 1 }],
    status: 'CANCELLED',
    code: '4004',
  });
  return show.id;
}

test.describe('회차 입장 명단 PDF 저장', () => {
  test.beforeEach(async ({ request, page }) => {
    await resetMock(request);
    await page.addInitScript(() => {
      const w = window as unknown as { __printCalls: number };
      w.__printCalls = 0;
      window.print = () => {
        w.__printCalls += 1;
      };
    });
  });

  test('인쇄 화면은 머리말·확정/입금 대기 구역·체크 칸·바닥글을 보이고 인쇄 창을 한 번 연다', async ({
    page,
    request,
  }) => {
    // Arrange
    const showId = await seed(request);
    // Act
    await page.goto(`/admission/${showId}/print`);
    // Assert — 머리말
    await expect(
      page.getByRole('heading', { level: 1, name: `${TITLE} · 입장 명단` })
    ).toBeVisible();
    await expect(
      page.getByText('2099.12.12 14:00 · fixture-print-소극장')
    ).toBeVisible();
    await expect(
      page.getByText(/확정 4매 · 입금 대기 1건 · 출력 /)
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { __printCalls: number }).__printCalls
        )
      )
      .toBe(1);
    // 확정 구역: 이름 가나다순(가람 → 하늘), 등급별 매수, 끝 4자리만, 체크 칸 = 매수
    const confirmed = page.locator('section').filter({ hasText: '확정 (2건)' });
    await expect(confirmed.locator('tbody tr')).toHaveCount(2);
    await expect(confirmed.locator('tbody tr').first()).toContainText('가람');
    const sky = confirmed.locator('[data-print-code="1001"]');
    await expect(sky).toContainText('일반 2 · 스태프 1');
    await expect(sky).toContainText('5678');
    await expect(
      sky.getByRole('img', { name: '입장 체크 칸 3개' })
    ).toBeVisible();
    // 입금 대기 구역 따로, 취소 제외, 전체 연락처 없음
    const pending = page
      .locator('section')
      .filter({ hasText: '입금 대기 (1건)' });
    await expect(pending).toContainText('나무');
    await expect(page.getByText('취소된손님')).toHaveCount(0);
    await expect(page.getByText('010-1111-5678')).toHaveCount(0);
    await expect(
      page.getByText('개인정보가 포함된 문서입니다. 공연 후 파기해 주세요.')
    ).toBeVisible();
  });

  test('예매번호순으로 바꿀 수 있고, 입장 체크·예매 관리 버튼이 그 회차 인쇄 화면으로 간다', async ({
    page,
    request,
  }) => {
    // Arrange
    const showId = await seed(request);
    // Act — 예매번호순
    await page.goto(`/admission/${showId}/print?sort=code`);
    const confirmed = page.locator('section').filter({ hasText: '확정 (2건)' });
    // Assert
    await expect(confirmed.locator('tbody tr').first()).toContainText('1001');
    await expect(
      page.getByRole('button', { name: '예매번호순' })
    ).toHaveAttribute('aria-pressed', 'true');
    // 입장 체크(D13) 버튼 — 고른 회차의 인쇄 화면(새 탭)
    await page.goto(`/admission?showId=${showId}`);
    const link = page.getByRole('link', { name: '명단 PDF 저장' });
    await expect(link).toHaveAttribute('href', `/admission/${showId}/print`);
    await expect(link).toHaveAttribute('target', '_blank');
  });
});
