// ----------------------------------------------------------------------
// SCR-D13 입장 체크 연동(FN-36, develop §11.4 · §11.10, back-end §14.4 #2·#4) — 실서버 + 로컬 DB.
// 픽스처는 관리 API·공개 예매(중계 비밀)로 직접 만든다: 공연 A(일반 PUBLIC · 단원할인 LINK_ONLY) 회차 A1,
// 다른 공연 B 회차 B1(다른 회차 안내 — 다른 공연 포함).
// 흐름: 명단(이름순 + 미입장 먼저 · 할인 Label · 관리자 등록) · 검색(이름·예매번호·끝 4자리, 연락처 없는 예매) ·
// 부분 입장(+1·+1 → 2/4)·되돌리기 · 입금 확인 + 입장(version) · 다른 회차 안내·이동 · 현장 등록(등급·0원 직접 입력) ·
// 10초 자동 갱신 · 동시성(API 6중 +1 · 화면 두 컨텍스트 RSV_010 · confirm-and-admit 같은 version RSV_007).
// ----------------------------------------------------------------------
import { expect, test, type Browser, type Page } from '@playwright/test';

import {
  adminApi,
  adminToken,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
  INT_API_BASE_URL,
  relayPost,
} from '@/e2e-pw/integration/support/integration-api';
import { INTEGRATION_AUTH_STATE } from '@/playwright.config';

const P = fixturePrefix('adm');
const TITLE = `${P}공연`;
const OTHER_TITLE = `${P}다른공연`;
const DAY_MS = 24 * 60 * 60 * 1000;
const CONFLICT = '다른 스태프가 먼저 처리했습니다. 목록을 새로 불러왔습니다.';

const GARAM = `${P}가람`; // 공개 예매 → 확정, 일반 2 + 단원할인 2(링크 전용)
const NARAE = `${P}나래`; // 공개 예매 입금 대기 2매
const DASOM = `${P}다솜`; // 관리자 등록 확정 3매, 연락처 없음
const RAON = `${P}라온`; // 관리자 등록 확정 1매, 이미 입장 완료(이름은 앞이지만 아래로)
const ARA = `${P}아라`; // 다른 공연 B 회차의 관리자 등록

interface Created {
  id: string;
}

interface BoardItem {
  id: string;
  code: string;
  bookerName: string;
  phoneLast4: string | null;
  quantity: number;
  admittedCount: number;
  status: string;
  amount: number;
  version: number;
  source: string;
}

interface Board {
  summary: { confirmedQty: number; admittedCount: number };
  items: BoardItem[];
  otherShowMatches: unknown[];
}

interface Fixture {
  performanceId: string;
  showA: string;
  showB: string;
  general: string;
  discount: string;
  discountToken: string;
  otherCode: string;
}

let fx: Fixture;

function kstDate(offsetDays: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(Date.now() + offsetDays * DAY_MS)
  );
}

let phoneSeq = 0;
function nextPhone(): string {
  phoneSeq += 1;
  return `010-7${String(phoneSeq).padStart(3, '0')}-${String(4100 + phoneSeq)}`;
}

/** 관리 API 원본 호출 — 상태·본문을 그대로(동시성 분포 확인용, 실패해도 던지지 않음) */
async function rawAdmin(
  path: string,
  body: unknown
): Promise<{ status: number; code: string | null }> {
  const response = await fetch(`${INT_API_BASE_URL}/api/v1${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${await adminToken()}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => null)) as {
    code?: string;
  } | null;
  return { status: response.status, code: json?.code ?? null };
}

async function boardOf(showId: string, q = ''): Promise<Board> {
  const query = q ? `?q=${encodeURIComponent(q)}` : '';
  return adminApi<Board>('GET', `/admin/shows/${showId}/admission${query}`);
}

async function itemOf(showId: string, name: string): Promise<BoardItem> {
  const found = (await boardOf(showId)).items.find(
    (item) => item.bookerName === name
  );
  if (!found) throw new Error(`명단에 ${name} 이 없습니다`);
  return found;
}

/** 공개 예매(입금 대기) — 응답에 id 가 없어 명단에서 찾는다 */
async function publicReservation(
  name: string,
  items: { tierId: string; quantity: number }[],
  tierToken: string | null = null
): Promise<BoardItem> {
  const res = await relayPost('/reservations', {
    showId: fx.showA,
    items,
    tierToken,
    bookerName: name,
    bookerPhone: nextPhone(),
    agreedToPrivacy: true,
    agreedToRefundPolicy: true,
  });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return itemOf(fx.showA, name);
}

async function manualReservation(body: Record<string, unknown>) {
  return adminApi<BoardItem & { showId: string }>(
    'POST',
    '/admin/reservations',
    body
  );
}

async function createFixture(): Promise<Fixture> {
  const perf = await adminApi<Created>('POST', '/admin/performances', {
    title: TITLE,
    type: 'PLAY',
    status: 'ONGOING',
  });
  // 예매 설정은 PUT 이라 도우미(adminApi — PUT 없음) 대신 직접 부른다
  const policy = await fetch(
    `${INT_API_BASE_URL}/api/v1/admin/performances/${perf.id}/booking-policy`,
    {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${await adminToken()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        depositBank: '카카오뱅크',
        depositAccountNumber: '3333-01-1234567',
        depositAccountHolder: '극단',
        maxTicketsPerBooking: 10,
        depositDeadlineHours: 24,
        refundPolicyText: '공연 전날까지 전액 환불',
      }),
    }
  );
  expect(policy.status).toBe(200);
  const general = await adminApi<Created>(
    'POST',
    `/admin/performances/${perf.id}/price-tiers`,
    { name: '일반', price: 20000, visibility: 'PUBLIC', sortOrder: 0 }
  );
  const discount = await adminApi<Created & { linkToken: string }>(
    'POST',
    `/admin/performances/${perf.id}/price-tiers`,
    { name: '단원할인', price: 10000, visibility: 'LINK_ONLY', sortOrder: 1 }
  );
  const showA = await adminApi<Created>(
    'POST',
    `/admin/performances/${perf.id}/shows`,
    {
      showDate: kstDate(10),
      startTime: '19:30',
      venue: '소극장',
      totalSeats: 60,
      bookingOpenAt: new Date(Date.now() - DAY_MS).toISOString(),
    }
  );

  const other = await adminApi<Created>('POST', '/admin/performances', {
    title: OTHER_TITLE,
    type: 'PLAY',
    status: 'ONGOING',
  });
  const otherTier = await adminApi<Created>(
    'POST',
    `/admin/performances/${other.id}/price-tiers`,
    { name: '일반', price: 15000, visibility: 'PUBLIC' }
  );
  const showB = await adminApi<Created>(
    'POST',
    `/admin/performances/${other.id}/shows`,
    { showDate: kstDate(12), startTime: '15:00', totalSeats: 20 }
  );
  const ara = await manualReservation({
    showId: showB.id,
    bookerName: ARA,
    items: [{ tierId: otherTier.id, quantity: 2 }],
    status: 'CONFIRMED',
  });
  return {
    performanceId: perf.id,
    showA: showA.id,
    showB: showB.id,
    general: general.id,
    discount: discount.id,
    discountToken: discount.linkToken,
    otherCode: ara.code,
  };
}

/** 표(1440)의 그 예매 행 */
function rowOf(page: Page, name: string) {
  return page.getByRole('row').filter({ hasText: name });
}

function stat(page: Page, id: string) {
  return page.getByTestId(id).filter({ visible: true });
}

async function openAdmission(page: Page, showId: string) {
  await page.goto(`/admission?showId=${showId}`);
  await expect(page.getByRole('heading', { name: '입장 체크' })).toBeVisible();
}

function admissionPost(page: Page) {
  return page.waitForResponse(
    (r) =>
      r.request().method() === 'POST' &&
      /\/admin\/reservations\/[^/]+\/(admission|confirm-and-admit)$/.test(
        new URL(r.url()).pathname
      )
  );
}

async function secondPage(browser: Browser, page: Page) {
  const context = await browser.newContext({
    storageState: INTEGRATION_AUTH_STATE,
    baseURL: new URL(page.url()).origin,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });
  return { context, other: await context.newPage() };
}

test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

test.describe('SCR-D13 입장 체크(실서버)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    fx = await createFixture();
    const garam = await publicReservation(
      GARAM,
      [
        { tierId: fx.general, quantity: 2 },
        { tierId: fx.discount, quantity: 2 },
      ],
      fx.discountToken
    );
    await adminApi('POST', `/admin/reservations/${garam.id}/confirm`, {
      version: garam.version,
    });
    await publicReservation(NARAE, [{ tierId: fx.general, quantity: 2 }]);
    await manualReservation({
      showId: fx.showA,
      bookerName: DASOM,
      items: [{ tierId: fx.general, quantity: 3 }],
      status: 'CONFIRMED',
    });
    await manualReservation({
      showId: fx.showA,
      bookerName: RAON,
      items: [{ tierId: fx.general, quantity: 1 }],
      status: 'CONFIRMED',
      admitNow: 1,
    });
  });

  test('회차 목록 항목에 공연 id 가 있고, 명단은 미입장 먼저·이름순에 할인·관리자 등록을 보인다', async ({
    page,
  }) => {
    // 계약 — GET /admin/shows?from= 항목의 performanceId(현장 등록 등급 키)
    const shows = await adminApi<{
      items: { id: string; performanceId: string; performanceTitle: string }[];
    }>('GET', `/admin/shows?from=${kstDate(0)}`);
    expect(shows.items.find((s) => s.id === fx.showA)).toMatchObject({
      performanceId: fx.performanceId,
      performanceTitle: TITLE,
    });

    await openAdmission(page, fx.showA);
    await expect(stat(page, 'stat-admitted')).toHaveText('1');
    await expect(stat(page, 'stat-confirmed')).toHaveText('/ 8매');
    await expect(stat(page, 'stat-pending')).toHaveText('1');

    const names = await page
      .locator('tr[data-row-kind]')
      .evaluateAll((rows) => rows.map((r) => r.textContent ?? ''));
    const order = [GARAM, NARAE, DASOM, RAON].map((name) =>
      names.findIndex((text) => text.includes(name))
    );
    // 라온(이름은 앞)은 입장 완료라 맨 아래
    expect(order).toEqual([0, 1, 2, 3]);

    const garam = rowOf(page, GARAM);
    await expect(garam.locator('[data-tier-kind=public]')).toHaveText('일반 2');
    await expect(garam.locator('[data-tier-kind=discount]')).toHaveText(
      '단원할인 2링크 전용(할인)'
    );
    await expect(garam).toContainText('0/4');
    const dasom = rowOf(page, DASOM);
    await expect(dasom).toContainText('관리자 등록');
    await expect(dasom).not.toContainText('연락처 끝');
    await expect(rowOf(page, RAON)).toContainText('입장 완료');
    await expect(rowOf(page, NARAE)).toContainText('입금 대기');
  });

  test('이름·예매번호·끝 4자리로 찾고, 연락처 없는 관리자 등록은 번호로만 찾힌다', async ({
    page,
  }) => {
    const garam = await itemOf(fx.showA, GARAM);
    const dasom = await itemOf(fx.showA, DASOM);
    expect(garam.phoneLast4).toMatch(/^\d{4}$/);
    expect(dasom.phoneLast4).toBeNull();

    await openAdmission(page, fx.showA);
    const search = page.getByRole('searchbox', { name: '예매 검색' });
    await search.fill('나래');
    await expect(rowOf(page, NARAE)).toBeVisible();
    await expect(rowOf(page, GARAM)).toHaveCount(0);

    await search.fill(garam.phoneLast4 as string);
    await expect(rowOf(page, GARAM)).toBeVisible();
    // 서버 q 결과도 같은 행(디바운스 뒤)
    expect(
      (await boardOf(fx.showA, garam.phoneLast4 as string)).items.map(
        (i) => i.bookerName
      )
    ).toContain(GARAM);

    await search.fill(dasom.code);
    await expect(rowOf(page, DASOM)).toBeVisible();
    await expect(rowOf(page, GARAM)).toHaveCount(0);
  });

  test('4매 예매에 +1·+1 로 부분 입장(2/4), −1 로 되돌리면 서버도 1/4 다', async ({
    page,
  }) => {
    await openAdmission(page, fx.showA);
    const garam = rowOf(page, GARAM);
    const plus = page.getByRole('button', {
      name: `${GARAM} 1명 입장`,
      exact: true,
    });
    for (const expected of ['1/4', '2/4']) {
      const response = admissionPost(page);
      await plus.click();
      expect((await response).status()).toBe(200);
      await expect(garam).toContainText(expected);
    }
    await expect(stat(page, 'stat-admitted')).toHaveText('3');
    expect((await itemOf(fx.showA, GARAM)).admittedCount).toBe(2);

    const undo = admissionPost(page);
    await page
      .getByRole('button', { name: `${GARAM} 입장 1명 되돌리기`, exact: true })
      .click();
    expect((await undo).status()).toBe(200);
    await expect(garam).toContainText('1/4');
    await expect(page.getByText(`${GARAM} 입장 1명 되돌림`)).toBeVisible();
    expect((await itemOf(fx.showA, GARAM)).admittedCount).toBe(1);
  });

  test('입금 대기 예매는 입금 확인 + 입장(version)으로 확정·입장된다', async ({
    page,
  }) => {
    const before = await itemOf(fx.showA, NARAE);
    expect(before.status).toBe('PENDING');

    await openAdmission(page, fx.showA);
    const narae = rowOf(page, NARAE);
    await narae.getByRole('button', { name: '입금 확인 + 입장' }).click();
    const sheet = page.getByRole('dialog', {
      name: '40,000원 입금을 확인했나요?',
    });
    await expect(sheet).toContainText(`예매 ${before.code} · 2매`);
    await sheet.getByRole('button', { name: '입장 인원 줄이기' }).click();
    const response = admissionPost(page);
    await sheet.getByRole('button', { name: '입금 확인 + 입장' }).click();
    const sent = (await response).request().postDataJSON() as unknown;
    expect(sent).toEqual({ version: before.version, admit: 1 });
    await expect(narae).toContainText('1/2');
    await expect(narae).toContainText('확정');
    await expect(stat(page, 'stat-pending')).toHaveText('0');

    const after = await itemOf(fx.showA, NARAE);
    expect(after).toMatchObject({ status: 'CONFIRMED', admittedCount: 1 });
    expect(after.version).toBeGreaterThan(before.version);
  });

  test('이 회차에 없는 예매번호는 "다른 회차 예매입니다"(다른 공연 포함)와 이동을 보인다', async ({
    page,
  }) => {
    const board = await boardOf(fx.showA, fx.otherCode);
    expect(board.items).toEqual([]);
    expect(board.otherShowMatches).toEqual([
      expect.objectContaining({
        showId: fx.showB,
        performanceTitle: OTHER_TITLE,
        bookerName: ARA,
      }),
    ]);

    await openAdmission(page, fx.showA);
    await page.getByRole('searchbox', { name: '예매 검색' }).fill(fx.otherCode);
    const card = page.getByRole('region', { name: '다른 회차 예매입니다' });
    await expect(card).toBeVisible();
    await expect(card).toContainText(ARA);
    await expect(card).toContainText(`예매 ${fx.otherCode}`);
    await expect(card).toContainText(OTHER_TITLE);
    await expect(card).not.toContainText('undefined');
    await card.getByRole('button', { name: '그 회차로 이동' }).click();
    await expect(page).toHaveURL(new RegExp(`showId=${fx.showB}`));
    await expect(rowOf(page, ARA)).toBeVisible();
    await expect(rowOf(page, ARA)).toContainText('0/2');
  });

  test('현장 등록은 그 회차 공연의 등급을 불러와 확정 + 입장으로 등록한다', async ({
    page,
  }) => {
    const name = `${P}현장`;
    await openAdmission(page, fx.showA);
    const tiers = page.waitForResponse((r) =>
      r.url().includes(`/admin/performances/${fx.performanceId}/price-tiers`)
    );
    await page.reload();
    expect((await tiers).status()).toBe(200);
    await page
      .getByRole('button', { name: '현장 예매 등록' })
      .filter({ visible: true })
      .first()
      .click();
    const dialog = page.getByRole('dialog', { name: '예매 등록' });
    await expect(
      dialog.getByRole('group', { name: '입력 방식', exact: true })
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: '단원할인 1매 더하기' })
    ).toBeVisible();
    await dialog.getByRole('textbox', { name: /^이름/ }).fill(name);
    await dialog.getByRole('button', { name: '일반 1매 더하기' }).click();
    await dialog.getByRole('button', { name: '일반 1매 더하기' }).click();
    const created = page.waitForResponse(
      (r) =>
        r.request().method() === 'POST' &&
        new URL(r.url()).pathname.endsWith('/admin/reservations')
    );
    await dialog.getByRole('button', { name: '등록' }).click();
    expect((await created).status()).toBe(201);
    await expect(dialog).toBeHidden();
    const row = rowOf(page, name);
    await expect(row).toContainText('2/2');
    await expect(row).toContainText('관리자 등록');
    expect(await itemOf(fx.showA, name)).toMatchObject({
      status: 'CONFIRMED',
      admittedCount: 2,
      amount: 40000,
      source: 'ADMIN',
    });
  });

  test('현장 등록 직접 입력 0원은 확정 + 입장 인원으로 등록된다', async ({
    page,
  }) => {
    const name = `${P}무료`;
    await openAdmission(page, fx.showA);
    await page
      .getByRole('button', { name: '현장 예매 등록' })
      .filter({ visible: true })
      .first()
      .click();
    const dialog = page.getByRole('dialog', { name: '예매 등록' });
    await dialog.getByRole('textbox', { name: /^이름/ }).fill(name);
    await dialog
      .getByRole('group', { name: '입력 방식', exact: true })
      .getByRole('button', { name: '직접 입력' })
      .click();
    await dialog.getByRole('textbox', { name: /^매수/ }).fill('2');
    await dialog.getByRole('textbox', { name: /^금액/ }).fill('0');
    await dialog.getByRole('textbox', { name: /^입장 인원/ }).fill('1');
    const created = page.waitForResponse(
      (r) =>
        r.request().method() === 'POST' &&
        new URL(r.url()).pathname.endsWith('/admin/reservations')
    );
    await dialog.getByRole('button', { name: '등록' }).click();
    const response = await created;
    expect(response.status(), await response.text()).toBe(201);
    await expect(dialog).toBeHidden();
    await expect(rowOf(page, name)).toContainText('1/2');
    expect(await itemOf(fx.showA, name)).toMatchObject({
      status: 'CONFIRMED',
      admittedCount: 1,
      amount: 0,
    });
  });

  test('다른 곳의 입장 변경이 10초 자동 갱신으로 보인다', async ({ page }) => {
    await openAdmission(page, fx.showA);
    const dasom = rowOf(page, DASOM);
    await expect(dasom).toContainText('0/3');
    const item = await itemOf(fx.showA, DASOM);
    await adminApi('POST', `/admin/reservations/${item.id}/admission`, {
      delta: 1,
    });
    await expect(dasom).toContainText('1/3', { timeout: 15_000 });
  });

  test('동시성(API) — 4매 예매에 +1 을 6번 동시에 보내면 200 4건·409 RSV_010 2건, 입장 4', async () => {
    const created = await manualReservation({
      showId: fx.showA,
      bookerName: `${P}마루`,
      items: [{ tierId: fx.general, quantity: 4 }],
      status: 'CONFIRMED',
    });
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        rawAdmin(`/admin/reservations/${created.id}/admission`, { delta: 1 })
      )
    );
    expect(results.filter((r) => r.status === 200)).toHaveLength(4);
    expect(
      results.filter((r) => r.status === 409 && r.code === 'RSV_010')
    ).toHaveLength(2);
    expect((await itemOf(fx.showA, `${P}마루`)).admittedCount).toBe(4);
  });

  test('동시성(API) — 같은 version 으로 confirm-and-admit 2번이면 1건만, 다른 쪽 409 RSV_007', async () => {
    const pending = await publicReservation(`${P}바람`, [
      { tierId: fx.general, quantity: 2 },
    ]);
    const results = await Promise.all(
      Array.from({ length: 2 }, () =>
        rawAdmin(`/admin/reservations/${pending.id}/confirm-and-admit`, {
          version: pending.version,
          admit: 2,
        })
      )
    );
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(results.find((r) => r.status === 409)?.code).toBe('RSV_007');
    expect(await itemOf(fx.showA, `${P}바람`)).toMatchObject({
      status: 'CONFIRMED',
      admittedCount: 2,
    });
  });

  test('동시성(화면) — 두 기기가 마지막 1명을 동시에 입장시키면 한쪽은 RSV_010 스낵바 후 새 명단', async ({
    page,
    browser,
  }) => {
    const name = `${P}바다`;
    await manualReservation({
      showId: fx.showA,
      bookerName: name,
      items: [{ tierId: fx.general, quantity: 2 }],
      status: 'CONFIRMED',
      admitNow: 1,
    });
    await openAdmission(page, fx.showA);
    const { context, other } = await secondPage(browser, page);
    await openAdmission(other, fx.showA);
    await expect(rowOf(page, name)).toContainText('1/2');
    await expect(rowOf(other, name)).toContainText('1/2');

    const plusName = { name: `${name} 1명 입장`, exact: true };
    const [first, second] = await Promise.all([
      admissionPost(page),
      admissionPost(other),
      page.getByRole('button', plusName).click(),
      other.getByRole('button', plusName).click(),
    ]);
    const statuses = [first.status(), second.status()].sort();
    expect(statuses).toEqual([200, 409]);
    const loser = first.status() === 409 ? page : other;
    const loserResponse = first.status() === 409 ? first : second;
    expect(((await loserResponse.json()) as { code: string }).code).toBe(
      'RSV_010'
    );
    await expect(loser.getByText(CONFLICT)).toBeVisible();
    for (const view of [page, other]) {
      await expect(rowOf(view, name)).toContainText('2/2');
      await expect(rowOf(view, name)).toContainText('입장 완료');
    }
    expect((await itemOf(fx.showA, name)).admittedCount).toBe(2);
    await context.close();
  });

  test('동시성(화면) — 두 기기가 같은 입금 대기 예매를 동시에 입금 확인 + 입장하면 한쪽은 RSV_007 스낵바 후 재조회', async ({
    page,
    browser,
  }) => {
    const name = `${P}사랑`;
    await publicReservation(name, [{ tierId: fx.general, quantity: 1 }]);
    await openAdmission(page, fx.showA);
    const { context, other } = await secondPage(browser, page);
    await openAdmission(other, fx.showA);

    const sheets = [];
    for (const view of [page, other]) {
      await rowOf(view, name)
        .getByRole('button', { name: '입금 확인 + 입장' })
        .click();
      const sheet = view.getByRole('dialog', {
        name: '20,000원 입금을 확인했나요?',
      });
      await expect(sheet).toBeVisible();
      sheets.push(sheet);
    }
    const [first, second] = await Promise.all([
      admissionPost(page),
      admissionPost(other),
      sheets[0].getByRole('button', { name: '입금 확인 + 입장' }).click(),
      sheets[1].getByRole('button', { name: '입금 확인 + 입장' }).click(),
    ]);
    expect([first.status(), second.status()].sort()).toEqual([200, 409]);
    const loser = first.status() === 409 ? page : other;
    const loserResponse = first.status() === 409 ? first : second;
    expect(((await loserResponse.json()) as { code: string }).code).toBe(
      'RSV_007'
    );
    await expect(loser.getByText(CONFLICT)).toBeVisible();
    for (const view of [page, other]) {
      await expect(rowOf(view, name)).toContainText('1/1');
      await expect(rowOf(view, name)).toContainText('입장 완료');
    }
    expect(await itemOf(fx.showA, name)).toMatchObject({
      status: 'CONFIRMED',
      admittedCount: 1,
    });
    await context.close();
  });
});
