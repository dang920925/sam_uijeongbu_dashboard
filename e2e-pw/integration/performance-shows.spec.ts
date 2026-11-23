// ----------------------------------------------------------------------
// 연동 SCR-D11 회차·예매 설정·가격 등급(FN-28·29 · develop §11.10) — 실서버 /admin/performances/{id}/shows ·
// /admin/shows/{id} · /admin/performances/{id}/booking-policy · /admin/performances/{id}/price-tiers ·
// /admin/price-tiers/{id}(+/link-token) · /admin/members/invite-codes · /admin/members/{id}/invite-code.
// - 회차: 추가(bookingOpenAt 은 '+09:00' 으로 보내고 서버 UTC Z 를 KST 로 표시) · 수정 · 같은 날짜·시각 409 SHW_002 ·
//   예매보다 좌석 축소 409 SHW_003 · 예매 있는 회차 삭제 409 SHW_004 · 없는 회차 삭제.
// - 예매 설정 6칸 + 문의처(https 만 — http·javascript: 는 칸 아래 문구로 막음, 서버도 400) · missingFields → 알림.
// - 가격 등급: 0원 막음(서버도 400) · 이름 중복 400(다이얼로그 안 문구) · 추가는 맨 뒤 순서 · ▲▼ · 사용 중지 ·
//   링크 복사(CLIENT_PUBLIC_URL=http://localhost:4220 조립) · 등급+단원 초대 링크 · 재발급 200 · 쓰인 등급 삭제 막기 ·
//   링크 전용만 있으면 publicTier 경고(링크 안내).
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

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const PREFIX = fixturePrefix('shows');
/** 등급 이름(≤30자)·은행·예금주(≤30자)는 접두사가 길어 짧은 표지만 붙인다 — 픽스처 공연 아래라 공연 삭제로 함께 지워진다 */
const TP = 'W2';
const CLIENT_PUBLIC_URL = 'http://localhost:4220';
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

interface Created {
  id: string;
}

interface Tier {
  id: string;
  name: string;
  price: number;
  visibility: 'PUBLIC' | 'LINK_ONLY';
  linkToken: string | null;
  sortOrder: number;
  isActive: boolean;
  usedQty: number;
}

interface AdminShow {
  id: string;
  bookingOpenAt: string | null;
  totalSeats: number | null;
  state: string;
  missingFields: string[];
}

function kstDate(offsetDays: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(Date.now() + offsetDays * DAY_MS)
  );
}

/** 'YYYY-MM-DD' → 화면 표기 'YYYY.MM.DD (요일)' */
function dateLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${date.replaceAll('-', '.')} (${WEEKDAY[day]})`;
}

async function createPerformance(tag: string): Promise<Created> {
  return adminApi<Created>('POST', '/admin/performances', {
    title: `${PREFIX}${tag}`,
    type: 'PLAY',
    status: 'UPCOMING',
    description: `${PREFIX}설명`,
    isVisible: true,
  });
}

function createShow(
  performanceId: string,
  body: Record<string, unknown>
): Promise<Created> {
  return adminApi<Created>(
    'POST',
    `/admin/performances/${performanceId}/shows`,
    body
  );
}

/** 모든 조건이 채워진 회차(오픈 시각은 어제) */
function readyShow(showDate: string, startTime: string) {
  return {
    showDate,
    startTime,
    venue: `${PREFIX}소극장`,
    totalSeats: 10,
    bookingOpenAt: new Date(Date.now() - DAY_MS).toISOString(),
  };
}

/** 가짜 값만(실제 계좌·운영 값 금지) */
const FAKE_ACCOUNT = '0000-00-0000000';
const FULL_POLICY = {
  depositBank: `${TP}은행`,
  depositAccountNumber: FAKE_ACCOUNT,
  depositAccountHolder: `${TP}극단`,
  maxTicketsPerBooking: 4,
  depositDeadlineHours: 24,
  refundPolicyText: `${PREFIX}환불 규정`,
};

/** 도우미 adminApi 에 PUT 이 없어 같은 토큰으로 직접 부른다 */
async function putPolicy(
  performanceId: string,
  body: Record<string, unknown>
): Promise<{ status: number; body: { code?: string; message?: string } }> {
  const response = await fetch(
    `${INT_API_BASE_URL}/api/v1/admin/performances/${performanceId}/booking-policy`,
    {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${await adminToken()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  return { status: response.status, body: await response.json() };
}

async function createTier(
  performanceId: string,
  name: string,
  visibility: 'PUBLIC' | 'LINK_ONLY' = 'PUBLIC',
  price = 15000
): Promise<Tier> {
  const tier = await adminApi<Tier>(
    'POST',
    `/admin/performances/${performanceId}/price-tiers`,
    { name: `${TP}${name}`, price, visibility }
  );
  // U41(v1.3.1) — 예매가 열리려면 기본가·SAM 관계자가가 있어야 한다(PUBLIC 등급을 만드는 시험의 준비 조건)
  if (visibility === 'PUBLIC') {
    await adminApi(
      'PUT',
      `/admin/performances/${performanceId}/inviter-prices`,
      {
        base: price,
        samRelated: 7000,
      }
    );
  }
  return tier;
}

async function listTiers(performanceId: string): Promise<Tier[]> {
  const res = await adminApi<{ items: Tier[] }>(
    'GET',
    `/admin/performances/${performanceId}/price-tiers`
  );
  return res.items;
}

async function listShows(performanceId: string): Promise<AdminShow[]> {
  const res = await adminApi<{ items: AdminShow[] }>(
    'GET',
    `/admin/performances/${performanceId}/shows`
  );
  return res.items;
}

/** 공개 예매(중계 비밀) — 연락처는 예매마다 달리(같은 연락처 입금 대기 중복 RSV_004) */
async function reserve(
  showId: string,
  _tierId: string,
  quantity: number,
  phoneTail: string
) {
  const res = await relayPost('/reservations', {
    showId,
    quantity, // U41 — 매수 + 초대한 사람(가격은 기본가 역할 등급)
    inviter: { kind: 'STAFF_RELATED' },
    bookerName: `${PREFIX}예매자`,
    bookerPhone: `010-0000-${phoneTail}`,
    agreedToPrivacy: true,
    agreedToRefundPolicy: true,
  });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
}

function tierEntryOf(page: Page, name: string) {
  return page
    .getByRole('row')
    .filter({ hasText: `${TP}${name}` })
    .filter({ visible: true });
}

function entryOf(page: Page, date: string, time: string) {
  return page
    .getByRole('row')
    .filter({ hasText: dateLabel(date) })
    .filter({ hasText: time });
}

/** 준비 상태 알림(스낵바도 role=status 라 data-tone 으로 고른다) */
function noticeOf(page: Page) {
  return page.locator('[role="status"][data-tone]');
}

async function gotoShows(page: Page, performanceId: string) {
  await page.goto(`/performances/${performanceId}/shows`);
  await expect(page.getByRole('heading', { name: '예매 설정' })).toBeVisible();
}

test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

test.describe('연동 SCR-D11 회차·예매 설정', () => {
  test('예매 설정을 저장하면(문의처 http·javascript: 는 막음) 서버 missingFields 가 비고 알림이 info 가 된다', async ({
    page,
  }) => {
    // Arrange — 회차·등급은 채웠고 공연 설정만 비어 있다
    const perf = await createPerformance('설정');
    await createShow(perf.id, readyShow(kstDate(30), '14:00'));
    await createTier(perf.id, '일반');
    await gotoShows(page, perf.id);
    const notice = noticeOf(page);
    await expect(notice).toHaveAttribute('data-tone', 'warning');
    await expect(notice).toContainText('입금 은행');

    // Act — javascript: 문의처
    await page.getByLabel('입금 은행').fill(`${TP}은행`);
    await page.getByLabel('계좌번호').fill(FAKE_ACCOUNT);
    await page.getByLabel('예금주').fill(`${TP}극단`);
    await page.getByLabel('1인 최대 매수').fill('4');
    await page.getByLabel('입금 기한 (시간)').fill('24');
    await page.getByLabel('취소·환불 규정').fill(`${PREFIX}환불 규정`);
    await page.getByLabel('문의처').fill('javascript:alert(1)');
    await page
      .getByRole('button', { name: '저장', exact: true })
      .first()
      .click();
    // Assert — 칸 아래 문구, 저장 안 됨
    await expect(page.getByText('입력값을 확인해주세요.')).toHaveCount(1);
    expect(
      (
        await adminApi<{ missingFields: string[] }>(
          'GET',
          `/admin/performances/${perf.id}/booking-policy`
        )
      ).missingFields
    ).toHaveLength(6);

    // Act — https 문의처로 저장
    await page.getByLabel('문의처').fill('https://open.kakao.com/o/fixture');
    const put = page.waitForResponse(
      (res) =>
        res.url().endsWith(`/admin/performances/${perf.id}/booking-policy`) &&
        res.request().method() === 'PUT'
    );
    await page
      .getByRole('button', { name: '저장', exact: true })
      .first()
      .click();
    // Assert — 요청 본문(숫자는 정수, 문의처 포함)·서버 응답·화면
    const response = await put;
    expect(response.status()).toBe(200);
    expect(response.request().postDataJSON()).toEqual({
      ...FULL_POLICY,
      inquiryContact: 'https://open.kakao.com/o/fixture',
    });
    expect((await response.json()).missingFields).toEqual([]);
    await expect(page.getByText('저장되었습니다')).toBeVisible();
    await expect(notice).toHaveAttribute('data-tone', 'info');
    await page.reload();
    await expect(page.getByLabel('문의처')).toHaveValue(
      'https://open.kakao.com/o/fixture'
    );

    // Assert — 서버도 http:·javascript: 는 400(화면 우회 대비)
    for (const inquiryContact of ['http://x.example', 'javascript:alert(1)']) {
      const res = await putPolicy(perf.id, { ...FULL_POLICY, inquiryContact });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        '문의처의 링크는 https 주소만 쓸 수 있습니다.'
      );
    }
  });

  test('회차 추가·수정 — 오픈 시각은 +09:00 으로 보내고 서버 UTC 를 KST 로 보이며, 같은 날짜·시각은 409 문구', async ({
    page,
  }) => {
    // Arrange
    const perf = await createPerformance('회차');
    expect((await putPolicy(perf.id, FULL_POLICY)).status).toBe(200);
    await createTier(perf.id, '일반');
    const date = kstDate(40);
    const openDate = kstDate(-1);
    await gotoShows(page, perf.id);

    // Act — 오픈 시각 없이 추가
    await page.getByRole('button', { name: '회차 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '회차 추가' });
    await dialog.getByLabel(/^날짜/).fill(date);
    await dialog.getByLabel(/^시작 시각/).fill('14:00');
    await dialog.getByLabel('장소').fill(`${PREFIX}소극장`);
    await dialog.getByLabel('좌석 수').fill('50');
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert — 서버 NOT_READY + missingFields bookingOpenAt → 화면 준비 중·빈 칸
    await expect(dialog).toBeHidden();
    const entry = entryOf(page, date, '14:00');
    await expect(entry).toContainText('준비 중');
    await expect(entry).toContainText('빈 칸: 오픈 시각');
    const [created] = await listShows(perf.id);
    expect(created.missingFields).toEqual(['bookingOpenAt']);

    // Act — 수정: 오픈 시각 09:30(KST)
    await entry
      .getByRole('button', { name: `회차 수정 ${dateLabel(date)} 14:00` })
      .click();
    const edit = page.getByRole('dialog', { name: '회차 수정' });
    await expect(edit.getByLabel('좌석 수')).toHaveValue('50');
    await edit.getByLabel('예매 오픈 날짜').fill(openDate);
    await edit.getByLabel('예매 오픈 시각').fill('09:30');
    const patch = page.waitForResponse(
      (res) =>
        res.url().endsWith(`/admin/shows/${created.id}`) &&
        res.request().method() === 'PATCH'
    );
    await edit.getByRole('button', { name: '저장' }).click();
    // Assert — 요청은 +09:00, 응답은 UTC Z(전날 00:30), 화면은 KST 09:30
    const response = await patch;
    expect(response.status()).toBe(200);
    expect(response.request().postDataJSON().bookingOpenAt).toBe(
      `${openDate}T09:30:00+09:00`
    );
    const saved = (await response.json()) as AdminShow;
    expect(saved.bookingOpenAt).toBe(
      new Date(`${openDate}T09:30:00+09:00`).toISOString()
    );
    expect(saved.bookingOpenAt).toMatch(/T00:30:00\.000Z$/);
    await expect(edit).toBeHidden();
    await expect(entry).toContainText(`${openDate.replaceAll('-', '.')} 09:30`);
    await expect(entry).toContainText('열림');
    await expect(noticeOf(page)).toHaveAttribute('data-tone', 'info');
    // 다시 열면 같은 KST 값
    await entry
      .getByRole('button', { name: `회차 수정 ${dateLabel(date)} 14:00` })
      .click();
    await expect(edit.getByLabel('예매 오픈 날짜')).toHaveValue(openDate);
    await expect(edit.getByLabel('예매 오픈 시각')).toHaveValue('09:30');
    await edit.getByRole('button', { name: '취소' }).click();

    // Act — 같은 날짜·시각 회차 추가
    await page.getByRole('button', { name: '회차 추가' }).click();
    const again = page.getByRole('dialog', { name: '회차 추가' });
    await again.getByLabel(/^날짜/).fill(date);
    await again.getByLabel(/^시작 시각/).fill('14:00');
    await again.getByRole('button', { name: '추가' }).click();
    // Assert — 서버 SHW_002 문구
    await expect(
      again.getByText('같은 날짜·시각의 회차가 이미 있습니다.')
    ).toBeVisible();
  });

  test('예매보다 좌석을 줄이면 SHW_003 문구, 예매 있는 회차 삭제는 SHW_004 스낵바, 없는 회차는 삭제된다', async ({
    page,
  }) => {
    // Arrange — 14:00 회차에 공개 예매 3매(2 + 1)
    const perf = await createPerformance('좌석');
    expect((await putPolicy(perf.id, FULL_POLICY)).status).toBe(200);
    const date = kstDate(50);
    const booked = await createShow(perf.id, readyShow(date, '14:00'));
    await createShow(perf.id, readyShow(date, '18:00'));
    const tier = await createTier(perf.id, '일반');
    await reserve(booked.id, tier.id, 2, '0001');
    await reserve(booked.id, tier.id, 1, '0002');
    await gotoShows(page, perf.id);
    const bookedEntry = entryOf(page, date, '14:00');
    await expect(bookedEntry).toContainText('3 / 0 / 7');

    // Act — 좌석 2로 축소
    await bookedEntry
      .getByRole('button', { name: `회차 수정 ${dateLabel(date)} 14:00` })
      .click();
    const edit = page.getByRole('dialog', { name: '회차 수정' });
    await edit.getByLabel('좌석 수').fill('2');
    await edit.getByRole('button', { name: '저장' }).click();
    // Assert — 서버 SHW_003({n} 채움)
    await expect(
      edit.getByText('좌석 수를 이미 예매된 3석보다 적게 줄일 수 없습니다.')
    ).toBeVisible();
    await edit.getByRole('button', { name: '취소' }).click();

    // Act — 예매 있는 회차 삭제
    await bookedEntry
      .getByRole('button', { name: `회차 삭제 ${dateLabel(date)} 14:00` })
      .click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '삭제' })
      .click();
    // Assert
    await expect(
      page.getByText('예매가 있는 회차는 삭제할 수 없습니다.')
    ).toBeVisible();
    await expect(bookedEntry).toBeVisible();

    // Act — 예매 없는 회차 삭제
    const freeEntry = entryOf(page, date, '18:00');
    await freeEntry
      .getByRole('button', { name: `회차 삭제 ${dateLabel(date)} 18:00` })
      .click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '삭제' })
      .click();
    // Assert
    await expect(freeEntry).toHaveCount(0);
    await expect.poll(async () => (await listShows(perf.id)).length).toBe(1);
  });

  // U41(v1.3.1) — 가격 등급 카드는 '가격'(기본가·SAM 관계자가) 카드로 바뀌었다(release-v131 이 대신 확인)
  test.skip('가격 등급 — 0원 막음 · 이름 중복 400 · 추가는 맨 뒤 · ▲▼ · 사용 중지 · 링크 전용만 남으면 publicTier 경고', async ({
    page,
  }) => {
    // Arrange — 회차·설정은 다 채웠고 등급만 없다
    const perf = await createPerformance('등급');
    expect((await putPolicy(perf.id, FULL_POLICY)).status).toBe(200);
    await createShow(perf.id, readyShow(kstDate(45), '15:00'));
    await gotoShows(page, perf.id);
    await expect(noticeOf(page)).toHaveText(
      '예매를 열려면 다음 항목을 채워주세요: 누구나 고를 수 있는 가격 등급'
    );
    expect((await listShows(perf.id))[0].missingFields).toEqual(['publicTier']);
    const addTier = async (name: string, price: string, linkOnly = false) => {
      await page.getByRole('button', { name: '가격 등급 추가' }).click();
      const dialog = page.getByRole('dialog', { name: '가격 등급 추가' });
      await dialog.getByLabel(/^이름/).fill(`${TP}${name}`);
      await dialog.getByLabel(/^가격/).fill(price);
      if (linkOnly)
        await dialog
          .getByRole('radio', { name: '링크로 들어온 사람만' })
          .check();
      await dialog.getByRole('button', { name: '추가' }).click();
      return dialog;
    };

    // Act — 0원(화면이 막음), 서버도 400
    const zero = await addTier('일반', '0');
    await expect(zero.getByText('입력값을 확인해주세요.')).toBeVisible();
    await zero.getByRole('button', { name: '취소' }).click();
    await expect(
      adminApi('POST', `/admin/performances/${perf.id}/price-tiers`, {
        name: `${TP}영원`,
        price: 0,
        visibility: 'PUBLIC',
      })
    ).rejects.toThrow(/400 .*가격은 1~1000000원 사이여야 합니다/);

    // Act — 일반 · 학생 · 스태프(링크 전용) 추가
    await expect(await addTier('일반', '20000')).toBeHidden();
    await expect(noticeOf(page)).toHaveAttribute('data-tone', 'info');
    await expect(await addTier('학생', '15000')).toBeHidden();
    await expect(await addTier('스태프', '10000', true)).toBeHidden();
    // Assert — 서버 순서(맨 뒤에 붙음)·링크 토큰
    const tiers = await listTiers(perf.id);
    expect(tiers.map((t) => t.name)).toEqual([
      `${TP}일반`,
      `${TP}학생`,
      `${TP}스태프`,
    ]);
    expect(tiers[2].linkToken).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(tiers[0].linkToken).toBeNull();

    // Act — 이름 중복(서버 400 COMMON_001 문구를 다이얼로그 안에)
    const dup = await addTier('일반', '1000');
    // Assert
    await expect(
      dup.getByText('같은 이름의 가격 등급이 이미 있습니다.')
    ).toBeVisible();
    await dup.getByRole('button', { name: '취소' }).click();

    // Act — 스태프를 맨 위로(▲ 두 번) 뒤 새 등급 추가 → 맨 뒤
    const staff = tierEntryOf(page, '스태프');
    await staff
      .getByRole('button', { name: `위로 이동 — ${TP}스태프` })
      .click();
    await expect
      .poll(async () => (await listTiers(perf.id)).map((t) => t.name))
      .toEqual([`${TP}일반`, `${TP}스태프`, `${TP}학생`]);
    await staff
      .getByRole('button', { name: `위로 이동 — ${TP}스태프` })
      .click();
    await expect
      .poll(async () => (await listTiers(perf.id))[0]?.name)
      .toBe(`${TP}스태프`);
    await expect(await addTier('경로', '5000')).toBeHidden();
    // Assert
    await expect
      .poll(async () => (await listTiers(perf.id)).map((t) => t.name))
      .toEqual([`${TP}스태프`, `${TP}일반`, `${TP}학생`, `${TP}경로`]);

    // Act — 누구나 등급 셋 모두 사용 중지 → 링크 전용만
    for (const name of ['일반', '학생', '경로']) {
      await tierEntryOf(page, name)
        .getByRole('switch', { name: `사용 — ${TP}${name}` })
        .click();
      await expect
        .poll(
          async () =>
            (await listTiers(perf.id)).find((t) => t.name === `${TP}${name}`)
              ?.isActive
        )
        .toBe(false);
    }
    // Assert — 서버 state OPEN + missingFields publicTier, 화면 링크 안내
    await expect
      .poll(async () => (await listShows(perf.id))[0].missingFields)
      .toEqual(['publicTier']);
    expect((await listShows(perf.id))[0].state).toBe('OPEN');
    await expect(noticeOf(page)).toHaveText(
      '링크로 들어온 사람만 예매할 수 있습니다.'
    );

    // Act — 수정: 학생 가격 12000
    await tierEntryOf(page, '학생')
      .getByRole('button', { name: `수정 — ${TP}학생` })
      .click();
    const edit = page.getByRole('dialog', { name: '가격 등급 수정' });
    await edit.getByLabel(/^가격/).fill('12000');
    await edit.getByRole('button', { name: '저장' }).click();
    // Assert
    await expect(edit).toBeHidden();
    await expect(tierEntryOf(page, '학생')).toContainText('12,000원');
    expect(
      (await listTiers(perf.id)).find((t) => t.name === `${TP}학생`)?.price
    ).toBe(12000);
  });

  // U41 — 링크 전용 등급 UI 숨김(develop §22)
  test.skip('링크 복사는 CLIENT_PUBLIC_URL 로 조립하고, 단원 초대 링크(발급) · 재발급 200 · 쓰인 등급 삭제 막기', async ({
    page,
  }) => {
    // Arrange
    const perf = await createPerformance('링크');
    expect((await putPolicy(perf.id, FULL_POLICY)).status).toBe(200);
    const show = await createShow(perf.id, readyShow(kstDate(55), '16:00'));
    const general = await createTier(perf.id, '일반');
    const staff = await createTier(perf.id, '스태프', 'LINK_ONLY', 5000);
    await createTier(perf.id, '학생', 'PUBLIC', 10000);
    await reserve(show.id, general.id, 2, '0011');
    const member = await adminApi<Created>('POST', '/admin/members', {
      name: `${PREFIX}단원`,
      type: 'GENERAL',
      phone: null,
    });
    await gotoShows(page, perf.id);
    const linkBase = `${CLIENT_PUBLIC_URL}/works/${perf.id}/book?tier=`;
    const readClipboard = () =>
      page.evaluate(() => navigator.clipboard.readText());
    const entry = tierEntryOf(page, '스태프');

    // Act — 등급 링크 복사
    await entry
      .getByRole('button', { name: `링크 복사 — ${TP}스태프` })
      .click();
    await page.getByRole('menuitem', { name: '등급 링크 복사' }).click();
    // Assert
    await expect(page.getByText('복사되었습니다').first()).toBeVisible();
    expect(await readClipboard()).toBe(`${linkBase}${staff.linkToken}`);

    // Act — 등급 링크 + 단원 초대 링크(코드 없는 단원 → 서버 발급)
    await entry
      .getByRole('button', { name: `링크 복사 — ${TP}스태프` })
      .click();
    await page
      .getByRole('menuitem', { name: /등급 링크 \+ 단원 초대 링크/ })
      .click();
    const pick = page.getByRole('dialog', {
      name: `등급 링크 + 단원 초대 링크 — ${TP}스태프`,
    });
    await pick.getByRole('combobox').fill(`${PREFIX}단`);
    await page.getByRole('option', { name: `${PREFIX}단원` }).click();
    await pick.getByRole('button', { name: '복사' }).click();
    // Assert
    await expect(pick).toBeHidden();
    const codes = await adminApi<{
      items: { memberId: string; inviteCode: string | null }[];
    }>('GET', '/admin/members/invite-codes');
    const code = codes.items.find((m) => m.memberId === member.id)?.inviteCode;
    expect(code).toBeTruthy();
    expect(await readClipboard()).toBe(
      `${linkBase}${staff.linkToken}&ref=${code}`
    );

    // Act — 재발급(200)
    const reissue = page.waitForResponse((res) =>
      res.url().endsWith(`/admin/price-tiers/${staff.id}/link-token`)
    );
    await entry
      .getByRole('button', { name: `링크 재발급 — ${TP}스태프` })
      .click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '재발급' })
      .click();
    // Assert
    expect((await reissue).status()).toBe(200);
    const after = (await listTiers(perf.id)).find((t) => t.id === staff.id);
    expect(after?.linkToken).not.toBe(staff.linkToken);
    await entry
      .getByRole('button', { name: `링크 복사 — ${TP}스태프` })
      .click();
    await page.getByRole('menuitem', { name: '등급 링크 복사' }).click();
    await expect.poll(readClipboard).toBe(`${linkBase}${after?.linkToken}`);

    // Assert — 쓰인 등급(2매)은 삭제 버튼 막힘, 서버도 409 TIER_002
    const usedEntry = tierEntryOf(page, '일반');
    await expect(usedEntry).toContainText('2매');
    await expect(
      usedEntry.getByRole('button', { name: `삭제 — ${TP}일반` })
    ).toBeDisabled();
    await expect(
      adminApi('DELETE', `/admin/price-tiers/${general.id}`)
    ).rejects.toThrow(/409 .*TIER_002/);

    // Act — 안 쓰인 등급 삭제
    const freeEntry = tierEntryOf(page, '학생');
    await freeEntry.getByRole('button', { name: `삭제 — ${TP}학생` }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '삭제' })
      .click();
    // Assert
    await expect(freeEntry).toHaveCount(0);
    await expect
      .poll(async () => (await listTiers(perf.id)).map((t) => t.name))
      .toEqual([`${TP}일반`, `${TP}스태프`]);
  });
});
