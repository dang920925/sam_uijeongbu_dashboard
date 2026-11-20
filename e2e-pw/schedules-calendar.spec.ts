// ----------------------------------------------------------------------
// SCR-D08 일정 관리 — U23 보강(월·주·목록, xs 아젠다) · U29(일정 취소·해제).
// develop FN-15 "U23 보강" E-11~E-16 · E-6·E-7·E-9 · §13 C-8(D08 부분). 픽스처 접두사 fixture-u23-.
// 주 보기는 md↑ 만(desktop), 아젠다·아래 시트는 xs 만(mobile).
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const P = 'fixture-u23-';

interface ScheduleItem {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  status: string;
  cancelReason: string | null;
  observationClosed: boolean | null;
}

type Request = Parameters<typeof adminApi>[0];

async function createSchedule(
  request: Request,
  body: Record<string, unknown>
): Promise<ScheduleItem> {
  return adminApi<ScheduleItem>(request, 'POST', '/admin/schedules', {
    type: 'PRACTICE',
    ...body,
  });
}

async function listSchedules(request: Request) {
  return adminApi<{ items: ScheduleItem[] }>(
    request,
    'GET',
    '/admin/schedules'
  );
}

/** 지금 KST 의 연·월 */
function nowKst() {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/** 이동 후 하이드레이션·첫 조회가 끝날 때까지 기다린다(그 전 클릭은 무시된다) */
async function open(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

function viewSwitch(page: Page) {
  return page.getByRole('group', { name: '보기 방식' });
}

function rangeTitle(page: Page) {
  return page.locator('h2[aria-live="polite"]');
}

/** 월 칩(desktop) 또는 아젠다 행(mobile) — 이름(aria) 에 제목이 든 버튼 */
function eventButton(page: Page, title: string) {
  return page.getByRole('button', { name: new RegExp(title) });
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe('SCR-D08 일정 — 월·주·목록(U23 보강)', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('E-11 월 칸에 "HH:mm 제목" 칩, lg 4건은 칩 3 + "+1개 더" → 4건 팝오버', async ({
    page,
    request,
    isMobile,
  }) => {
    test.skip(isMobile, '월 격자는 md↑(xs 는 아젠다 — E-15)');
    for (const [i, time] of ['09:00', '10:00', '14:00', '20:00'].entries())
      await createSchedule(request, {
        title: `${P}칩${i + 1}`,
        type: i === 2 ? 'SHOW' : 'PRACTICE',
        startAt: `2026-12-03T${time}:00+09:00`,
      });

    await open(page, '/schedules?date=2026-12-03');
    await expect(
      viewSwitch(page).getByRole('button', { name: '월' })
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(rangeTitle(page)).toHaveText('2026년 12월');
    const cell = page.getByRole('gridcell', {
      name: '2026년 12월 3일, 일정 4건',
    });
    await expect(cell.getByRole('button', { name: new RegExp(P) })).toHaveCount(
      3
    );
    await expect(eventButton(page, `${P}칩1`)).toContainText(`09:00${P}칩1`);
    await cell.getByRole('button', { name: '+1개 더' }).click();
    const more = page.getByRole('dialog', { name: '12월 3일 목요일' });
    await expect(more.getByRole('button', { name: new RegExp(P) })).toHaveCount(
      4
    );
    // 더보기 안 칩 → 상세
    await more.getByRole('button', { name: new RegExp(`${P}칩4`) }).click();
    const detail = page.getByRole('dialog', { name: `${P}칩4` });
    await expect(detail).toContainText('12월 3일 (목) 20:00');
    await page.keyboard.press('Escape');
    await expect(detail).toBeHidden();
  });

  test('월 빈 자리 → 그 날 00:00 추가(J-19), 머리 버튼은 빈 값(J-63), 저장하면 그 달로 이동(J-23)', async ({
    page,
    request,
    isMobile,
  }) => {
    test.skip(isMobile, '월 격자는 md↑');
    await open(page, '/schedules?date=2026-12-03');
    await page.getByRole('button', { name: '일정 추가', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '일정 추가' });
    await expect(dialog.getByLabel('시작 시간')).toHaveValue('');
    await dialog.getByRole('button', { name: '닫기' }).click();

    await page.getByRole('gridcell', { name: '2026년 12월 10일' }).click();
    await expect(dialog.getByLabel('시작 시간')).toHaveValue(
      '2026-12-10T00:00'
    );
    await dialog.getByLabel('제목').fill(`${P}다음 달`);
    await dialog.getByLabel('시작 시간').fill('2027-01-05T10:00');
    await dialog.getByRole('button', { name: '추가' }).click();

    await expect(page.getByText('저장되었습니다')).toBeVisible();
    await expect(rangeTitle(page)).toHaveText('2027년 1월');
    await expect(eventButton(page, `${P}다음 달`)).toBeVisible();
    const { items } = await listSchedules(request);
    expect(items[0].startAt).toBe('2027-01-05T01:00:00.000Z');
  });

  test('E-12 주 보기 7열 + 시간 축, 블록 → 상세 → 수정(KST) → 저장 → 위치 갱신, 삭제 → 사라짐', async ({
    page,
    request,
    isMobile,
  }) => {
    test.skip(isMobile, '주 보기는 md↑');
    await createSchedule(request, {
      title: `${P}주 연습`,
      startAt: '2026-12-08T19:00:00+09:00',
      endAt: '2026-12-08T21:00:00+09:00',
      location: `${P}연습실`,
    });
    await open(page, '/schedules?date=2026-12-08');
    await viewSwitch(page).getByRole('button', { name: '주' }).click();
    await expect(page).toHaveURL(/view=week/);
    await expect(rangeTitle(page)).toHaveText('2026년 12월 6일 – 12일');
    await expect(
      page.getByRole('button', { name: /^12월 \d+일 00:00 일정 추가$/ })
    ).toHaveCount(7);

    const block = eventButton(page, `${P}주 연습`);
    await expect(block).toHaveAccessibleName(
      `연습 ${P}주 연습, 12월 8일 19:00 – 21:00`
    );
    await block.click();
    const detail = page.getByRole('dialog', { name: `${P}주 연습` });
    await expect(detail).toContainText(`${P}연습실`);
    await detail.getByRole('button', { name: '수정' }).click();
    const form = page.getByRole('dialog', { name: '일정 수정' });
    await expect(form.getByLabel('시작 시간')).toHaveValue('2026-12-08T19:00');
    await form.getByLabel('시작 시간').fill('2026-12-09T10:00');
    await form.getByLabel('종료 시간').fill('2026-12-09T11:30');
    await form.getByRole('button', { name: '저장' }).click();
    await expect(form).toBeHidden();
    await expect(block).toHaveAccessibleName(
      `연습 ${P}주 연습, 12월 9일 10:00 – 11:30`
    );

    await block.click();
    await page
      .getByRole('dialog', { name: `${P}주 연습` })
      .getByRole('button', { name: '삭제' })
      .click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText('일정을 삭제하시겠습니까?');
    await confirm.getByRole('button', { name: '삭제' }).click();
    await expect(block).toHaveCount(0);
  });

  test('E-13 주 보기 빈 칸 화 19:30 → 시작 19:30·종료 20:30, 저장 요청은 +09:00', async ({
    page,
    request,
    isMobile,
  }) => {
    test.skip(isMobile, '주 보기는 md↑');
    // 하이드레이션 뒤(클라이언트 조회가 끝난 뒤)에 누른다
    const loaded = page.waitForResponse(/\/admin\/schedules\?.*year=2026/);
    await open(page, '/schedules?view=week&date=2026-12-08');
    await loaded;
    await page
      .getByRole('button', { name: '12월 8일 19:30 일정 추가', exact: true })
      .click();
    const dialog = page.getByRole('dialog', { name: '일정 추가' });
    await expect(dialog.getByLabel('시작 시간')).toHaveValue(
      '2026-12-08T19:30'
    );
    await expect(dialog.getByLabel('종료 시간')).toHaveValue(
      '2026-12-08T20:30'
    );
    await dialog.getByLabel('제목').fill(`${P}화 추가`);
    const posted = page.waitForRequest(
      (r) => r.method() === 'POST' && r.url().endsWith('/admin/schedules')
    );
    await dialog.getByRole('button', { name: '추가' }).click();
    expect((await posted).postDataJSON()).toMatchObject({
      startAt: '2026-12-08T19:30:00+09:00',
      endAt: '2026-12-08T20:30:00+09:00',
    });
    await expect(eventButton(page, `${P}화 추가`)).toBeVisible();
    const { items } = await listSchedules(request);
    expect(items[0].startAt).toBe('2026-12-08T10:30:00.000Z');
  });

  test('E-14 "오늘"은 오늘이 든 달/주로, ‹ › 는 보기에 따라 한 달/한 주(12월 → 다음 해 1월 요청)', async ({
    page,
    isMobile,
  }) => {
    await open(page, '/schedules?date=2026-12-15');
    await expect(rangeTitle(page)).toHaveText('2026년 12월');
    // 1월 격자(12/27~2/6)에서 처음 받는 달 = 2027년 2월
    const nextYear = page.waitForRequest(
      (r) => /year=2027/.test(r.url()) && /month=2(&|$)/.test(r.url())
    );
    await page.getByRole('button', { name: '다음', exact: true }).click();
    await expect(rangeTitle(page)).toHaveText('2027년 1월');
    await nextYear;
    await page.getByRole('button', { name: '이전', exact: true }).click();
    await page.getByRole('button', { name: '이전', exact: true }).click();
    await expect(rangeTitle(page)).toHaveText('2026년 11월');
    await open(page, '/schedules?date=2027-05-02');
    await page.getByRole('button', { name: '오늘', exact: true }).click();
    const now = nowKst();
    await expect(rangeTitle(page)).toHaveText(`${now.year}년 ${now.month}월`);
    if (isMobile) return;

    await open(page, '/schedules?view=week&date=2026-12-08');
    await expect(rangeTitle(page)).toHaveText('2026년 12월 6일 – 12일');
    await page.getByRole('button', { name: '다음', exact: true }).click();
    await expect(rangeTitle(page)).toHaveText('2026년 12월 13일 – 19일');
    await page.getByRole('button', { name: '이전', exact: true }).click();
    await page.getByRole('button', { name: '이전', exact: true }).click();
    await expect(rangeTitle(page)).toHaveText('2026년 11월 29일 – 12월 5일');
  });

  test('E-15 mobile — 보기 전환에 "주" 없음, 월 = 아젠다, 행 → 아래 시트 상세·수정·삭제, 가로 스크롤 없음', async ({
    page,
    request,
    isMobile,
  }) => {
    test.skip(!isMobile, '아젠다·시트는 xs');
    await createSchedule(request, {
      title: `${P}아젠다 연습`,
      startAt: '2026-12-03T20:00:00+09:00',
      endAt: '2026-12-03T22:00:00+09:00',
    });
    await createSchedule(request, {
      title: `${P}아젠다 공연`,
      type: 'SHOW',
      startAt: '2026-12-12T14:00:00+09:00',
    });
    await open(page, '/schedules?view=week&date=2026-12-03');
    await expect(viewSwitch(page).getByRole('button')).toHaveText([
      '월',
      '목록',
    ]);
    await expect(
      viewSwitch(page).getByRole('button', { name: '월' })
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('grid')).toHaveCount(0);
    const row = eventButton(page, `${P}아젠다 연습`);
    await expect(row).toContainText('20:00 – 22:00');
    const box = await row.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalScroll(page);

    await row.click();
    const sheet = page.getByRole('dialog', { name: `${P}아젠다 연습` });
    await expect(sheet).toContainText('12월 3일 (목) 20:00 – 22:00');
    await sheet.getByRole('button', { name: '수정' }).click();
    const form = page.getByRole('dialog', { name: '일정 수정' });
    await expect(form.getByLabel('시작 시간')).toHaveValue('2026-12-03T20:00');
    await form.getByRole('button', { name: '닫기' }).click();

    await eventButton(page, `${P}아젠다 공연`).click();
    await page
      .getByRole('dialog', { name: `${P}아젠다 공연` })
      .getByRole('button', { name: '삭제' })
      .click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '삭제' })
      .click();
    await expect(eventButton(page, `${P}아젠다 공연`)).toHaveCount(0);

    await open(page, '/schedules?date=2027-06-01');
    await expect(page.getByText('이 달에는 일정이 없습니다')).toBeVisible();
  });

  test('E-6·E-16 "목록" 전환은 현행 표/카드, ?view=list 로 새로고침해도 목록', async ({
    page,
    request,
  }) => {
    await createSchedule(request, {
      title: `${P}목록 일정`,
      startAt: '2026-12-01T10:00:00+09:00',
    });
    await open(page, '/schedules');
    await viewSwitch(page).getByRole('button', { name: '목록' }).click();
    await expect(page).toHaveURL(/view=list/);
    await expect(
      page.getByText('2026.12.01 10:00').filter({ visible: true })
    ).toBeVisible();
    await expect(rangeTitle(page)).toHaveCount(0);
    await page.reload();
    await expect(
      viewSwitch(page).getByRole('button', { name: '목록' })
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByText('2026.12.01 10:00').filter({ visible: true })
    ).toBeVisible();
  });

  test('E-7 필터 "공연"은 캘린더에도 공연만, 요청에 type=SHOW', async ({
    page,
    request,
  }) => {
    await createSchedule(request, {
      title: `${P}필터 연습`,
      startAt: '2026-12-04T10:00:00+09:00',
    });
    await createSchedule(request, {
      title: `${P}필터 공연`,
      type: 'SHOW',
      startAt: '2026-12-05T10:00:00+09:00',
    });
    await open(page, '/schedules?date=2026-12-04');
    await expect(eventButton(page, `${P}필터 연습`)).toBeVisible();
    const showRequest = page.waitForRequest(
      (r) => /year=2026/.test(r.url()) && /type=SHOW/.test(r.url())
    );
    await page
      .getByRole('group', { name: '타입' })
      .getByRole('button', { name: '공연' })
      .click();
    await showRequest;
    await expect(eventButton(page, `${P}필터 공연`)).toBeVisible();
    await expect(eventButton(page, `${P}필터 연습`)).toHaveCount(0);
  });

  test('E-9 월 조회 503 이면 스낵바 + "다시 시도" → 다시 받는다', async ({
    page,
    request,
  }) => {
    await createSchedule(request, {
      title: `${P}재시도`,
      startAt: '2026-12-04T10:00:00+09:00',
    });
    let failing = true;
    await page.route(/\/admin\/schedules\?.*year=/, (route) =>
      failing
        ? route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 503,
              code: 'COMMON_005',
              message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            }),
          })
        : route.continue()
    );
    await open(page, '/schedules?date=2026-12-04');
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(/잠시 후 다시 시도해주세요/).first()
    ).toBeVisible();
    failing = false;
    await page.getByRole('button', { name: '다시 시도' }).click();
    await expect(eventButton(page, `${P}재시도`)).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toHaveCount(
      0
    );
  });
});

test.describe('SCR-D08 일정 취소(U29)', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('C-8 상세 "일정 취소" → 참관 신청 경고·건수 → 저장 → 칩 취소 표시 → "취소 해제"로 원래대로', async ({
    page,
    request,
  }) => {
    const perf = await adminApi<{ id: string; title: string }>(
      request,
      'POST',
      '/admin/performances',
      { title: `${P}HADESTOWN`, type: 'MUSICAL', status: 'ONGOING' }
    );
    const schedule = await createSchedule(request, {
      title: `${P}HADESTOWN 연습`,
      startAt: '2026-12-13T14:00:00+09:00',
      endAt: '2026-12-13T17:00:00+09:00',
      performanceId: perf.id,
    });
    await request.post('/api/backend/v1/__mock/seed/applications', {
      data: [1, 2].map((n) => ({
        applicantName: `${P}신청${n}`,
        phone: '01000000000',
        preferredDate: '2026-12-13',
        performance: { id: perf.id, title: perf.title },
      })),
    });

    await open(page, '/schedules?date=2026-12-13');
    const event = eventButton(page, `${P}HADESTOWN 연습`);
    await event.click();
    const detail = page.getByRole('dialog', { name: `${P}HADESTOWN 연습` });
    await expect(detail).toContainText(`${P}HADESTOWN`);
    await detail.getByRole('button', { name: '일정 취소' }).click();

    const dialog = page.getByRole('dialog', { name: '일정 취소' });
    await expect(dialog).toContainText('12월 13일 (일) 14:00 – 17:00');
    await expect(dialog.getByRole('status')).toContainText(
      '이 날짜에 참관 신청 2건이 있습니다. 신청서 관리에서 연락해주세요.'
    );
    await expect(dialog.getByRole('status')).toContainText(`${P}신청2`);
    const observation = dialog.getByRole('checkbox', {
      name: '이 날 참관 신청 받지 않음',
    });
    await expect(observation).toBeChecked();
    await dialog.getByRole('button', { name: '취소 처리' }).click();
    await expect(dialog.getByText('사유를 입력해주세요')).toBeVisible();
    await dialog.getByLabel('사유').fill('공연 단체관람');
    await expect(dialog).toContainText('7/50');
    await dialog.getByRole('button', { name: '취소 처리' }).click();

    await expect(page.getByText('저장되었습니다')).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(event).toHaveAccessibleName(/^취소된 일정, 연습 /);
    await expect(event).toContainText('취소');
    const saved = (await listSchedules(request)).items.find(
      (s) => s.id === schedule.id
    );
    expect(saved).toMatchObject({
      status: 'CANCELLED',
      cancelReason: '공연 단체관람',
      observationClosed: true,
    });

    await event.click();
    const cancelled = page.getByRole('dialog', {
      name: `${P}HADESTOWN 연습`,
    });
    await expect(cancelled).toContainText('취소 · 공연 단체관람');
    await expect(cancelled).toContainText('참관 받지 않음');
    await cancelled.getByRole('button', { name: '취소 해제' }).click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText('취소를 해제하시겠습니까?');
    await confirm.getByRole('button', { name: '취소 해제' }).click();
    await expect(event).toHaveAccessibleName(/^연습 /);
    expect(
      (await listSchedules(request)).items.find((s) => s.id === schedule.id)
    ).toMatchObject({ status: 'ACTIVE', cancelReason: null });
  });

  test('이벤트 유형은 참관 체크가 없고, 목록 행에서 취소하면 행에 취소 표시가 보인다', async ({
    page,
    request,
  }) => {
    await createSchedule(request, {
      title: `${P}행사`,
      type: 'EVENT',
      startAt: '2026-12-20T15:00:00+09:00',
    });
    await open(page, '/schedules?view=list');
    await page.getByRole('button', { name: '일정 취소' }).click();
    const dialog = page.getByRole('dialog', { name: '일정 취소' });
    await expect(dialog.getByRole('checkbox')).toHaveCount(0);
    await expect(dialog.getByRole('status')).toHaveCount(0);
    await dialog.getByLabel('사유').fill('우천');
    await dialog.getByRole('button', { name: '취소 처리' }).click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByText('취소 · 우천').filter({ visible: true })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '취소 해제' })).toBeVisible();
    const [item] = (await listSchedules(request)).items;
    expect(item).toMatchObject({
      status: 'CANCELLED',
      observationClosed: false,
    });
  });

  test('SCH_003 — 다른 곳에서 먼저 취소됐으면 오류 스낵바 + 다시 불러온 취소 표시', async ({
    page,
    request,
  }) => {
    const schedule = await createSchedule(request, {
      title: `${P}충돌`,
      startAt: '2026-12-21T19:00:00+09:00',
    });
    await open(page, '/schedules?view=list');
    await page.getByRole('button', { name: '일정 취소' }).click();
    const dialog = page.getByRole('dialog', { name: '일정 취소' });
    await dialog.getByLabel('사유').fill('먼저 취소');
    await adminApi(request, 'POST', `/admin/schedules/${schedule.id}/cancel`, {
      reason: '다른 관리자',
      observationClosed: true,
    });
    await dialog.getByRole('button', { name: '취소 처리' }).click();
    await expect(page.getByText('이미 취소된 일정입니다.')).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByText('취소 · 다른 관리자').filter({ visible: true })
    ).toBeVisible();
  });
});
