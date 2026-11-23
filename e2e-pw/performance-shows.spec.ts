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

/** (U41) 기본가·SAM 관계자가 저장 — 역할 등급 2개(기본가 15,000 · SAM 10,000) */
async function putPrices(
  request: APIRequestContext,
  performanceId: string
): Promise<Tier> {
  await adminApi(
    request,
    'PUT',
    `/admin/performances/${performanceId}/inviter-prices`,
    { base: 15000, samRelated: 10000 }
  );
  const tiers = await listTiers(request, performanceId);
  return tiers.find((t) => t.name === '기본가') as Tier;
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
    await putPrices(request, perf.id);
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
    await page
      .getByRole('button', { name: '저장', exact: true })
      .first()
      .click();
    // Assert — 저장하지 않고 칸 아래 문구
    await expect(page.getByText('입력값을 확인해주세요.')).toHaveCount(3);
    await expect(notice).toHaveAttribute('data-tone', 'warning');
    // Act — 고쳐서 저장
    await page.getByLabel('계좌번호').fill(FAKE_ACCOUNT);
    await page.getByLabel('1인 최대 매수').fill('4');
    await page.getByLabel('문의처').fill('https://fixture.example/chat');
    await page
      .getByRole('button', { name: '저장', exact: true })
      .first()
      .click();
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
    await putPrices(request, perf.id);
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
    const tier = await putPrices(request, perf.id);
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
    await putPrices(request, perf.id);
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
