// ----------------------------------------------------------------------
// 연동 SCR-D12 예매 관리(FN-33·34·35 · develop §11.10) — 실서버 /admin/reservations(GET·POST·summary·cancel-overdue) ·
// /admin/reservations/{id}(PATCH · PUT items · confirm · unconfirm · cancel · restore).
// 픽스처: 공개 예매(relayPost '/reservations' — 등급 섞기 · 링크 전용 tierToken · 초대 ref · 직접 적은 초대 이름).
// - 목록(연락처 숫자만 저장 → 하이픈 표시 · 링크 전용 Label · 초대 표시)·집계(tiers · shows[].byTier · totals ·
//   inviters: 단원 / '직접 입력'(memberId null + name '직접 입력') / 초대 없음(name null) — back-end §14.4 #16).
// - 입금 확인 → 되돌리기 · 취소 → 되살리기 · 메모 PATCH(version + 1).
// - 등급 수정 PUT items(등급 추가 = 지금 가격, 같은 등급 = 예매 당시 가격 · 직접 입력 줄만 남기기 + 금액 조정 → "금액 조정").
// - 수동 등록(공용 Dialog): 직접 입력 0원 확정 · 연락처 없음 / 등급 + 연락처 숫자만 → 하이픈 표시, 매진 경합 RSV_003 문구.
// - 기한 지남 일괄 취소: 지난 회차의 수동 등록 입금 대기(입금 기한 = min(접수 + 시간, 회차 시작) → 이미 지남).
// - version 충돌: 두 브라우저 컨텍스트 — 한쪽 확정 뒤 다른 쪽 확정 → 409 RSV_007 정본 스낵바 + 재조회.
// - 없는 예매(RSV_013): 화면을 연 뒤 예매가 지워지면(정리 도우미 — 일일 파기와 같은 효과) 서버 문구 스낵바 + 목록에서 빠짐.
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

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

const PREFIX = fixturePrefix('rsv');
/** 등급 이름(≤30자)·은행·예금주는 접두사가 길어 짧은 표지만 — 픽스처 공연 아래라 공연 삭제로 함께 지워진다 */
const TP = 'W2';
const DAY_MS = 24 * 60 * 60 * 1000;

interface Created {
  id: string;
}

interface Tier extends Created {
  linkToken: string | null;
}

interface Rsv {
  id: string;
  code: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  version: number;
  memo: string | null;
  amount: number;
  amountOverridden: boolean;
  bookerPhone: string | null;
  source: 'ONLINE' | 'ADMIN';
  cancelReason: string | null;
  deadlinePassed: boolean;
  items: {
    tierId: string | null;
    tierName: string;
    unitPrice: number | null;
    quantity: number;
    lineAmount: number;
    isCustom: boolean;
    visibility: string | null;
  }[];
}

interface Fixture {
  performanceId: string;
  showId: string;
  general: Tier;
  discount: Tier;
  memberId: string;
  memberName: string;
  /** 일반 2(초대 없음) */
  plain: Rsv;
  /** 일반 1 + 할인 1(링크 토큰 · 단원 초대 ref) */
  invited: Rsv;
  /** 일반 1(직접 적은 초대 이름) */
  noted: Rsv;
}

function kstDate(offsetDays: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(Date.now() + offsetDays * DAY_MS)
  );
}

/** 공개 예매 연락처 — 같은 연락처 입금 대기 중복(RSV_004)을 피하려 예매마다 다르게 */
let phoneSeq = 1000;
function nextPhoneTail(): string {
  phoneSeq += 1;
  return String(phoneSeq);
}

async function putPolicy(performanceId: string) {
  const response = await fetch(
    `${INT_API_BASE_URL}/api/v1/admin/performances/${performanceId}/booking-policy`,
    {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${await adminToken()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        depositBank: `${TP}은행`,
        depositAccountNumber: '0000-00-0000000',
        depositAccountHolder: `${TP}극단`,
        maxTicketsPerBooking: 4,
        depositDeadlineHours: 24,
        refundPolicyText: `${PREFIX}환불 규정`,
      }),
    }
  );
  expect(response.status).toBe(200);
}

async function publicReserve(body: Record<string, unknown>): Promise<string> {
  const res = await relayPost('/reservations', {
    bookerPhone: `010-2000-${nextPhoneTail()}`,
    agreedToPrivacy: true,
    agreedToRefundPolicy: true,
    ...body,
  });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return (res.body as { code: string }).code;
}

async function findByCode(performanceId: string, code: string): Promise<Rsv> {
  const res = await adminApi<{ items: Rsv[] }>(
    'GET',
    `/admin/reservations?performanceId=${performanceId}&q=${code}`
  );
  const hit = res.items.find((item) => item.code === code);
  if (!hit) throw new Error(`예매 ${code} 없음`);
  return hit;
}

/** 공연 · 회차(좌석 20, 오픈 어제) · 설정 · 등급(일반 PUBLIC 10,000 · 할인 LINK_ONLY 5,000) · 단원(초대 코드) · 공개 예매 3건 */
async function setup(tag: string, seats = 20): Promise<Fixture> {
  const perf = await adminApi<Created>('POST', '/admin/performances', {
    title: `${PREFIX}${tag}`,
    type: 'PLAY',
    status: 'UPCOMING',
    description: `${PREFIX}설명`,
    isVisible: true,
  });
  const show = await adminApi<Created>(
    'POST',
    `/admin/performances/${perf.id}/shows`,
    {
      showDate: kstDate(30),
      startTime: '14:00',
      venue: `${PREFIX}소극장`,
      totalSeats: seats,
      bookingOpenAt: new Date(Date.now() - DAY_MS).toISOString(),
    }
  );
  await putPolicy(perf.id);
  const tier = (name: string, price: number, visibility: string) =>
    adminApi<Tier>('POST', `/admin/performances/${perf.id}/price-tiers`, {
      name: `${TP}${name}`,
      price,
      visibility,
    });
  const general = await tier('일반', 10000, 'PUBLIC');
  const discount = await tier('할인', 5000, 'LINK_ONLY');
  const memberName = `${PREFIX}단원${tag}`;
  const member = await adminApi<Created>('POST', '/admin/members', {
    name: memberName,
    type: 'GENERAL',
    phone: null,
  });
  const { inviteCode } = await adminApi<{ inviteCode: string }>(
    'POST',
    `/admin/members/${member.id}/invite-code`
  );
  const plainCode = await publicReserve({
    showId: show.id,
    items: [{ tierId: general.id, quantity: 2 }],
    bookerName: `${PREFIX}일반`,
  });
  const invitedCode = await publicReserve({
    showId: show.id,
    items: [
      { tierId: general.id, quantity: 1 },
      { tierId: discount.id, quantity: 1 },
    ],
    tierToken: discount.linkToken,
    inviteCode,
    bookerName: `${PREFIX}초대`,
  });
  const notedCode = await publicReserve({
    showId: show.id,
    items: [{ tierId: general.id, quantity: 1 }],
    inviterNote: '김초대',
    bookerName: `${PREFIX}메모`,
  });
  return {
    performanceId: perf.id,
    showId: show.id,
    general,
    discount,
    memberId: member.id,
    memberName,
    plain: await findByCode(perf.id, plainCode),
    invited: await findByCode(perf.id, invitedCode),
    noted: await findByCode(perf.id, notedCode),
  };
}

/** 보이는 쪽(lg 표 행) */
function row(page: Page, code: string) {
  return page
    .locator(`[data-reservation-code="${code}"]`)
    .filter({ visible: true });
}

async function openPage(page: Page, fixture: Fixture) {
  await page.goto(`/reservations?performanceId=${fixture.performanceId}`);
  await expect(
    page.getByRole('heading', { level: 1, name: '예매 관리' })
  ).toBeVisible();
  await expect(row(page, fixture.plain.code)).toBeVisible();
}

test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

test.describe('연동 SCR-D12 예매 관리', () => {
  test('목록(연락처 하이픈 · 링크 전용 · 초대) · 집계 tiers/byTier/totals/inviters 를 서버와 같은 해석으로 보인다', async ({
    page,
  }) => {
    // Arrange
    const fx = await setup('목록');
    // Assert — 서버 집계 모양(back-end §14.4 #16)
    const summary = await adminApi<{
      shows: {
        showId: string;
        pendingQty: number;
        remainingSeats: number | null;
        byTier: {
          tierId: string | null;
          tierName: string;
          pendingQty: number;
        }[];
      }[];
      tiers: { tierId: string | null; tierName: string; pendingQty: number }[];
      inviters: {
        memberId: string | null;
        name: string | null;
        pendingQty: number;
      }[];
      totals: Record<string, number>;
    }>('GET', `/admin/reservations/summary?performanceId=${fx.performanceId}`);
    const tierRows = [
      { tierId: fx.general.id, tierName: `${TP}일반`, pendingQty: 4 },
      { tierId: fx.discount.id, tierName: `${TP}할인`, pendingQty: 1 },
    ];
    expect(summary.tiers).toEqual(
      tierRows.map((t) => expect.objectContaining(t))
    );
    expect(summary.shows).toHaveLength(1);
    expect(summary.shows[0]).toMatchObject({
      showId: fx.showId,
      pendingQty: 5,
      remainingSeats: 15,
    });
    expect(summary.shows[0].byTier).toEqual(
      tierRows.map((t) => expect.objectContaining(t))
    );
    expect(summary.totals).toEqual({
      pendingCount: 3,
      pendingQty: 5,
      confirmedQty: 0,
      confirmedAmount: 0,
      overdueCount: 0,
    });
    expect(summary.inviters).toEqual([
      expect.objectContaining({
        memberId: fx.memberId,
        name: fx.memberName,
        pendingQty: 2,
      }),
      expect.objectContaining({
        memberId: null,
        name: '직접 입력',
        pendingQty: 1,
      }),
      expect.objectContaining({ memberId: null, name: null, pendingQty: 2 }),
    ]);
    // 서버는 연락처를 숫자만 저장
    expect(fx.plain.bookerPhone).toMatch(/^010\d{8}$/);

    // Act
    await openPage(page, fx);
    // Assert — 목록
    await expect(page.locator('[data-reservation-code]:visible')).toHaveCount(
      3
    );
    const plain = row(page, fx.plain.code);
    await expect(plain).toContainText(`${TP}일반 2`);
    await expect(plain).toContainText('20,000원');
    await expect(plain).toContainText(
      fx.plain.bookerPhone?.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3') ?? ''
    );
    const invited = row(page, fx.invited.code);
    await expect(invited).toContainText(`${TP}일반 1 · ${TP}할인 1`);
    await expect(invited).toContainText('15,000원');
    await expect(invited).toContainText(fx.memberName);
    await expect(row(page, fx.noted.code)).toContainText('김초대 (직접 입력)');
    // KPI — 입금 대기 3건
    await expect(page.getByText('5매 · 기한 지남 0건')).toBeVisible();

    // Act — 집계 탭
    await page.getByRole('tab', { name: '집계' }).click();
    // Assert
    const byTier = page.getByRole('region', { name: '등급별 집계' });
    await expect(
      byTier.getByRole('columnheader', { name: `${TP}할인` })
    ).toBeVisible();
    await expect(byTier.getByRole('row', { name: /공연 합계/ })).toContainText(
      '확정 0 · 대기 4'
    );
    const inviters = page.getByRole('region', { name: '단원별 초대' });
    const inviterRows = inviters.getByRole('row');
    // 머리 + 단원 → 직접 입력 → 초대 없음
    await expect(inviterRows).toHaveCount(4);
    await expect(inviterRows.nth(1)).toContainText(fx.memberName);
    await expect(inviterRows.nth(2)).toContainText('직접 입력');
    await expect(inviterRows.nth(3)).toContainText('초대 없음');
  });

  test('입금 확인 → 되돌리기, 취소 → 되살리기, 메모 저장은 서버 version 을 하나씩 올린다', async ({
    page,
  }) => {
    // Arrange
    const fx = await setup('전이');
    const code = fx.plain.code;
    await openPage(page, fx);
    const r = row(page, code);
    const now = () => findByCode(fx.performanceId, code);

    // Act — 입금 확인
    await r.getByRole('button', { name: '입금 확인' }).click();
    // Assert
    await expect(page.getByText(`${code} 입금을 확인했습니다.`)).toBeVisible();
    await expect(r.getByRole('button', { name: '확인 취소' })).toBeVisible();
    expect(await now()).toMatchObject({ status: 'CONFIRMED', version: 2 });
    // Act — 되돌리기(응답 version 2 로 unconfirm)
    await page.getByRole('button', { name: '되돌리기' }).click();
    // Assert
    await expect(
      page.getByText(`${code} 입금 확인을 되돌렸습니다.`)
    ).toBeVisible();
    await expect(r.getByRole('button', { name: '입금 확인' })).toBeVisible();
    expect(await now()).toMatchObject({ status: 'PENDING', version: 3 });

    // Act — 취소(관리자 사유)
    await r.getByRole('button', { name: '취소', exact: true }).click();
    const dialog = page.getByRole('dialog', {
      name: '예매를 취소하시겠습니까?',
    });
    await dialog.getByRole('radio', { name: '관리자' }).check();
    await dialog.getByRole('button', { name: '예매 취소' }).click();
    // Assert
    await expect(page.getByText(`${code} 예매를 취소했습니다.`)).toBeVisible();
    await expect(r).toContainText('관리자');
    expect(await now()).toMatchObject({
      status: 'CANCELLED',
      cancelReason: 'ADMIN',
      version: 4,
    });
    // Act — 되살리기
    await r.getByRole('button', { name: '되살리기' }).click();
    // Assert
    await expect(page.getByText(`${code} 예매를 되살렸습니다.`)).toBeVisible();
    await expect(r.getByRole('button', { name: '입금 확인' })).toBeVisible();
    expect(await now()).toMatchObject({ status: 'PENDING', version: 5 });

    // Act — 메모 추가
    await r.getByRole('button', { name: `${code} 메모 추가` }).click();
    const memo = page.getByRole('dialog', {
      name: new RegExp(`메모 · ${code}`),
    });
    await memo
      .getByRole('textbox', { name: '메모' })
      .fill('  전화로 입금 약속  ');
    await memo.getByRole('button', { name: '저장' }).click();
    // Assert — PATCH version + 1, 공백 다듬기
    await expect(memo).toBeHidden();
    await expect(
      r.getByRole('button', { name: `${code} 메모 보기·수정` })
    ).toBeVisible();
    expect(await now()).toMatchObject({
      memo: '전화로 입금 약속',
      version: 6,
      status: 'PENDING',
    });
  });

  test('등급 수정 PUT items — 새 등급은 지금 가격, 직접 입력 줄만 남기고 금액을 정하면 "금액 조정"', async ({
    page,
  }) => {
    // Arrange — 일반 2 공개 예매 + (관리자 등록) 일반 1 + 직접 입력 '초대' 1 0원
    const fx = await setup('등급');
    const manual = await adminApi<Rsv>('POST', '/admin/reservations', {
      showId: fx.showId,
      bookerName: `${PREFIX}관리등급`,
      items: [{ tierId: fx.general.id, quantity: 1 }],
      customLine: { label: '초대', quantity: 1, amount: 0 },
      status: 'PENDING',
    });
    await openPage(page, fx);

    // Act — 공개 예매에 할인 1매 더하기
    const plain = row(page, fx.plain.code);
    await plain
      .getByRole('button', { name: `${fx.plain.code} 등급 수정` })
      .click();
    const dialog = page.getByRole('dialog', { name: /등급 수정/ });
    await expect(dialog.getByText('예매 당시 10,000원')).toBeVisible();
    await expect(dialog.getByText('지금 가격 5,000원')).toBeVisible();
    await dialog.getByRole('button', { name: `${TP}할인 1매 더하기` }).click();
    await expect(dialog.getByText('3매 · 25,000원')).toBeVisible();
    await dialog.getByRole('button', { name: '저장' }).click();
    // Assert
    await expect(
      page.getByText(`${fx.plain.code} 등급을 수정했습니다.`)
    ).toBeVisible();
    await expect(plain).toContainText(`${TP}일반 2 · ${TP}할인 1`);
    await expect(plain).toContainText('25,000원');
    const saved = await findByCode(fx.performanceId, fx.plain.code);
    expect(saved).toMatchObject({
      amount: 25000,
      version: 2,
      status: 'PENDING',
    });
    expect(
      saved.items.map((l) => [l.tierName, l.unitPrice, l.visibility])
    ).toEqual([
      [`${TP}일반`, 10000, 'PUBLIC'],
      [`${TP}할인`, 5000, 'LINK_ONLY'],
    ]);

    // Act — 관리자 등록 예매: 일반 빼고 직접 입력 줄만 + 금액 3,000원
    const admin = row(page, manual.code);
    await admin
      .getByRole('button', { name: `${manual.code} 등급 수정` })
      .click();
    const edit = page.getByRole('dialog', { name: /등급 수정/ });
    await edit.getByRole('button', { name: `${TP}일반 1매 빼기` }).click();
    await edit.getByLabel('금액 직접 정하기').check();
    await edit.getByRole('textbox', { name: '직접 정한 금액' }).fill('3000');
    const put = page.waitForResponse(
      (res) =>
        res.url().endsWith(`/admin/reservations/${manual.id}/items`) &&
        res.request().method() === 'PUT'
    );
    await edit.getByRole('button', { name: '저장' }).click();
    // Assert — 등급 줄 없음은 items 키를 빼고 보낸다(빈 배열이면 서버 400 RSV_012)
    const response = await put;
    expect(response.status()).toBe(200);
    expect(response.request().postDataJSON()).toEqual({
      customLine: { label: '초대', quantity: 1, amount: 0 },
      amountOverride: 3000,
      version: 1,
    });
    await expect(edit).toBeHidden();
    await expect(admin).toContainText('초대 1');
    await expect(admin).toContainText('3,000원');
    await expect(admin).toContainText('금액 조정');
    expect(await findByCode(fx.performanceId, manual.code)).toMatchObject({
      amount: 3000,
      amountOverridden: true,
      items: [
        expect.objectContaining({
          tierId: null,
          tierName: '초대',
          unitPrice: null,
          isCustom: true,
          visibility: null,
        }),
      ],
    });
  });

  test('수동 등록 — 직접 입력 0원 확정 · 연락처 없음은 무료·관리자 등록, 연락처 숫자만은 하이픈으로 보인다', async ({
    page,
  }) => {
    // Arrange
    const fx = await setup('등록');
    await openPage(page, fx);

    // Act — 직접 입력 2매 0원 확정, 연락처 없음
    await page.getByRole('button', { name: '예매 등록' }).click();
    const dialog = page.getByRole('dialog', { name: '예매 등록' });
    await dialog
      .getByRole('textbox', { name: /^이름/ })
      .fill(`${PREFIX}초대손님`);
    await dialog.getByRole('button', { name: '직접 입력' }).click();
    await dialog.getByLabel('표시 이름').fill('초대');
    await dialog.getByRole('textbox', { name: /^매수/ }).fill('2');
    await dialog.getByRole('textbox', { name: /^금액/ }).fill('0');
    await dialog.getByRole('button', { name: '확정' }).click();
    await dialog.getByRole('textbox', { name: /^입장 인원/ }).fill('0');
    const post = page.waitForResponse(
      (res) =>
        res.url().endsWith('/admin/reservations') &&
        res.request().method() === 'POST'
    );
    await dialog.getByRole('button', { name: '등록', exact: true }).click();
    // Assert — 요청(items 키 없음 · 연락처 null)과 201 응답
    const response = await post;
    expect(response.status()).toBe(201);
    expect(response.request().postDataJSON()).toEqual({
      showId: fx.showId,
      bookerName: `${PREFIX}초대손님`,
      bookerPhone: null,
      customLine: { label: '초대', quantity: 2, amount: 0 },
      amountOverride: null,
      status: 'CONFIRMED',
      memo: null,
      inviterMemberId: null,
      admitNow: 0,
    });
    const created = (await response.json()) as Rsv;
    expect(created).toMatchObject({
      status: 'CONFIRMED',
      source: 'ADMIN',
      amount: 0,
      bookerPhone: null,
    });
    await expect(
      page.getByText(`${created.code} 예매를 등록했습니다.`)
    ).toBeVisible();
    const free = row(page, created.code);
    await expect(free).toContainText('무료');
    await expect(free).toContainText('관리자 등록');
    await expect(free).toContainText('연락처 없음');
    await expect(free).toContainText('초대 2');

    // Act — 등급(일반 1 · 할인 1) + 연락처 숫자만, 입금 대기
    await page.getByRole('button', { name: '예매 등록' }).click();
    const second = page.getByRole('dialog', { name: '예매 등록' });
    await second
      .getByRole('textbox', { name: /^이름/ })
      .fill(`${PREFIX}전화손님`);
    await second.getByRole('textbox', { name: /^연락처/ }).fill('01098765432');
    await second.getByRole('button', { name: `${TP}일반 1매 더하기` }).click();
    await second.getByRole('button', { name: `${TP}할인 1매 더하기` }).click();
    await expect(second.getByText('2매 · 15,000원')).toBeVisible();
    const post2 = page.waitForResponse(
      (res) =>
        res.url().endsWith('/admin/reservations') &&
        res.request().method() === 'POST'
    );
    await second.getByRole('button', { name: '등록', exact: true }).click();
    // Assert — 서버 저장은 숫자만, 화면은 하이픈
    const phoneRsv = (await (await post2).json()) as Rsv;
    expect(phoneRsv).toMatchObject({
      bookerPhone: '01098765432',
      status: 'PENDING',
      amount: 15000,
    });
    const phoneRow = row(page, phoneRsv.code);
    await expect(phoneRow).toContainText('010-9876-5432');
    await expect(phoneRow).toContainText(`${TP}일반 1 · ${TP}할인 1`);
    await expect(phoneRow).toContainText('관리자 등록');
  });

  test('수동 등록 중 다른 곳에서 좌석이 차면 서버 RSV_003 문구를 Dialog 안에 보인다', async ({
    page,
  }) => {
    // Arrange — 좌석 9, 공개 예매 5매 → 남은 4
    const fx = await setup('매진', 9);
    await openPage(page, fx);
    await page.getByRole('button', { name: '예매 등록' }).click();
    const dialog = page.getByRole('dialog', { name: '예매 등록' });
    await expect(dialog.getByText(/남은 4석/)).toBeVisible();
    await dialog
      .getByRole('textbox', { name: /^이름/ })
      .fill(`${PREFIX}늦은손님`);
    await dialog.getByRole('button', { name: '직접 입력' }).click();
    await dialog.getByRole('textbox', { name: /^매수/ }).fill('3');
    await dialog.getByRole('textbox', { name: /^금액/ }).fill('0');
    // 그 사이 다른 관리자가 2석을 채운다 → 남은 2
    await adminApi('POST', '/admin/reservations', {
      showId: fx.showId,
      bookerName: `${PREFIX}먼저손님`,
      customLine: { quantity: 2, amount: 0 },
      status: 'PENDING',
    });
    // Act
    await dialog.getByRole('button', { name: '등록', exact: true }).click();
    // Assert
    await expect(
      dialog.getByText('남은 좌석이 부족합니다. (남은 좌석 2석)')
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('기한 지난 예매 취소 — 지난 회차의 입금 대기만 DEADLINE_PASSED 로 취소한다', async ({
    page,
  }) => {
    // Arrange — 지난 회차(이틀 전)에 수동 등록 입금 대기 → 기한 = 회차 시작(이미 지남)
    const fx = await setup('기한');
    const past = await adminApi<Created>(
      'POST',
      `/admin/performances/${fx.performanceId}/shows`,
      {
        showDate: kstDate(-2),
        startTime: '19:00',
        venue: `${PREFIX}소극장`,
        totalSeats: 10,
        bookingOpenAt: new Date(Date.now() - 5 * DAY_MS).toISOString(),
      }
    );
    const overdue = await adminApi<Rsv>('POST', '/admin/reservations', {
      showId: past.id,
      bookerName: `${PREFIX}기한지남`,
      bookerPhone: '010-3000-0001',
      customLine: { quantity: 1, amount: 10000 },
      status: 'PENDING',
    });
    expect(overdue.deadlinePassed).toBe(true);
    await openPage(page, fx);
    await expect(row(page, overdue.code)).toContainText('기한 지남');

    // Act
    await page.getByRole('button', { name: '기한 지난 예매 취소' }).click();
    const confirm = page.getByRole('alertdialog', {
      name: '입금 기한이 지난 입금 대기 예매 1건을 취소하시겠습니까?',
    });
    await confirm.getByRole('button', { name: '1건 취소' }).click();
    // Assert
    await expect(
      page.getByText('기한 지난 예매 1건을 취소했습니다.')
    ).toBeVisible();
    await expect(
      row(page, overdue.code).getByRole('button', { name: '되살리기' })
    ).toBeVisible();
    expect(await findByCode(fx.performanceId, overdue.code)).toMatchObject({
      status: 'CANCELLED',
      cancelReason: 'DEADLINE_PASSED',
    });
    expect((await findByCode(fx.performanceId, fx.plain.code)).status).toBe(
      'PENDING'
    );
  });

  test('version 충돌 — 두 브라우저에서 같은 예매를 확정하면 늦은 쪽은 RSV_007 정본 스낵바 후 새 상태를 보인다', async ({
    page,
    browser,
  }) => {
    // Arrange — 같은 예매를 두 컨텍스트에서 연다
    const fx = await setup('충돌');
    const code = fx.plain.code;
    const other = await browser.newContext({
      storageState: INTEGRATION_AUTH_STATE,
    });
    const otherPage = await other.newPage();
    await openPage(page, fx);
    await openPage(otherPage, fx);

    // Act — 다른 스태프가 먼저 확정
    await row(otherPage, code)
      .getByRole('button', { name: '입금 확인' })
      .click();
    await expect(
      otherPage.getByText(`${code} 입금을 확인했습니다.`)
    ).toBeVisible();
    // Act — 이쪽은 옛 version(1)으로 확정
    const conflict = page.waitForResponse((res) =>
      res.url().endsWith(`/admin/reservations/${fx.plain.id}/confirm`)
    );
    await row(page, code).getByRole('button', { name: '입금 확인' }).click();
    // Assert — 409 RSV_007 → 정본 스낵바 + 재조회로 확정 상태
    const response = await conflict;
    expect(response.status()).toBe(409);
    expect((await response.json()).code).toBe('RSV_007');
    await expect(
      page.getByText(
        '다른 스태프가 먼저 처리했습니다. 목록을 새로 불러왔습니다.'
      )
    ).toBeVisible();
    await expect(
      row(page, code).getByRole('button', { name: '확인 취소' })
    ).toBeVisible();
    expect(await findByCode(fx.performanceId, code)).toMatchObject({
      status: 'CONFIRMED',
      version: 2,
    });
    await other.close();
  });

  test('화면을 연 뒤 예매가 지워지면(RSV_013) 서버 문구 스낵바와 함께 목록에서 빠진다', async ({
    page,
  }) => {
    // Arrange — 지울 예매는 따로 접두사(정리 도우미가 그 접두사 행만 지운다)
    const fx = await setup('없음');
    const gonePrefix = fixturePrefix('rsv-gone');
    const gone = await adminApi<Rsv>('POST', '/admin/reservations', {
      showId: fx.showId,
      bookerName: `${gonePrefix}손님`,
      customLine: { quantity: 1, amount: 1000 },
      status: 'PENDING',
    });
    await openPage(page, fx);
    await expect(row(page, gone.code)).toBeVisible();
    cleanupFixtures(gonePrefix);
    // Act
    const res = page.waitForResponse((r) =>
      r.url().endsWith(`/admin/reservations/${gone.id}/confirm`)
    );
    await row(page, gone.code)
      .getByRole('button', { name: '입금 확인' })
      .click();
    // Assert
    const response = await res;
    expect(response.status()).toBe(404);
    expect((await response.json()).code).toBe('RSV_013');
    await expect(page.getByText('예매 정보를 찾을 수 없습니다.')).toBeVisible();
    await expect(row(page, gone.code)).toHaveCount(0);
    await expect(row(page, fx.plain.code)).toBeVisible();
  });
});
