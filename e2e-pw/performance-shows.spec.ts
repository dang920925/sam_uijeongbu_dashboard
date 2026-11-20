// ----------------------------------------------------------------------
// SCR-D11 회차·예매 설정(FN-28·29, develop §11.8 S1·S4·S5 · §11.10 S45·S48④·S50·S53) — 빈 회차,
// 예매 설정 저장(문의처 http:// 막음) → 준비 상태 알림 경고→info, 회차 추가·수정(가격 칸 없음),
// 같은 날짜·시각 409 SHW_002, 좌석 축소 409 SHW_003, 예매 있는 회차 삭제 409 SHW_004, 예매 중지 스위치,
// 가격 등급(추가 0원 막음·사용·순서·링크 복사·단원 링크·재발급·쓰인 등급 삭제 불가), 탭 이동, 404.
// desktop 은 표(lg), mobile 은 카드 — 보이는 요소만 골라 같은 테스트로 돈다.
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const PREFIX = 'fixture-r1-w1-';
const API = '/api/backend/v1';
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

interface Created {
  id: string;
}

interface Tier {
  id: string;
  name: string;
  linkToken: string | null;
  sortOrder: number;
  isActive: boolean;
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

async function createPerformance(
  request: APIRequestContext,
  title: string
): Promise<Created> {
  return adminApi<Created>(request, 'POST', '/admin/performances', {
    title,
    type: 'PLAY',
    status: 'UPCOMING',
    description: `${PREFIX}설명`,
    isVisible: false,
  });
}

async function createShow(
  request: APIRequestContext,
  performanceId: string,
  body: Record<string, unknown>
): Promise<Created> {
  return adminApi<Created>(
    request,
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

async function putPolicy(
  request: APIRequestContext,
  performanceId: string,
  body: Record<string, unknown>
) {
  const response = await request.fetch(
    `${API}/admin/performances/${performanceId}/booking-policy`,
    { method: 'PUT', data: body }
  );
  expect(response.ok()).toBe(true);
}

/** 가짜 값만(실제 계좌·운영 값 금지) */
const FAKE_ACCOUNT = '0000-00-0000000';
const FULL_POLICY = {
  depositBank: `${PREFIX}은행`,
  depositAccountNumber: FAKE_ACCOUNT,
  depositAccountHolder: `${PREFIX}극단`,
  maxTicketsPerBooking: 4,
  depositDeadlineHours: 24,
  refundPolicyText: `${PREFIX}환불 규정`,
};

async function createTier(
  request: APIRequestContext,
  performanceId: string,
  name: string,
  visibility: 'PUBLIC' | 'LINK_ONLY' = 'PUBLIC',
  price = 15000
): Promise<Tier> {
  return adminApi<Tier>(
    request,
    'POST',
    `/admin/performances/${performanceId}/price-tiers`,
    { name: `${PREFIX}${name}`, price, visibility }
  );
}

async function listTiers(
  request: APIRequestContext,
  performanceId: string
): Promise<Tier[]> {
  const res = await adminApi<{ items: Tier[] }>(
    request,
    'GET',
    `/admin/performances/${performanceId}/price-tiers`
  );
  return res.items;
}

async function reserve(
  request: APIRequestContext,
  showId: string,
  tierId: string,
  quantity: number
) {
  await adminApi(request, 'POST', '/__mock/booking/reservation', {
    showId,
    items: [{ tierId, quantity }],
    bookerName: `${PREFIX}예매자`,
    bookerPhone: '010-0000-0000',
  });
}

/** 등급 줄(표 행 / 카드) */
function tierEntryOf(page: Page, isMobile: boolean, name: string) {
  return (isMobile ? page.getByRole('listitem') : page.getByRole('row'))
    .filter({ hasText: `${PREFIX}${name}` })
    .filter({ visible: true });
}

/** 표(desktop)·카드(mobile) 중 보이는 쪽에서 해당 회차 줄 */
function entryOf(page: Page, isMobile: boolean, date: string, time: string) {
  return isMobile
    ? page
        .getByRole('listitem')
        .filter({ hasText: `${dateLabel(date)} ${time}` })
    : page
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

test.describe('SCR-D11 회차·예매 설정', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('회차가 없으면 빈 문구를 보이고 준비 상태 알림은 숨긴다', async ({
    page,
    request,
  }) => {
    // Arrange
    const title = `${PREFIX}빈 회차`;
    const perf = await createPerformance(request, title);
    // Act
    await gotoShows(page, perf.id);
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: title })
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: '회차·예매' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(page.getByText('등록된 회차가 없습니다')).toBeVisible();
    await expect(noticeOf(page)).toHaveCount(0);
    await expect(
      page.getByText('회차는 일정 관리에 자동으로 추가되지 않습니다.', {
        exact: false,
      })
    ).toBeVisible();
  });

  test('예매 설정을 검증 후 저장하면 준비 상태 알림이 경고에서 info 로 바뀐다', async ({
    page,
    request,
  }) => {
    // Arrange — 회차는 다 채웠고 공연 설정만 비어 있다
    const perf = await createPerformance(request, `${PREFIX}설정 저장`);
    const date = kstDate(30);
    await createShow(request, perf.id, readyShow(date, '14:00'));
    await createTier(request, perf.id, '일반');
    await gotoShows(page, perf.id);
    const notice = noticeOf(page);
    await expect(notice).toHaveAttribute('data-tone', 'warning');
    // Act — 잘못된 계좌번호·1인 최대·http 문의처
    await page.getByLabel('입금 은행').fill(`${PREFIX}은행`);
    await page.getByLabel('문의처').fill('http://fixture.example/chat');
    await page.getByLabel('계좌번호').fill('12');
    await page.getByLabel('예금주').fill(`${PREFIX}극단`);
    await page.getByLabel('1인 최대 매수').fill('21');
    await page.getByLabel('입금 기한 (시간)').fill('24');
    await page.getByRole('button', { name: '기본 문구 넣기' }).click();
    await page.getByRole('button', { name: '저장', exact: true }).click();
    // Assert — 저장하지 않고 칸 아래 문구
    await expect(page.getByText('입력값을 확인해주세요.')).toHaveCount(3);
    await expect(notice).toHaveAttribute('data-tone', 'warning');
    // Act — 고쳐서 저장
    await page.getByLabel('계좌번호').fill(FAKE_ACCOUNT);
    await page.getByLabel('1인 최대 매수').fill('4');
    await page.getByLabel('문의처').fill('https://fixture.example/chat');
    await page.getByRole('button', { name: '저장', exact: true }).click();
    // Assert
    await expect(page.getByText('저장되었습니다')).toBeVisible();
    await expect(notice).toHaveAttribute('data-tone', 'info');
    await expect(notice).toHaveText(
      '예매 조건이 모두 채워졌습니다. 오픈 시각이 되면 예매가 열립니다.'
    );
    await expect(page.getByLabel('취소·환불 규정')).toHaveValue(
      /^공연일 10일 전까지: 전액 환불\n7일 전까지/
    );
    // 새로고침해도 저장 값이 남는다
    await page.reload();
    await expect(page.getByLabel('계좌번호')).toHaveValue(FAKE_ACCOUNT);
    await expect(page.getByLabel('문의처')).toHaveValue(
      'https://fixture.example/chat'
    );
  });

  test('회차를 추가·수정하고, 같은 날짜·시각이면 409 문구를 다이얼로그 안에 보인다', async ({
    page,
    request,
    isMobile,
  }) => {
    // Arrange
    const perf = await createPerformance(request, `${PREFIX}회차 추가`);
    await putPolicy(request, perf.id, FULL_POLICY);
    await createTier(request, perf.id, '일반');
    const date = kstDate(40);
    await gotoShows(page, perf.id);
    // Act — 빈 값 제출
    await page.getByRole('button', { name: '회차 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '회차 추가' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert
    await expect(dialog.getByText('날짜를 입력해주세요')).toBeVisible();
    await expect(dialog.getByText('시작 시각을 입력해주세요')).toBeVisible();
    // Assert — 회차에는 가격 칸이 없다(가격은 공연 단위 등급)
    await expect(dialog.getByLabel(/가격/)).toHaveCount(0);
    // Act — 오픈 시각 없이 추가
    await dialog.getByLabel(/^날짜/).fill(date);
    await dialog.getByLabel(/^시작 시각/).fill('14:00');
    await dialog.getByLabel('장소').fill(`${PREFIX}소극장`);
    await dialog.getByLabel('좌석 수').fill('50');
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert — 준비 중 + 빈 칸, 알림에 회차 개수
    await expect(dialog).toBeHidden();
    const entry = entryOf(page, isMobile, date, '14:00');
    await expect(entry).toContainText('준비 중');
    await expect(entry).toContainText('빈 칸: 오픈 시각');
    await expect(noticeOf(page)).toHaveText(
      '예매를 열려면 다음 항목을 채워주세요: 예매 오픈 시각(회차 1개)'
    );

    // Act — 수정: 오픈 시각 채우기
    await entry
      .getByRole('button', { name: `회차 수정 ${dateLabel(date)} 14:00` })
      .click();
    const edit = page.getByRole('dialog', { name: '회차 수정' });
    await expect(edit.getByLabel('좌석 수')).toHaveValue('50');
    await edit.getByLabel('예매 오픈 날짜').fill(kstDate(-1));
    await edit.getByLabel('예매 오픈 시각').fill('10:00');
    await edit.getByRole('button', { name: '저장' }).click();
    // Assert
    await expect(edit).toBeHidden();
    await expect(page.getByText('저장되었습니다')).toBeVisible();
    await expect(entry).toContainText('열림');
    await expect(noticeOf(page)).toHaveAttribute('data-tone', 'info');

    // Act — 같은 날짜·시각 회차 추가
    await page.getByRole('button', { name: '회차 추가' }).click();
    const again = page.getByRole('dialog', { name: '회차 추가' });
    await again.getByLabel(/^날짜/).fill(date);
    await again.getByLabel(/^시작 시각/).fill('14:00');
    await again.getByRole('button', { name: '추가' }).click();
    // Assert
    await expect(
      again.getByText('같은 날짜·시각의 회차가 이미 있습니다.')
    ).toBeVisible();
    await expect(again.getByLabel(/^날짜/)).toHaveValue(date);
  });

  test('예매보다 좌석을 줄이면 409, 예매 있는 회차는 삭제 409, 없는 회차는 삭제된다', async ({
    page,
    request,
    isMobile,
  }) => {
    // Arrange
    const perf = await createPerformance(request, `${PREFIX}좌석 삭제`);
    await putPolicy(request, perf.id, FULL_POLICY);
    const date = kstDate(50);
    const booked = await createShow(request, perf.id, readyShow(date, '14:00'));
    await createShow(request, perf.id, readyShow(date, '18:00'));
    const tier = await createTier(request, perf.id, '일반');
    await reserve(request, booked.id, tier.id, 4);
    await gotoShows(page, perf.id);
    const bookedEntry = entryOf(page, isMobile, date, '14:00');
    await expect(bookedEntry).toContainText(isMobile ? '예매 4' : '4 / 0 / 6');
    // Act — 좌석 축소
    await bookedEntry
      .getByRole('button', { name: `회차 수정 ${dateLabel(date)} 14:00` })
      .click();
    const edit = page.getByRole('dialog', { name: '회차 수정' });
    await edit.getByLabel('좌석 수').fill('2');
    await edit.getByRole('button', { name: '저장' }).click();
    // Assert
    await expect(
      edit.getByText('좌석 수를 이미 예매된 4석보다 적게 줄일 수 없습니다.')
    ).toBeVisible();
    await edit.getByRole('button', { name: '취소' }).click();

    // Act — 예매 있는 회차 삭제
    await bookedEntry
      .getByRole('button', { name: `회차 삭제 ${dateLabel(date)} 14:00` })
      .click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText('회차를 삭제하시겠습니까?');
    await expect(confirm).toContainText(`${dateLabel(date)} 14:00`);
    await confirm.getByRole('button', { name: '삭제' }).click();
    // Assert
    await expect(
      page.getByText('예매가 있는 회차는 삭제할 수 없습니다.')
    ).toBeVisible();
    await expect(confirm).toBeHidden();
    await expect(bookedEntry).toBeVisible();

    // Act — 예매 없는 회차 삭제
    const freeEntry = entryOf(page, isMobile, date, '18:00');
    await freeEntry
      .getByRole('button', { name: `회차 삭제 ${dateLabel(date)} 18:00` })
      .click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '삭제' })
      .click();
    // Assert
    await expect(freeEntry).toHaveCount(0);
    await expect(bookedEntry).toBeVisible();
  });

  test('예매 중지 스위치를 켜면 바로 저장되고 마감으로 보인다', async ({
    page,
    request,
    isMobile,
  }) => {
    // Arrange
    const perf = await createPerformance(request, `${PREFIX}예매 중지`);
    await putPolicy(request, perf.id, FULL_POLICY);
    const date = kstDate(60);
    const show = await createShow(request, perf.id, readyShow(date, '19:30'));
    await createTier(request, perf.id, '일반');
    await gotoShows(page, perf.id);
    const entry = entryOf(page, isMobile, date, '19:30');
    await expect(entry).toContainText('열림');
    const toggle = entry.getByRole('switch', {
      name: `예매 중지 ${dateLabel(date)} 19:30`,
    });
    // Act
    await toggle.click();
    // Assert
    await expect(entry).toContainText('마감');
    await expect(toggle).toBeChecked();
    const shows = await adminApi<{
      items: { id: string; bookingEnabled: boolean }[];
    }>(request, 'GET', `/admin/performances/${perf.id}/shows`);
    expect(shows.items.find((s) => s.id === show.id)?.bookingEnabled).toBe(
      false
    );
    // Act — 다시 끄기
    await toggle.click();
    // Assert
    await expect(entry).toContainText('열림');
    await expect(toggle).not.toBeChecked();
  });

  test('가격 등급을 추가하면(0원은 막음) 누구나 등급 경고가 사라지고, 순서·사용 스위치를 바로 저장한다', async ({
    page,
    request,
    isMobile,
  }) => {
    // Arrange — 회차·설정은 다 채웠고 등급만 없다
    const perf = await createPerformance(request, `${PREFIX}등급 추가`);
    await putPolicy(request, perf.id, FULL_POLICY);
    await createShow(request, perf.id, readyShow(kstDate(45), '15:00'));
    await gotoShows(page, perf.id);
    await expect(noticeOf(page)).toHaveText(
      '예매를 열려면 다음 항목을 채워주세요: 누구나 고를 수 있는 가격 등급'
    );
    await expect(page.getByText('등록된 가격 등급이 없습니다')).toBeVisible();
    // Act — 0원 등급
    await page.getByRole('button', { name: '가격 등급 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '가격 등급 추가' });
    await dialog.getByLabel(/^이름/).fill(`${PREFIX}일반`);
    await dialog.getByLabel(/^가격/).fill('0');
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert
    await expect(dialog.getByText('입력값을 확인해주세요.')).toBeVisible();
    // Act — 1원
    await dialog.getByLabel(/^가격/).fill('1');
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert
    await expect(dialog).toBeHidden();
    const general = tierEntryOf(page, isMobile, '일반');
    await expect(general).toContainText('1원');
    await expect(general).toContainText('누구나');
    await expect(noticeOf(page)).toHaveAttribute('data-tone', 'info');

    // Act — 링크 전용 등급 추가
    await page.getByRole('button', { name: '가격 등급 추가' }).click();
    const second = page.getByRole('dialog', { name: '가격 등급 추가' });
    await second.getByLabel(/^이름/).fill(`${PREFIX}스태프`);
    await second.getByLabel(/^가격/).fill('10000');
    await second.getByRole('radio', { name: '링크로 들어온 사람만' }).check();
    await second.getByRole('button', { name: '추가' }).click();
    // Assert
    await expect(second).toBeHidden();
    const staff = tierEntryOf(page, isMobile, '스태프');
    await expect(staff).toContainText('링크 전용');
    await expect(staff).toContainText('10,000원');

    // Act — 순서: 스태프를 위로
    await staff
      .getByRole('button', { name: `위로 이동 — ${PREFIX}스태프` })
      .click();
    // Assert
    await expect
      .poll(async () => (await listTiers(request, perf.id))[0]?.name)
      .toBe(`${PREFIX}스태프`);
    // Act — 사용 끄기
    await staff.getByRole('switch', { name: `사용 — ${PREFIX}스태프` }).click();
    // Assert
    await expect
      .poll(
        async () =>
          (await listTiers(request, perf.id)).find(
            (t) => t.name === `${PREFIX}스태프`
          )?.isActive
      )
      .toBe(false);
  });

  test('링크 전용 등급만 있으면 링크 안내를 보이고, 등급 링크·단원 초대 링크를 복사하고 재발급한다', async ({
    page,
    request,
    isMobile,
  }) => {
    // Arrange
    const perf = await createPerformance(request, `${PREFIX}등급 링크`);
    await putPolicy(request, perf.id, FULL_POLICY);
    await createShow(request, perf.id, readyShow(kstDate(55), '16:00'));
    const tier = await createTier(request, perf.id, '스태프', 'LINK_ONLY');
    const member = await adminApi<{ id: string }>(
      request,
      'POST',
      '/admin/members',
      { name: `${PREFIX}단원`, type: 'GENERAL', phone: null }
    );
    await gotoShows(page, perf.id);
    const origin = new URL(page.url()).origin;
    const linkBase = `${origin}/api/backend/v1/__mock/client/works/${perf.id}/book?tier=`;
    const readClipboard = () =>
      page.evaluate(() => navigator.clipboard.readText());
    // Assert — 링크 전용만 → 안내(info)
    await expect(noticeOf(page)).toHaveText(
      '링크로 들어온 사람만 예매할 수 있습니다.'
    );
    const entry = tierEntryOf(page, isMobile, '스태프');
    // Act — 등급 링크 복사
    await entry
      .getByRole('button', { name: `링크 복사 — ${PREFIX}스태프` })
      .click();
    await page.getByRole('menuitem', { name: '등급 링크 복사' }).click();
    // Assert
    await expect(page.getByText('복사되었습니다').first()).toBeVisible();
    expect(await readClipboard()).toBe(`${linkBase}${tier.linkToken}`);

    // Act — 등급 링크 + 단원 초대 링크(코드 없는 단원 → 발급)
    await entry
      .getByRole('button', { name: `링크 복사 — ${PREFIX}스태프` })
      .click();
    await page
      .getByRole('menuitem', { name: /등급 링크 \+ 단원 초대 링크/ })
      .click();
    const pick = page.getByRole('dialog', {
      name: `등급 링크 + 단원 초대 링크 — ${PREFIX}스태프`,
    });
    await pick.getByRole('combobox').fill(`${PREFIX}단`);
    await page.getByRole('option', { name: `${PREFIX}단원` }).click();
    await pick.getByRole('button', { name: '복사' }).click();
    // Assert
    await expect(pick).toBeHidden();
    const codes = await adminApi<{
      items: { memberId: string; inviteCode: string | null }[];
    }>(request, 'GET', '/admin/members/invite-codes');
    const code = codes.items.find((m) => m.memberId === member.id)?.inviteCode;
    expect(code).toBeTruthy();
    expect(await readClipboard()).toBe(
      `${linkBase}${tier.linkToken}&ref=${code}`
    );

    // Act — 재발급
    await entry
      .getByRole('button', { name: `링크 재발급 — ${PREFIX}스태프` })
      .click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText(
      '이전 링크는 더 이상 쓸 수 없습니다. 재발급하시겠습니까?'
    );
    await expect(confirm).toContainText(`${PREFIX}스태프 등급 링크`);
    await confirm.getByRole('button', { name: '재발급' }).click();
    // Assert
    await expect(confirm).toBeHidden();
    await expect
      .poll(async () => (await listTiers(request, perf.id))[0]?.linkToken)
      .not.toBe(tier.linkToken);
  });

  test('예매에 쓰인 등급은 삭제할 수 없고, 안 쓰인 등급은 확인 후 삭제된다', async ({
    page,
    request,
    isMobile,
  }) => {
    // Arrange
    const perf = await createPerformance(request, `${PREFIX}등급 삭제`);
    await putPolicy(request, perf.id, FULL_POLICY);
    const show = await createShow(
      request,
      perf.id,
      readyShow(kstDate(65), '17:00')
    );
    const used = await createTier(request, perf.id, '일반');
    await createTier(request, perf.id, '학생', 'PUBLIC', 10000);
    await reserve(request, show.id, used.id, 2);
    await gotoShows(page, perf.id);
    // Assert — 쓰인 등급
    const usedEntry = tierEntryOf(page, isMobile, '일반');
    await expect(usedEntry).toContainText('2매');
    await expect(
      usedEntry.getByRole('button', { name: `삭제 — ${PREFIX}일반` })
    ).toBeDisabled();
    // Act — 안 쓰인 등급 삭제
    const freeEntry = tierEntryOf(page, isMobile, '학생');
    await freeEntry
      .getByRole('button', { name: `삭제 — ${PREFIX}학생` })
      .click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText('가격 등급을 삭제하시겠습니까?');
    await confirm.getByRole('button', { name: '삭제' }).click();
    // Assert
    await expect(freeEntry).toHaveCount(0);
    await expect(usedEntry).toBeVisible();
  });

  test('탭으로 기본 정보 ↔ 회차·예매를 오가고, 없는 공연은 상태 카드를 보인다', async ({
    page,
    request,
  }) => {
    // Arrange
    const title = `${PREFIX}탭 이동`;
    const perf = await createPerformance(request, title);
    await page.goto(`/performances/${perf.id}`);
    // Act
    await page.getByRole('tab', { name: '회차·예매' }).click();
    // Assert
    await expect(page).toHaveURL(new RegExp(`/performances/${perf.id}/shows$`));
    await expect(
      page.getByRole('heading', { name: '예매 설정' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: title })
    ).toBeVisible();
    // Act
    await page.getByRole('tab', { name: '기본 정보' }).click();
    // Assert
    await expect(page).toHaveURL(new RegExp(`/performances/${perf.id}$`));
    // Act — 없는 공연
    await page.goto('/performances/00000000-0000-0000-0000-000000000000/shows');
    // Assert
    await expect(page.getByText('공연을 찾을 수 없습니다')).toBeVisible();
  });
});
