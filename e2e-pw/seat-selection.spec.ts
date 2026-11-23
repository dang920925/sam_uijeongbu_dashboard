// ----------------------------------------------------------------------
// U35 좌석 지정 · U36 초대자(develop §19 SE-1·SE-5·SE-7 · §20 IV-2·IV-5 · design §14·§15) — 목 백엔드.
// D11 스위치·배치 편집기·복사 · D12 좌석 열·좌석 변경·현황 지도·수동 등록(좌석·연출/스태프 관계자)·집계 묶음 ·
// D13 입장 체크·인쇄 명단 좌석 · D05 초대자 목록 스위치. 픽스처 접두사 fixture-seat-.
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-seat-';
const API = '/api/backend/v1';
const DAY_MS = 24 * 60 * 60 * 1000;

interface Created {
  id: string;
}
interface SeatMapRes {
  rows: { label: string | null; cells: { seatId: string | null }[] }[];
}

/** 2열 × 5칸(가운데 통로) = 8석 */
const LAYOUT = {
  rowCount: 2,
  colCount: 5,
  cells: [0, 1].flatMap((r) =>
    [0, 1, 2, 3, 4].map((c) =>
      c === 2
        ? { rowIndex: r, colIndex: c, kind: 'AISLE' }
        : {
            rowIndex: r,
            colIndex: c,
            kind: 'SEAT',
            rowLabel: r === 0 ? 'A' : 'B',
            seatNumber: c < 2 ? c + 1 : c,
          }
    )
  ),
};

interface Fixture {
  performanceId: string;
  showA: string;
  showB: string;
  tierId: string;
  seatOf: (label: string) => string;
}

async function setup(
  request: APIRequestContext,
  seatOn = true
): Promise<Fixture> {
  const perf = await adminApi<Created>(request, 'POST', '/admin/performances', {
    title: `${PREFIX}공연`,
    type: 'PLAY',
    status: 'UPCOMING',
    isVisible: false,
  });
  const show = (startTime: string) =>
    adminApi<Created>(request, 'POST', `/admin/performances/${perf.id}/shows`, {
      showDate: '2099-12-12',
      startTime,
      venue: `${PREFIX}소극장`,
      totalSeats: 20,
      bookingOpenAt: new Date(Date.now() - DAY_MS).toISOString(),
    });
  const showA = await show('14:00');
  const showB = await show('18:00');
  await adminApi(
    request,
    'PUT',
    `/admin/performances/${perf.id}/booking-policy`,
    {
      depositBank: `${PREFIX}은행`,
      depositAccountNumber: '0000-00-0000000',
      depositAccountHolder: `${PREFIX}극단`,
      maxTicketsPerBooking: 4,
      depositDeadlineHours: 24,
      refundPolicyText: `${PREFIX}환불 규정`,
      inquiryContact: null,
    }
  );
  const tier = await adminApi<Created>(
    request,
    'POST',
    `/admin/performances/${perf.id}/price-tiers`,
    { name: `${PREFIX}일반`, price: 10000, visibility: 'PUBLIC' }
  );
  if (seatOn)
    await adminApi(request, 'PATCH', `/admin/performances/${perf.id}`, {
      seatSelectionEnabled: true,
    });
  const map = await adminApi<SeatMapRes>(
    request,
    'PUT',
    `/admin/shows/${showA.id}/seat-map`,
    LAYOUT
  );
  const ids = new Map<string, string>();
  for (const row of map.rows) {
    let n = 0;
    for (const cell of row.cells)
      if (cell.seatId) ids.set(`${row.label}${(n += 1)}`, cell.seatId);
  }
  return {
    performanceId: perf.id,
    showA: showA.id,
    showB: showB.id,
    tierId: tier.id,
    seatOf: (label) => ids.get(label) ?? '',
  };
}

async function seed(
  request: APIRequestContext,
  f: Fixture,
  body: Record<string, unknown>
) {
  const res = await request.post(`${API}/__mock/booking/reservation`, {
    data: {
      showId: f.showA,
      bookerPhone: '010-0000-0001',
      items: [{ tierId: f.tierId, quantity: 1 }],
      ...body,
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()) as { id: string; code: string };
}

function row(page: Page, code: string) {
  return page
    .locator(`[data-reservation-code="${code}"]`)
    .filter({ visible: true });
}

test.describe('U35·U36 좌석 지정 — 대시보드', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('D11 스위치를 켜면 회차에 "좌석 배치"가 생기고, 편집기에서 칸을 바꿔 저장·다른 회차로 복사한다', async ({
    page,
    request,
  }) => {
    // Arrange
    const f = await setup(request, false);
    await page.goto(`/performances/${f.performanceId}/shows`);
    await expect(
      page.getByRole('button', { name: /좌석 배치/ }).first()
    ).toBeHidden();
    // Act — 스위치
    await page.getByLabel('좌석 지정 예매 사용').check();
    await expect(page.getByText('좌석 지정 예매를 켰습니다.')).toBeVisible();
    const perf = await adminApi<{ seatSelectionEnabled: boolean }>(
      request,
      'GET',
      `/admin/performances/${f.performanceId}`
    );
    expect(perf.seatSelectionEnabled).toBe(true);
    // Act — 회차 A 배치 편집(저장된 8석)
    await page
      .getByRole('button', { name: /14:00.* 좌석 배치/ })
      .filter({ visible: true })
      .click();
    const dialog = page.getByRole('dialog', { name: /좌석 배치/ });
    await expect(dialog.getByTestId('seat-layout-summary')).toHaveText(
      '좌석 8석'
    );
    await dialog.getByRole('button', { name: '1행 1칸, 좌석 A1' }).click();
    await expect(dialog.getByTestId('seat-layout-summary')).toHaveText(
      '좌석 7석'
    );
    await expect(
      dialog.getByRole('button', { name: '1행 1칸, 통로' })
    ).toBeVisible();
    // 번호는 통로를 건너 다시 매긴다(미리보기 첫 행 A1~A3)
    await dialog.getByTestId('seat-rows').fill('3');
    await expect(dialog.getByTestId('seat-layout-summary')).toHaveText(
      '좌석 12석'
    );
    await dialog.getByRole('button', { name: '배치 저장' }).click();
    await expect(page.getByText('좌석 배치를 저장했습니다.')).toBeVisible();
    const saved = await adminApi<{ rowCount: number; total: number }>(
      request,
      'GET',
      `/admin/shows/${f.showA}/seat-map`
    );
    expect(saved).toMatchObject({ rowCount: 3, total: 12 });
    // Act — 회차 B 는 배치가 없어 새로 시작 → A 에서 복사
    await page
      .getByRole('button', { name: /18:00.* 좌석 배치/ })
      .filter({ visible: true })
      .click();
    await expect(dialog.getByText(/아직 배치가 없습니다/)).toBeVisible();
    await dialog.getByRole('combobox', { name: '다른 회차 배치 복사' }).click();
    await page.getByRole('option', { name: /14:00/ }).click();
    await dialog.getByRole('button', { name: '복사', exact: true }).click();
    await expect(
      page.getByText('다른 회차의 배치를 복사했습니다.')
    ).toBeVisible();
    await expect(dialog.getByTestId('seat-layout-summary')).toHaveText(
      '좌석 12석'
    );
  });

  test('SE-5 예매된 좌석이 있는 행을 지우는 배치 저장은 409 SEAT_004 문구를 보인다', async ({
    page,
    request,
  }) => {
    // Arrange — B1 이 팔린 상태
    const f = await setup(request);
    await seed(request, f, {
      bookerName: `${PREFIX}B1`,
      seatIds: [f.seatOf('B1')],
    });
    await page.goto(`/performances/${f.performanceId}/shows`);
    await page
      .getByRole('button', { name: /14:00.* 좌석 배치/ })
      .filter({ visible: true })
      .click();
    const dialog = page.getByRole('dialog', { name: /좌석 배치/ });
    // 팔린 칸은 잠겨 있다
    await expect(
      dialog.getByRole('button', { name: /B1, 예매된 좌석/ })
    ).toHaveAttribute('aria-disabled', 'true');
    // Act — 1행으로 줄여 B 행을 지운다
    await dialog.getByTestId('seat-rows').fill('1');
    await dialog.getByRole('button', { name: '배치 저장' }).click();
    // Assert
    await expect(
      dialog.getByText(
        '예매된 좌석이 있는 배치는 그 좌석을 지우거나 바꿀 수 없습니다.'
      )
    ).toBeVisible();
  });

  test('SE-7 D12 좌석 열("A1"·"좌석 미정") · 좌석 변경 · 현황 지도에서 예매 찾기', async ({
    page,
    request,
  }) => {
    // Arrange
    const f = await setup(request);
    const seated = await seed(request, f, {
      bookerName: `${PREFIX}지정`,
      seatIds: [f.seatOf('A1')],
    });
    const unseated = await seed(request, f, {
      bookerName: `${PREFIX}미정`,
      bookerPhone: '010-0000-0002',
    });
    await page.goto(`/reservations?performanceId=${f.performanceId}`);
    // Assert — 좌석 열
    await expect(row(page, seated.code)).toContainText('A1');
    await expect(row(page, unseated.code)).toContainText('좌석 미정');
    // Act — 좌석 변경 A1 → B4
    await row(page, seated.code)
      .getByRole('button', { name: `${seated.code} 좌석 변경` })
      .click();
    const dialog = page.getByRole('dialog', { name: /좌석 변경/ });
    await expect(dialog.getByTestId('reservation-seat-picked')).toContainText(
      'A1 (1/1석)'
    );
    await dialog.getByRole('button', { name: 'A열 1번' }).click();
    await dialog.getByRole('button', { name: 'B열 4번' }).click();
    await dialog.getByRole('button', { name: '좌석 저장' }).click();
    await expect(page.getByText('좌석을 바꿨습니다.')).toBeVisible();
    await expect(row(page, seated.code)).toContainText('B4');
    // Act — 현황 지도(회차 pill 을 고른 뒤)
    await page
      .getByRole('button', { name: /12\.12 14:00/ })
      .filter({ visible: true })
      .first()
      .click();
    await page.getByRole('button', { name: '좌석 현황' }).click();
    const status = page.getByRole('dialog', { name: /좌석 현황/ });
    await expect(status.getByTestId('seat-status-remaining')).toHaveText(
      '잔여 6/8석'
    );
    await status
      .getByRole('button', { name: `B열 4번, 예매 완료 — ${PREFIX}지정` })
      .click();
    await expect(status.getByText(`B4 — ${PREFIX}지정`)).toBeVisible();
    await status.getByRole('button', { name: '이 예매 찾기' }).click();
    await expect(
      page.getByRole('searchbox', { name: '예매 검색' })
    ).toHaveValue(`${PREFIX}지정`);
  });

  test('D12 수동 등록 — 좌석을 고르고(선택) 연출·스태프 관계자로 등록하면 좌석·초대가 보이고 집계에 묶인다(IV-2)', async ({
    page,
    request,
  }) => {
    // Arrange
    const f = await setup(request);
    await page.goto(`/reservations?performanceId=${f.performanceId}`);
    await page.getByRole('button', { name: '예매 등록' }).click();
    const dialog = page.getByRole('dialog', { name: '예매 등록' });
    await dialog.getByRole('textbox', { name: /^이름/ }).fill(`${PREFIX}현장`);
    await dialog
      .getByRole('button', { name: `${PREFIX}일반 1매 더하기` })
      .click();
    // Act — 좌석 고르기
    await dialog.getByRole('button', { name: '좌석 고르기' }).click();
    await dialog.getByRole('button', { name: 'A열 2번' }).click();
    await expect(dialog.getByTestId('manual-seat-picked')).toContainText(
      'A2 (1/1석)'
    );
    // 초대한 사람(U41) — 맨 위 SAM 관계자 · 연출·스태프 관계자 … 맨 아래 선택 안 함
    await dialog.getByRole('combobox', { name: '초대한 사람' }).click();
    const options = page.getByRole('option');
    await expect(options.first()).toHaveText('SAM 관계자');
    await expect(options.nth(1)).toHaveText('연출·스태프 관계자');
    await expect(options.last()).toHaveText('선택 안 함');
    await options.nth(1).click();
    await dialog.getByRole('button', { name: '등록', exact: true }).click();
    // Assert
    await expect(page.getByText(/예매를 등록했습니다\./)).toBeVisible();
    const created = page
      .locator('[data-reservation-code]')
      .filter({ visible: true })
      .filter({ hasText: `${PREFIX}현장` });
    await expect(created).toContainText('A2');
    await expect(created).toContainText('연출·스태프 관계자');
    await page.getByRole('tab', { name: '집계' }).click();
    await expect(
      page.getByRole('region', { name: '초대한 사람별' })
    ).toContainText('연출·스태프 관계자');
  });

  test('SE-7 D13 입장 체크·인쇄 명단에 좌석 번호, 좌석 없는 예매는 "좌석 미정"', async ({
    page,
    request,
  }) => {
    // Arrange
    const f = await setup(request);
    await seed(request, f, {
      bookerName: `${PREFIX}가`,
      seatIds: [f.seatOf('A3')],
      status: 'CONFIRMED',
    });
    await seed(request, f, {
      bookerName: `${PREFIX}나`,
      bookerPhone: '010-0000-0002',
      status: 'CONFIRMED',
    });
    // Act · Assert — 입장 체크
    await page.goto(`/admission?showId=${f.showA}`);
    const seats = page.getByTestId('admission-seat').filter({ visible: true });
    await expect(seats).toHaveText(['A3', '좌석 미정']);
    // 인쇄 명단
    await page.goto(`/admission/${f.showA}/print`);
    await expect(
      page.getByRole('columnheader', { name: '좌석' }).first()
    ).toBeVisible();
    await expect(page.locator('[data-print-seat]')).toHaveText([
      'A3',
      '좌석 미정',
    ]);
  });

  test('IV-5 D05 배우 패널의 "예매 초대자 목록에 표시"를 끄면 inviterListed false 로 저장된다', async ({
    page,
    request,
  }) => {
    // Arrange
    const name = `${PREFIX}배우`;
    const member = await adminApi<Created>(request, 'POST', '/admin/members', {
      name,
      type: 'ACTOR',
      phone: null,
    });
    await page.goto(`/members?member=${member.id}`);
    const toggle = page
      .getByLabel('예매 초대자 목록에 표시')
      .filter({ visible: true });
    await expect(toggle).toBeChecked();
    // Act
    await toggle.uncheck();
    // Assert
    await expect(toggle).not.toBeChecked();
    await expect
      .poll(async () => {
        const saved = await adminApi<{ inviterListed: boolean }>(
          request,
          'GET',
          `/admin/members/${member.id}`
        );
        return saved.inviterListed;
      })
      .toBe(false);
  });
});
