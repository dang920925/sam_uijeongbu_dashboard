// ----------------------------------------------------------------------
// SCR-D13 입장 체크(FN-36, develop §11.8 S20~S24 · §11.10 S52 · design §6.1a) — 회차 선택·현황, +1 즉시 반영, −1 되돌리기,
// 전원 입장, 입금 대기 → 시트 → 확정+입장, 검색(이름·예매번호·끝 4자리), 관리자 등록 행·할인 등급 Label,
// 동시성(다른 컨텍스트가 먼저 처리 → 409 정본 스낵바 + 재조회, 다른 컨텍스트 변경이 10초 안에 보임),
// 다른 회차 예매 안내 + 이동, 오프라인 배너(조회 실패·처리 실패), 현장 예매 등록, mobile 390 터치 48 실측.
// desktop 은 표(lg), mobile 은 카드 — 보이는 요소만 골라 같은 테스트로 돈다.
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type APIRequestContext,
  type Browser,
  type Page,
} from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';
import { AUTH_STATE } from '@/playwright.config';

const PREFIX = 'fixture-r1-w3-';
const TITLE = `${PREFIX}작품`;
const DAY_MS = 24 * 60 * 60 * 1000;
const CONFLICT = '다른 스태프가 먼저 처리했습니다. 목록을 새로 불러왔습니다.';
const OFFLINE =
  '연결이 끊겼습니다. 처리하지 못했을 수 있으니 다시 확인해주세요.';

interface Created {
  id: string;
}

interface Fixture {
  showA: string;
  showB: string;
  general: string;
  staff: string;
}

async function setup(request: APIRequestContext): Promise<Fixture> {
  const perf = await adminApi<Created>(request, 'POST', '/admin/performances', {
    title: TITLE,
    type: 'PLAY',
    status: 'UPCOMING',
    description: `${PREFIX}설명`,
    isVisible: false,
  });
  const show = (startTime: string) =>
    adminApi<Created>(request, 'POST', `/admin/performances/${perf.id}/shows`, {
      showDate: '2099-12-12',
      startTime,
      totalSeats: 50,
      bookingOpenAt: new Date(Date.now() - DAY_MS).toISOString(),
    });
  const showA = await show('14:00');
  const showB = await show('18:00');
  const policy = await request.fetch(
    `/api/backend/v1/admin/performances/${perf.id}/booking-policy`,
    {
      method: 'PUT',
      data: {
        depositBank: `${PREFIX}은행`,
        depositAccountNumber: '3333-01-1234567',
        depositAccountHolder: `${PREFIX}극단`,
        maxTicketsPerBooking: 10,
        depositDeadlineHours: 24,
        refundPolicyText: `${PREFIX}환불`,
      },
    }
  );
  expect(policy.ok()).toBe(true);
  const tier = (name: string, price: number, visibility: string) =>
    adminApi<Created>(
      request,
      'POST',
      `/admin/performances/${perf.id}/price-tiers`,
      { name, price, visibility }
    );
  const general = await tier('일반', 10000, 'PUBLIC');
  const staff = await tier('스태프', 5000, 'LINK_ONLY');
  return {
    showA: showA.id,
    showB: showB.id,
    general: general.id,
    staff: staff.id,
  };
}

async function reserve(
  request: APIRequestContext,
  body: {
    showId: string;
    bookerName: string;
    bookerPhone: string;
    items: { tierId: string; quantity: number }[];
    status?: 'PENDING' | 'CONFIRMED';
    admittedCount?: number;
    code?: string;
  }
) {
  return adminApi<Created>(
    request,
    'POST',
    '/__mock/booking/reservation',
    body
  );
}

/** 기본 명단: 홍길동(확정 4 = 일반 3 + 스태프 1, 입장 1) · 김입금(입금 대기 2) — 회차 A. 이다른(확정 2) — 회차 B */
async function seed(request: APIRequestContext, f: Fixture) {
  await reserve(request, {
    showId: f.showA,
    bookerName: '홍길동',
    bookerPhone: '010-1111-5678',
    items: [
      { tierId: f.general, quantity: 3 },
      { tierId: f.staff, quantity: 1 },
    ],
    status: 'CONFIRMED',
    admittedCount: 1,
    code: '4321',
  });
  await reserve(request, {
    showId: f.showA,
    bookerName: '김입금',
    bookerPhone: '010-2222-0001',
    items: [{ tierId: f.general, quantity: 2 }],
    code: '1111',
  });
  await reserve(request, {
    showId: f.showB,
    bookerName: '이다른',
    bookerPhone: '010-3333-0002',
    items: [{ tierId: f.general, quantity: 2 }],
    status: 'CONFIRMED',
    code: '7777',
  });
}

/** 표(desktop)·카드(mobile) 중 보이는 쪽의 그 예매 행 */
function rowOf(page: Page, isMobile: boolean, name: string) {
  return isMobile
    ? page.getByRole('article', { name })
    : page.getByRole('row').filter({ hasText: name });
}

function stat(page: Page, id: string) {
  return page.getByTestId(id).filter({ visible: true });
}

async function expectSummary(
  page: Page,
  values: { admitted: number; confirmed: number; pending?: number }
) {
  await expect(stat(page, 'stat-admitted')).toHaveText(String(values.admitted));
  await expect(stat(page, 'stat-confirmed')).toHaveText(
    `/ ${values.confirmed}매`
  );
  if (values.pending !== undefined)
    await expect(stat(page, 'stat-pending')).toHaveText(String(values.pending));
}

async function openAdmission(page: Page, showId?: string) {
  await page.goto(showId ? `/admission?showId=${showId}` : '/admission');
  await expect(page.getByRole('heading', { name: '입장 체크' })).toBeVisible();
}

let fixture: Fixture;

test.beforeEach(async ({ request }) => {
  await resetMock(request);
  fixture = await setup(request);
  await seed(request, fixture);
});

test('회차를 고르면 현황과 명단이 그 회차로 바뀌고 주소에 남는다(S24·S52)', async ({
  page,
  isMobile,
}) => {
  await openAdmission(page);
  const chips = page.getByRole('group', { name: '회차 선택' });
  await expect(
    chips.getByRole('button', { name: `${TITLE} · 12/12 14:00` })
  ).toHaveAttribute('aria-pressed', 'true');
  await expectSummary(page, { admitted: 1, confirmed: 4, pending: 1 });
  const hong = rowOf(page, isMobile, '홍길동');
  await expect(hong).toContainText('1/4');
  // 등급별 매수 — 기본 등급은 글자, 링크 전용 등급은 info Label + 글자
  await expect(hong.locator('[data-tier-kind=public]')).toHaveText('일반 3');
  // 할인(링크 전용) 줄은 색만이 아니라 "링크 전용(할인)" 글자를 함께 보인다(지휘자 전달 2026-11-20)
  await expect(hong.locator('[data-tier-kind=discount]')).toHaveText(
    '스태프 1링크 전용(할인)'
  );
  await expect(hong).toContainText('연락처 끝 5678');

  await chips.getByRole('button', { name: `${TITLE} · 12/12 18:00` }).click();
  await expect(page).toHaveURL(new RegExp(`showId=${fixture.showB}`));
  await expectSummary(page, { admitted: 0, confirmed: 2, pending: 0 });
  await expect(rowOf(page, isMobile, '이다른')).toContainText('0/2');

  // 새로고침해도 고른 회차를 기억한다(주소 없이 다시 들어와도)
  await page.goto('/admission');
  await expectSummary(page, { admitted: 0, confirmed: 2, pending: 0 });
});

test('+1 입장은 현황을 즉시 바꾸고, −1 로 되돌리고, 전원 입장하면 입장 완료가 된다(S21)', async ({
  page,
  isMobile,
}) => {
  await openAdmission(page);
  const hong = rowOf(page, isMobile, '홍길동');
  await page.getByRole('button', { name: '홍길동 1명 입장' }).click();
  await expectSummary(page, { admitted: 2, confirmed: 4 });
  await expect(hong).toContainText('2/4');
  await expect(page.getByText('홍길동 1명 입장')).toBeVisible();

  await page.getByRole('button', { name: '홍길동 입장 1명 되돌리기' }).click();
  await expectSummary(page, { admitted: 1, confirmed: 4 });
  await expect(hong).toContainText('1/4');

  await page.getByRole('button', { name: '홍길동 남은 3명 모두 입장' }).click();
  await expectSummary(page, { admitted: 4, confirmed: 4 });
  await expect(hong).toContainText('4/4');
  await expect(hong).toContainText('입장 완료');
  await expect(
    page.getByRole('button', { name: '홍길동 1명 입장' })
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: '홍길동 입장 1명 되돌리기' })
  ).toBeEnabled();
});

test('입금 대기 예매는 시트에서 금액을 확인하고 입장 인원을 골라 확정 + 입장한다(S22)', async ({
  page,
  isMobile,
}) => {
  await openAdmission(page);
  const kim = rowOf(page, isMobile, '김입금');
  await expect(kim).toContainText('입금 대기');
  await kim.getByRole('button', { name: '입금 확인 + 입장' }).click();
  const sheet = page.getByRole('dialog', {
    name: '20,000원 입금을 확인했나요?',
  });
  await expect(sheet).toContainText('김입금 · 예매 1111 · 2매');
  await expect(sheet).toContainText('김입금1111');
  await expect(
    sheet.getByRole('button', { name: '입장 인원 늘리기' })
  ).toBeDisabled();
  await sheet.getByRole('button', { name: '입장 인원 줄이기' }).click();
  await sheet.getByRole('button', { name: '입금 확인 + 입장' }).click();
  await expect(sheet).toBeHidden();
  await expectSummary(page, { admitted: 2, confirmed: 6, pending: 0 });
  await expect(kim).toContainText('1/2');
  await expect(kim).toContainText('확정');
});

test('이름 일부·예매번호·연락처 끝 4자리로 찾고, 없으면 안내와 현장 예매 등록을 보인다(S23)', async ({
  page,
  isMobile,
}) => {
  await openAdmission(page);
  const search = page.getByRole('searchbox', { name: '예매 검색' });
  await search.fill('길동');
  await expect(rowOf(page, isMobile, '홍길동')).toBeVisible();
  await expect(rowOf(page, isMobile, '김입금')).toHaveCount(0);
  await expect(page.getByText('검색 결과 1건')).toBeVisible();

  await search.fill('1111');
  await expect(rowOf(page, isMobile, '김입금')).toBeVisible();
  await expect(rowOf(page, isMobile, '홍길동')).toHaveCount(0);

  await search.fill('5678');
  await expect(rowOf(page, isMobile, '홍길동')).toBeVisible();
  await expect(rowOf(page, isMobile, '김입금')).toHaveCount(0);

  await search.fill('없는사람');
  await expect(
    page.getByText('찾는 예매가 없습니다. 이름이나 번호를 다시 확인해주세요.')
  ).toBeVisible();
  await page.getByRole('button', { name: '검색어 지우기' }).click();
  await expect(rowOf(page, isMobile, '김입금')).toBeVisible();
});

test('연락처 없는 관리자 등록 예매는 끝 4자리 칸 없이 관리자 등록·직접 입력 Label 로 보인다', async ({
  page,
  request,
  isMobile,
}) => {
  await adminApi(request, 'POST', '/admin/reservations', {
    showId: fixture.showA,
    bookerName: '박초대',
    customLine: { quantity: 2, amount: 0 },
    status: 'CONFIRMED',
    memo: `${PREFIX}연출 지인`,
  });
  await openAdmission(page);
  const park = rowOf(page, isMobile, '박초대');
  await expect(park).toContainText('관리자 등록');
  await expect(park).toContainText(`${PREFIX}연출 지인`);
  await expect(park.locator('[data-tier-kind=custom]')).toHaveText(
    '직접 입력 2'
  );
  await expect(park).not.toContainText('연락처 끝');
  await expectSummary(page, { admitted: 1, confirmed: 6 });
});

async function secondPage(browser: Browser, page: Page) {
  const context = await browser.newContext({
    storageState: AUTH_STATE,
    baseURL: new URL(page.url()).origin,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });
  return { context, other: await context.newPage() };
}

test('다른 스태프가 마지막 1명을 먼저 입장시키면 409 정본 스낵바 후 새 명단을 보인다(S20·J-40)', async ({
  page,
  browser,
  request,
  isMobile,
}) => {
  await reserve(request, {
    showId: fixture.showA,
    bookerName: '최막차',
    bookerPhone: '010-4444-0003',
    items: [{ tierId: fixture.general, quantity: 2 }],
    status: 'CONFIRMED',
    admittedCount: 1,
  });
  await openAdmission(page);
  const mine = rowOf(page, isMobile, '최막차');
  await expect(mine).toContainText('1/2');

  const { context, other } = await secondPage(browser, page);
  await openAdmission(other, fixture.showA);
  await other.getByRole('button', { name: '최막차 1명 입장' }).click();
  await expect(
    other.getByRole('row').filter({ hasText: '최막차' })
  ).toContainText('2/2');
  await context.close();

  // 첫 화면은 아직 1/2 — 누르면 서버가 409 RSV_010 → 낙관 표시를 되돌리고 다시 불러온다
  await page.getByRole('button', { name: '최막차 1명 입장' }).click();
  await expect(page.getByText(CONFLICT)).toBeVisible();
  await expect(mine).toContainText('2/2');
  await expect(mine).toContainText('입장 완료');
});

test('다른 브라우저의 입장 변경이 10초 갱신으로 보인다(J-41·S24)', async ({
  page,
  browser,
  isMobile,
}) => {
  test.setTimeout(60_000);
  await openAdmission(page);
  const hong = rowOf(page, isMobile, '홍길동');
  await expect(hong).toContainText('1/4');

  const { context, other } = await secondPage(browser, page);
  await openAdmission(other, fixture.showA);
  await other.getByRole('button', { name: '홍길동 1명 입장' }).click();
  await expect(
    other.getByRole('row').filter({ hasText: '홍길동' })
  ).toContainText('2/4');
  await context.close();

  await expect(hong).toContainText('2/4', { timeout: 15_000 });
  await expectSummary(page, { admitted: 2, confirmed: 4 });
});

test('다른 회차의 예매번호를 찾으면 안내 카드와 그 회차로 이동을 보인다(§6.1a·S42)', async ({
  page,
  isMobile,
}) => {
  await openAdmission(page, fixture.showA);
  await page.getByRole('searchbox', { name: '예매 검색' }).fill('7777');
  const card = page.getByRole('region', { name: '다른 회차 예매입니다' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('이 회차(12/12 14:00) 명단에는 없습니다.');
  await expect(card).toContainText('이다른');
  await expect(card).toContainText('예매 7777');
  await expect(card).toContainText('12/12 18:00');
  await card.getByRole('button', { name: '그 회차로 이동' }).click();
  await expect(page).toHaveURL(new RegExp(`showId=${fixture.showB}`));
  // 검색어는 유지된다
  await expect(page.getByRole('searchbox', { name: '예매 검색' })).toHaveValue(
    '7777'
  );
  await expect(rowOf(page, isMobile, '이다른')).toBeVisible();
});

test('명단 조회가 실패하면 연결 끊김 배너를 보이고 다시 시도로 회복한다', async ({
  page,
  request,
}) => {
  await openAdmission(page);
  await expectSummary(page, { admitted: 1, confirmed: 4 });
  await adminApi(request, 'POST', '/__mock/fault', {
    method: 'GET',
    pattern: '^/v1/admin/shows/.*/admission$',
    status: 500,
    count: 20,
  });
  await page
    .getByRole('button', { name: '지금 새로고침' })
    .filter({ visible: true })
    .click();
  const banner = page.getByRole('alert').filter({ hasText: OFFLINE });
  await expect(banner).toBeVisible();
  await expect(
    page.getByText(/\d{2}:\d{2} 기준/).filter({ visible: true })
  ).toBeVisible();

  await adminApi(request, 'POST', '/__mock/fault/clear');
  await banner.getByRole('button', { name: '다시 시도' }).click();
  await expect(banner).toBeHidden();
  await expectSummary(page, { admitted: 1, confirmed: 4 });
});

test('입장 처리 요청이 네트워크에서 끊기면 숫자를 되돌리고 배너를 보인다', async ({
  page,
  isMobile,
}) => {
  await openAdmission(page);
  await page.route(
    '**/api/backend/v1/admin/reservations/*/admission',
    (route) => route.abort('internetdisconnected')
  );
  await page.getByRole('button', { name: '홍길동 1명 입장' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: OFFLINE })
  ).toBeVisible();
  await expect(rowOf(page, isMobile, '홍길동')).toContainText('1/4');
  await expectSummary(page, { admitted: 1, confirmed: 4 });
});

test('휴대폰이 실제로 오프라인이면 +1 을 눌러도 입장 완료로 바꾸지 않고 배너를 보이며, 다시 연결돼도 몰래 보내지 않는다(R1-001)', async ({
  page,
  context,
  request,
  isMobile,
}) => {
  await openAdmission(page);
  await expectSummary(page, { admitted: 1, confirmed: 4 });
  const banner = page.getByRole('alert').filter({ hasText: OFFLINE });
  // Act — 연결 끊김(navigator.onLine=false) 뒤 +1 · 전원 입장
  await context.setOffline(true);
  await expect(banner).toBeVisible();
  await page.getByRole('button', { name: '홍길동 1명 입장' }).click();
  await page.getByRole('button', { name: '홍길동 남은 3명 모두 입장' }).click();
  // Assert — 낙관 표시 없음
  await expect(rowOf(page, isMobile, '홍길동')).toContainText('1/4');
  await expectSummary(page, { admitted: 1, confirmed: 4 });
  // Act — 다시 연결
  await context.setOffline(false);
  await banner.getByRole('button', { name: '다시 시도' }).click();
  await expect(banner).toBeHidden();
  // Assert — 보류됐던 요청이 나중에 전송되지 않았다(서버 값 그대로)
  await page.waitForTimeout(1_500);
  const board = await adminApi<{
    items: { bookerName: string; admittedCount: number }[];
  }>(request, 'GET', `/admin/shows/${fixture.showA}/admission`);
  expect(
    board.items.find((item) => item.bookerName === '홍길동')?.admittedCount
  ).toBe(1);
  await expect(rowOf(page, isMobile, '홍길동')).toContainText('1/4');
});

test('현장 예매 등록으로 등급 매수를 넣으면 확정 + 입장된 새 행이 생긴다(S16·S48)', async ({
  page,
  isMobile,
}) => {
  await openAdmission(page);
  await page
    .getByRole('button', { name: '현장 예매 등록' })
    .filter({ visible: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: '예매 등록' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: /^이름/ }).fill('정현장');
  await dialog.getByRole('button', { name: '일반 1매 더하기' }).click();
  await dialog.getByRole('button', { name: '일반 1매 더하기' }).click();
  await dialog.getByRole('button', { name: '등록' }).click();
  await expect(dialog).toBeHidden();
  const row = rowOf(page, isMobile, '정현장');
  await expect(row).toContainText('2/2');
  await expect(row).toContainText('관리자 등록');
  await expectSummary(page, { admitted: 3, confirmed: 6 });
});

test('휴대폰 390 에서 현장 조작 요소는 모두 48 이상이다(S24)', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, '휴대폰 화면 전용');
  await page.setViewportSize({ width: 390, height: 844 });
  await openAdmission(page);
  const targets = [
    page.getByRole('button', { name: '홍길동 1명 입장' }),
    page.getByRole('button', { name: '홍길동 입장 1명 되돌리기' }),
    page.getByRole('button', { name: '홍길동 남은 3명 모두 입장' }),
    page.getByRole('button', { name: '입금 확인 + 입장' }),
    page.getByRole('searchbox', { name: '예매 검색' }),
    page.getByRole('button', { name: '숫자 키패드 123' }),
    page.getByRole('button', { name: '지금 새로고침' }),
    page.getByRole('button', { name: `${TITLE} · 12/12 14:00` }),
    page.getByRole('button', { name: '현장 예매 등록' }),
  ];
  for (const target of targets) {
    const box = await target.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
  }
  const plus = await targets[0].boundingBox();
  expect(plus?.width ?? 0).toBeGreaterThanOrEqual(48);
  // 페이지 가로 넘침 없음
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('휴대폰 390 의 현장 예매 등록 창 안 조작 요소도 모두 48 이상이다(S24 · R1-004)', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, '휴대폰 화면 전용');
  await page.setViewportSize({ width: 390, height: 844 });
  await openAdmission(page);
  await page
    .getByRole('button', { name: '현장 예매 등록' })
    .filter({ visible: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: '예매 등록' });
  await expect(dialog).toBeVisible();
  const controls = dialog.locator(
    'button:visible, input:not([type=checkbox]):not([type=radio]):visible, textarea:visible'
  );
  const count = await controls.count();
  expect(count).toBeGreaterThan(5);
  for (let i = 0; i < count; i += 1) {
    const control = controls.nth(i);
    // 입력칸은 둘러싼 InputBase 높이로 잰다
    const box = await control.evaluate((el) => {
      const target = el.closest('.MuiInputBase-root') ?? el;
      const rect = target.getBoundingClientRect();
      return { height: rect.height, width: rect.width };
    });
    expect(
      box.height,
      (await control.getAttribute('aria-label')) ?? `#${i}`
    ).toBeGreaterThanOrEqual(48);
  }
});
