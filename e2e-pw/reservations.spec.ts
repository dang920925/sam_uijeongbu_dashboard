// ----------------------------------------------------------------------
// SCR-D12 예매 관리(FN-33·34·35, develop §11.8 S14~S19 · §11.10 S48~S51 · design §6.1a exact-match).
// 공연 없음 · 목록·필터·검색 · 입금 확인 → 되돌리기 · 취소(사유)·되살리기 · RSV_007 충돌(정본 스낵바 + 재조회) ·
// 수동 등록(직접 입력 2매·0원·확정·연락처 없음 → 무료·관리자 등록) · 등급 수정 · 기한 지난 일괄 취소 ·
// 집계 등급별 · 초대 링크 발급·복사·재발급 · exact-match(URL·검색) · mobile 카드.
// desktop 은 lg 표, mobile(Pixel 7)은 카드 — 보이는 요소만 골라 같은 흐름으로 돈다. 픽스처 접두사 fixture-r1-w2-.
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const PREFIX = 'fixture-r1-w2-';
const API = '/api/backend/v1';
const DAY_MS = 24 * 60 * 60 * 1000;

interface Created {
  id: string;
}

interface Fixture {
  performanceId: string;
  showId: string;
  generalTierId: string;
  staffTierId: string;
  /** code → 예매 */
  reservations: Record<string, { id: string; version: number }>;
}

/** 가짜 값만(실제 계좌·운영 값 금지) */
const POLICY = {
  depositBank: `${PREFIX}은행`,
  depositAccountNumber: '0000-00-0000000',
  depositAccountHolder: `${PREFIX}극단`,
  maxTicketsPerBooking: 4,
  depositDeadlineHours: 24,
  refundPolicyText: `${PREFIX}환불 규정`,
};

async function seedReservation(
  request: APIRequestContext,
  body: Record<string, unknown>
): Promise<{ id: string; version: number; code: string }> {
  const response = await request.post(`${API}/__mock/booking/reservation`, {
    data: body,
  });
  expect(response.status()).toBe(201);
  return response.json();
}

/** 공연 1 · 회차 1(좌석 20) · 등급 2(일반 PUBLIC 10,000 · 스태프 LINK_ONLY 5,000) · 예매 3건 */
async function setup(request: APIRequestContext): Promise<Fixture> {
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
  const policy = await request.fetch(
    `${API}/admin/performances/${perf.id}/booking-policy`,
    { method: 'PUT', data: POLICY }
  );
  expect(policy.ok()).toBe(true);
  const tier = (name: string, price: number, visibility: string) =>
    adminApi<Created>(
      request,
      'POST',
      `/admin/performances/${perf.id}/price-tiers`,
      { name: `${PREFIX}${name}`, price, visibility }
    );
  const general = await tier('일반', 10000, 'PUBLIC');
  const staff = await tier('스태프', 5000, 'LINK_ONLY');
  const base = { showId: show.id };
  const pending = await seedReservation(request, {
    ...base,
    code: '1111',
    bookerName: `${PREFIX}대기`,
    bookerPhone: '010-1111-0001',
    items: [{ tierId: general.id, quantity: 2 }],
  });
  const overdue = await seedReservation(request, {
    ...base,
    code: '2222',
    bookerName: `${PREFIX}기한`,
    bookerPhone: '010-2222-0002',
    items: [{ tierId: staff.id, quantity: 1 }],
    depositDueAt: new Date(Date.now() - DAY_MS).toISOString(),
  });
  const confirmed = await seedReservation(request, {
    ...base,
    code: '3333',
    bookerName: `${PREFIX}확정`,
    bookerPhone: '010-3333-0003',
    items: [
      { tierId: general.id, quantity: 1 },
      { tierId: staff.id, quantity: 1 },
    ],
    status: 'CONFIRMED',
    admittedCount: 1,
  });
  return {
    performanceId: perf.id,
    showId: show.id,
    generalTierId: general.id,
    staffTierId: staff.id,
    reservations: { '1111': pending, '2222': overdue, '3333': confirmed },
  };
}

/** 보이는 쪽(lg 표 행 / 카드) */
function row(page: Page, code: string) {
  return page
    .locator(`[data-reservation-code="${code}"]`)
    .filter({ visible: true });
}

function visibleRows(page: Page) {
  return page.locator('[data-reservation-code]').filter({ visible: true });
}

async function openPage(page: Page) {
  await page.goto('/reservations');
  await expect(
    page.getByRole('heading', { level: 1, name: '예매 관리' })
  ).toBeVisible();
  await expect(row(page, '1111')).toBeVisible();
}

test.describe('SCR-D12 예매 관리', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('공연이 없으면 안내와 공연 관리 이동을 보인다', async ({ page }) => {
    await page.goto('/reservations');
    await expect(
      page.getByText(
        '예매 설정이 된 공연이 없습니다. 공연 상세의 회차·예매 탭에서 설정해주세요.'
      )
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: '공연 관리로 이동' })
    ).toBeVisible();
  });

  test('목록 · KPI · 상태/기한 지남 필터 · 검색 · 결과 0', async ({
    page,
    request,
  }) => {
    await setup(request);
    await openPage(page);
    // KPI — 입금 대기 2건(3매 · 기한 지남 1건)
    await expect(page.getByText('3매 · 기한 지남 1건')).toBeVisible();
    await expect(visibleRows(page)).toHaveCount(3);
    // 등급별 매수 · 입장 a/q · 잠금 이유(입장한 확정 건)
    await expect(row(page, '3333')).toContainText(
      `${PREFIX}일반 1 · ${PREFIX}스태프 1`
    );
    await expect(row(page, '3333')).toContainText('1/2');
    await expect(
      row(page, '3333').getByRole('button', { name: '확인 취소' })
    ).toBeDisabled();

    await page
      .getByRole('group', { name: '상태' })
      .getByRole('button', { name: '입금 대기' })
      .click();
    await expect(visibleRows(page)).toHaveCount(2);
    await page.getByRole('button', { name: '기한 지남만' }).click();
    await expect(visibleRows(page)).toHaveCount(1);
    await expect(row(page, '2222')).toContainText('기한 지남');

    await page.getByRole('button', { name: '기한 지남만' }).click();
    await page
      .getByRole('group', { name: '상태' })
      .getByRole('button', { name: '전체' })
      .click();
    await page.getByRole('searchbox', { name: '예매 검색' }).fill('확정');
    await expect(visibleRows(page)).toHaveCount(1);
    await expect(row(page, '3333')).toBeVisible();

    await page
      .getByRole('searchbox', { name: '예매 검색' })
      .fill(`${PREFIX}없는이름`);
    await expect(page.getByText('조건에 맞는 예매가 없습니다')).toBeVisible();
    await page.getByRole('button', { name: '필터 초기화' }).click();
    await expect(visibleRows(page)).toHaveCount(3);
  });

  test('입금 확인은 바로 확정되고 되돌리기로 입금 대기로 돌아간다', async ({
    page,
    request,
  }) => {
    await setup(request);
    await openPage(page);
    await row(page, '1111').getByRole('button', { name: '입금 확인' }).click();
    await expect(page.getByText('1111 입금을 확인했습니다.')).toBeVisible();
    await expect(
      row(page, '1111').getByRole('button', { name: '확인 취소' })
    ).toBeVisible();
    await page.getByRole('button', { name: '되돌리기' }).click();
    await expect(
      page.getByText('1111 입금 확인을 되돌렸습니다.')
    ).toBeVisible();
    await expect(
      row(page, '1111').getByRole('button', { name: '입금 확인' })
    ).toBeVisible();
  });

  test('취소는 사유를 골라 처리하고 되살리기로 입금 대기가 된다', async ({
    page,
    request,
  }) => {
    await setup(request);
    await openPage(page);
    await row(page, '1111').getByRole('button', { name: '취소' }).click();
    const dialog = page.getByRole('dialog', {
      name: '예매를 취소하시겠습니까?',
    });
    await expect(
      dialog.getByRole('radio', { name: '예매자 요청' })
    ).toBeChecked();
    await dialog.getByRole('radio', { name: '관리자' }).check();
    await dialog.getByRole('button', { name: '예매 취소' }).click();
    await expect(page.getByText('1111 예매를 취소했습니다.')).toBeVisible();
    await expect(row(page, '1111')).toContainText('관리자');
    await row(page, '1111').getByRole('button', { name: '되살리기' }).click();
    await expect(page.getByText('1111 예매를 되살렸습니다.')).toBeVisible();
    await expect(
      row(page, '1111').getByRole('button', { name: '입금 확인' })
    ).toBeVisible();
  });

  test('다른 곳에서 먼저 바뀐 예매(RSV_007)는 정본 스낵바와 함께 목록을 새로 불러온다', async ({
    page,
    request,
  }) => {
    const fixture = await setup(request);
    await openPage(page);
    // 다른 스태프가 먼저 입금 확인(version 1 → 2)
    await adminApi(
      request,
      'POST',
      `/admin/reservations/${fixture.reservations['1111'].id}/confirm`,
      { version: 1 }
    );
    await row(page, '1111').getByRole('button', { name: '입금 확인' }).click();
    await expect(
      page.getByText(
        '다른 스태프가 먼저 처리했습니다. 목록을 새로 불러왔습니다.'
      )
    ).toBeVisible();
    await expect(
      row(page, '1111').getByRole('button', { name: '확인 취소' })
    ).toBeVisible();
  });

  test('수동 등록 — 직접 입력 2매 · 0원 · 확정 · 연락처 없음은 무료·관리자 등록으로 보인다(S48 ①)', async ({
    page,
    request,
  }) => {
    await setup(request);
    await openPage(page);
    await page.getByRole('button', { name: '예매 등록' }).click();
    const dialog = page.getByRole('dialog', { name: '예매 등록' });
    await dialog
      .getByRole('textbox', { name: /^이름/ })
      .fill(`${PREFIX}초대손님`);
    await dialog.getByRole('button', { name: '직접 입력' }).click();
    await dialog.getByLabel('표시 이름').fill('초대');
    await dialog.getByRole('textbox', { name: /^매수/ }).fill('2');
    await dialog.getByRole('textbox', { name: /^금액/ }).fill('0');
    await expect(dialog.getByText('2매 · 0원')).toBeVisible();
    await dialog.getByRole('button', { name: '확정' }).click();
    await expect(
      dialog.getByRole('textbox', { name: /^입장 인원/ })
    ).toHaveValue('2');
    await dialog.getByRole('textbox', { name: /^입장 인원/ }).fill('0');
    await dialog.getByLabel('메모').fill('초대 — 연출 지인');
    await dialog.getByRole('button', { name: '등록', exact: true }).click();
    await expect(page.getByText(/예매를 등록했습니다\./)).toBeVisible();

    const created = visibleRows(page).filter({
      hasText: `${PREFIX}초대손님`,
    });
    await expect(created).toContainText('무료');
    await expect(created).toContainText('관리자 등록');
    await expect(created).toContainText('연락처 없음');
    await expect(created).toContainText('초대 2');
    await expect(created).toContainText('0원');
  });

  test('수동 등록은 남은 좌석보다 많으면 저장할 수 없다', async ({
    page,
    request,
  }) => {
    await setup(request);
    await openPage(page);
    await page.getByRole('button', { name: '예매 등록' }).click();
    const dialog = page.getByRole('dialog', { name: '예매 등록' });
    await dialog.getByRole('button', { name: '직접 입력' }).click();
    // 남은 좌석 20 − (2 + 1 + 2) = 15
    await dialog.getByRole('textbox', { name: /^매수/ }).fill('16');
    await expect(
      dialog.getByText('남은 좌석(15석)보다 많이 등록할 수 없습니다.')
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: '등록', exact: true })
    ).toBeDisabled();
  });

  test('등급 수정 — 같은 등급은 예매 당시 가격, 총액을 미리 보이고 저장한다(S49)', async ({
    page,
    request,
  }) => {
    await setup(request);
    await openPage(page);
    await row(page, '1111')
      .getByRole('button', { name: '1111 등급 수정' })
      .click();
    const dialog = page.getByRole('dialog', { name: /등급 수정/ });
    await expect(
      dialog.getByText('같은 등급은 예매 당시 가격을 유지합니다.')
    ).toBeVisible();
    await expect(dialog.getByText('예매 당시 10,000원')).toBeVisible();
    await expect(dialog.getByText('지금 가격 5,000원')).toBeVisible();
    await dialog
      .getByRole('button', { name: `${PREFIX}스태프 1매 더하기` })
      .click();
    await expect(dialog.getByText('3매 · 25,000원')).toBeVisible();
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('1111 등급을 수정했습니다.')).toBeVisible();
    await expect(row(page, '1111')).toContainText(
      `${PREFIX}일반 2 · ${PREFIX}스태프 1`
    );
    await expect(row(page, '1111')).toContainText('25,000원');
  });

  test('기한 지난 예매 취소는 확인창 뒤 기한 지난 입금 대기만 취소한다(S18)', async ({
    page,
    request,
  }) => {
    await setup(request);
    await openPage(page);
    await page.getByRole('button', { name: '기한 지난 예매 취소' }).click();
    const confirm = page.getByRole('alertdialog', {
      name: '입금 기한이 지난 입금 대기 예매 1건을 취소하시겠습니까?',
    });
    await confirm.getByRole('button', { name: '1건 취소' }).click();
    await expect(
      page.getByText('기한 지난 예매 1건을 취소했습니다.')
    ).toBeVisible();
    await expect(
      row(page, '2222').getByRole('button', { name: '되살리기' })
    ).toBeVisible();
    await expect(
      row(page, '1111').getByRole('button', { name: '입금 확인' })
    ).toBeVisible();
  });

  test('집계 탭 — 회차별 · 등급별(회차 × 등급) · 단원별 초대(S17·S51)', async ({
    page,
    request,
  }) => {
    await setup(request);
    await openPage(page);
    await page.getByRole('tab', { name: '집계' }).click();
    const byShow = page.getByRole('region', { name: '회차별 집계' });
    await expect(byShow.getByRole('row', { name: /합계/ })).toContainText(
      '3매'
    );
    const byTier = page.getByRole('region', { name: '등급별 집계' });
    await expect(
      byTier.getByRole('columnheader', { name: `${PREFIX}스태프` })
    ).toBeVisible();
    const total = byTier.getByRole('row', { name: /공연 합계/ });
    await expect(total).toContainText('확정 1 · 대기 2');
    await expect(total).toContainText('확정 1 · 대기 1');
    await expect(
      page.getByRole('region', { name: '단원별 초대' })
    ).toContainText('초대 없음');
  });

  test('초대 링크 — 발급 · 링크 복사 · 재발급(이전 링크 무효 확인창)', async ({
    page,
    request,
  }) => {
    const fixture = await setup(request);
    const member = `${PREFIX}단원`;
    await adminApi(request, 'POST', '/admin/members', {
      name: member,
      type: 'ACTOR',
      phone: null,
    });
    await openPage(page);
    await page.getByRole('tab', { name: '초대 링크' }).click();
    const region = page.getByRole('region', { name: '초대 링크' });
    await region
      .getByRole('button', { name: `${member} 발급` })
      .filter({ visible: true })
      .click();
    await expect(page.getByText('초대 링크를 발급했습니다')).toBeVisible();
    // mobile 은 스낵바가 카드 버튼을 덮고, 포인터가 올라가면 notistack 이 닫힘 타이머를 멈춘다 → 닫힌 뒤 누른다
    await page.mouse.move(0, 0);
    await expect(page.getByText('초대 링크를 발급했습니다')).toBeHidden({
      timeout: 8000,
    });
    const link = region
      .getByText(`/works/${fixture.performanceId}/book?ref=`)
      .filter({ visible: true });
    await expect(link).toBeVisible();
    const before = await link.textContent();

    await region
      .getByRole('button', { name: `${member} 링크 복사` })
      .filter({ visible: true })
      .click();
    await expect(page.getByText('링크를 복사했습니다')).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page.getByText('링크를 복사했습니다')).toBeHidden({
      timeout: 8000,
    });

    await region
      .getByRole('button', { name: `${member} 재발급` })
      .filter({ visible: true })
      .click();
    const confirm = page.getByRole('alertdialog', {
      name: '이전 링크는 더 이상 쓸 수 없습니다. 재발급하시겠습니까?',
    });
    await confirm.getByRole('button', { name: '재발급' }).click();
    await expect(page.getByText('초대 링크를 발급했습니다')).toBeVisible();
    await expect(link).not.toHaveText(before ?? '');
  });

  test('exact-match — URL ?performanceId=&q= 로 들어오면 그 행을 강조하고 상세를 연다(§6.1a)', async ({
    page,
    request,
  }) => {
    const fixture = await setup(request);
    await page.goto(
      `/reservations?performanceId=${fixture.performanceId}&q=2222`
    );
    const drawer = page.getByRole('dialog', { name: '예매 2222' });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText(`${PREFIX}기한`);
    // 할인(링크 전용) 등급은 "(링크 전용(할인))" 글자를 붙인다(지휘자 표시 표 2026-11-20)
    await expect(drawer).toContainText(`${PREFIX}스태프(링크 전용(할인)) 1`);
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(row(page, '2222')).toHaveAttribute('aria-current', 'true');
    await expect(
      page.getByText('예매번호 2222 와 같은 예매를 맨 위에 강조했습니다', {
        exact: false,
      })
    ).toBeVisible();
  });

  test('exact-match — 검색어가 예매번호와 같으면 맨 위 강조 + 상세 드로어', async ({
    page,
    request,
  }) => {
    await setup(request);
    await openPage(page);
    await page.getByRole('searchbox', { name: '예매 검색' }).fill('3333');
    const drawer = page.getByRole('dialog', { name: '예매 3333' });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('1/2');
    await drawer.getByRole('button', { name: '닫기' }).click();
    await expect(visibleRows(page).first()).toHaveAttribute(
      'data-reservation-code',
      '3333'
    );
    await expect(visibleRows(page).first()).toHaveAttribute(
      'aria-current',
      'true'
    );
    // 행을 눌러도 상세가 열린다
    await row(page, '3333').click();
    await expect(drawer).toBeVisible();
  });

  test('화면 폭에 맞춰 lg 는 표, 그 아래는 카드로 보인다', async ({
    page,
    request,
    isMobile,
  }) => {
    await setup(request);
    await openPage(page);
    const table = page.getByRole('table', { name: '예매' });
    if (isMobile) {
      await expect(table).toBeHidden();
      await expect(
        page.locator('li[data-reservation-code="1111"]')
      ).toBeVisible();
      const box = await row(page, '1111')
        .getByRole('button', { name: '입금 확인' })
        .boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      const scroll = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      expect(scroll).toBeLessThanOrEqual(0);
    } else {
      await expect(table).toBeVisible();
      await expect(
        page.locator('li[data-reservation-code="1111"]')
      ).toBeHidden();
    }
  });
});
