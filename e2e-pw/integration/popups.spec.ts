// ----------------------------------------------------------------------
// 연동 E2E — SCR-D10 팝업 관리(FN-17·FN-18) × 실서버(/api/v1/admin/popups · 공개 GET /api/v1/popups/active).
// - 현재 상태: 빈 DB → "등록된 팝업이 없습니다", 공개 활성 팝업 null.
// - 채운 상태: 이미지 필수(UPL_003 문구)·종료<시작(POP_002)·https 링크만 → 이미지 업로드(POPUP) 미리보기·목록 썸네일이
//   실제로 로드 → 추가 후 기간 상태(진행중·예정·종료)·활성, 공개 활성 팝업 응답 반영. 기간 겹침은 막지 않고 경고(서버
//   overlapsActive), 비활성으로 바꾸면 공개 응답에서 빠짐. 서버도 POP_002·UPL_003 거절, 다른 곳에서 삭제된 팝업 저장 404 POP_001.
// 픽스처: 팝업 linkUrl = `https://example.com/${fixturePrefix('popups')}...`(정리 SQL 이 linkUrl 로 지움) — 화면에서 만든 것도 같은 규칙.
// ----------------------------------------------------------------------
import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
  INT_API_BASE_URL,
  TINY_PNG,
  uploadFixtureImage,
} from '@/e2e-pw/integration/support/integration-api';

const PREFIX = fixturePrefix('popups');
const LINK = (slug: string) => `https://example.com/${PREFIX}${slug}`;
const EMPTY = '등록된 팝업이 없습니다';
const OVERLAP = '다른 팝업과 노출 기간이 겹칩니다';

interface AdminPopupItem {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  overlapsActive: boolean;
}

/** 오늘(KST)에서 days 만큼 옮긴 'YYYY-MM-DD' */
function kstDate(days: number): string {
  const time = Date.now() + days * 24 * 60 * 60 * 1000;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(time)
  );
}

const period = (start: string, end: string) =>
  `${start.replaceAll('-', '.')} ~ ${end.replaceAll('-', '.')}`;

async function expectImageLoaded(image: Locator) {
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((el) => {
        const img = el as HTMLImageElement;
        return img.complete ? img.naturalWidth : 0;
      })
    )
    .toBeGreaterThan(0);
}

function rowOf(page: Page, text: string) {
  return page
    .getByRole('table', { name: '팝업 관리' })
    .getByRole('row')
    .filter({ hasText: text });
}

/** 홈페이지가 부르는 공개 활성 팝업(인증 없음) */
async function activePopup(): Promise<{
  popup: Omit<AdminPopupItem, 'isActive' | 'overlapsActive'> | null;
}> {
  const response = await fetch(`${INT_API_BASE_URL}/api/v1/popups/active`);
  expect(response.status).toBe(200);
  return response.json() as Promise<{
    popup: Omit<AdminPopupItem, 'isActive' | 'overlapsActive'> | null;
  }>;
}

async function createPopup(body: Record<string, unknown>) {
  return adminApi<AdminPopupItem>('POST', '/admin/popups', {
    imageUrl: await uploadFixtureImage('POPUP'),
    ...body,
  });
}

test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

test.describe('SCR-D10 팝업 관리 — 현재 상태(빈 DB)', () => {
  test('팝업이 없으면 빈 문구를 보이고 공개 활성 팝업은 null 이다', async ({
    page,
  }) => {
    // Act
    await page.goto('/popups');
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: '팝업 관리' })
    ).toBeVisible();
    await expect(page.getByText(EMPTY)).toBeVisible();
    expect(await activePopup()).toEqual({ popup: null });
  });
});

test.describe('SCR-D10 팝업 관리 — 채운 상태(실서버)', () => {
  // 겹침·비활성 테스트가 첫 테스트의 진행중 팝업(main-event)을 이어 쓴다
  test.describe.configure({ mode: 'serial' });

  test('이미지 필수·종료<시작·https 검증 뒤 업로드해 추가하면 진행중으로 보이고 공개 응답에 반영된다', async ({
    page,
  }) => {
    // Arrange
    const start = kstDate(-1);
    const end = kstDate(5);
    const link = LINK('main-event');
    await page.goto('/popups');
    await page.getByRole('button', { name: '팝업 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '팝업 추가' });
    await dialog.getByLabel('시작일').fill(start);
    await dialog.getByLabel('종료일').fill(kstDate(-3));
    // Act — 이미지 없음 + 종료 < 시작
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert — UPL_003 · POP_002 문구
    await expect(dialog.getByText('이미지를 업로드해주세요.')).toBeVisible();
    await expect(
      dialog.getByText('종료일은 시작일 이후여야 합니다.')
    ).toBeVisible();
    // Act — 업로드 + http 링크
    const ticket = page.waitForResponse((r) =>
      r.url().endsWith('/api/backend/v1/admin/uploads')
    );
    await dialog.locator('input[type="file"]').setInputFiles({
      name: `${PREFIX}popup.png`,
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    const { publicUrl } = (await (await ticket).json()) as {
      publicUrl: string;
    };
    await expectImageLoaded(dialog.getByRole('img', { name: '이미지' }));
    await dialog.getByLabel('종료일').fill(end);
    await dialog
      .getByPlaceholder('https://')
      .fill(link.replace('https', 'http'));
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert — https 만
    await expect(dialog.getByText('입력값을 확인해주세요.')).toBeVisible();
    // Act — 고쳐서 추가
    await dialog.getByPlaceholder('https://').fill(link);
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert — 목록 행
    await expect(dialog).toBeHidden();
    await expect(page.getByText('저장되었습니다')).toBeVisible();
    const row = rowOf(page, period(start, end));
    await expect(row).toContainText(link);
    await expect(row).toContainText('활성');
    await expect(row).toContainText('진행중');
    await expect(row).not.toContainText(OVERLAP);
    await expectImageLoaded(row.locator('img'));
    // Assert — 홈페이지 공개 활성 팝업
    const { popup } = await activePopup();
    expect(popup).toMatchObject({
      imageUrl: publicUrl,
      linkUrl: link,
      startDate: start,
      endDate: end,
    });
  });

  test('기간이 겹치는 활성 팝업은 막지 않고 경고하며 기간 상태를 예정·종료로 나눈다', async ({
    page,
  }) => {
    // Arrange — 앞 테스트의 진행중 팝업(-1~+5)과 겹치는 예정 팝업 + 겹치지 않는 비활성 종료 팝업
    const upcoming = { start: kstDate(3), end: kstDate(12) };
    const ended = { start: kstDate(-30), end: kstDate(-20) };
    await createPopup({
      linkUrl: LINK('upcoming'),
      startDate: upcoming.start,
      endDate: upcoming.end,
    });
    await createPopup({
      linkUrl: LINK('ended'),
      startDate: ended.start,
      endDate: ended.end,
      isActive: false,
    });
    await page.goto('/popups');
    const upcomingRow = rowOf(page, period(upcoming.start, upcoming.end));
    const endedRow = rowOf(page, period(ended.start, ended.end));
    const ongoingRow = rowOf(page, LINK('main-event'));
    // Assert — 서버 overlapsActive 근거 경고·상태
    await expect(upcomingRow).toContainText(OVERLAP);
    await expect(upcomingRow).toContainText('예정');
    await expect(ongoingRow).toContainText(OVERLAP);
    await expect(endedRow).toContainText('비활성');
    await expect(endedRow).toContainText('종료');
    await expect(endedRow).not.toContainText(OVERLAP);
    // Act — 수정 다이얼로그에도 경고, 저장은 막지 않는다
    await upcomingRow.getByRole('button', { name: '팝업 수정' }).click();
    const dialog = page.getByRole('dialog', { name: '팝업 수정' });
    await expect(dialog.getByText(OVERLAP)).toBeVisible();
    await dialog.getByPlaceholder('https://').fill(LINK('upcoming-2'));
    await dialog.getByRole('button', { name: '저장' }).click();
    // Assert
    await expect(dialog).toBeHidden();
    await expect(upcomingRow).toContainText(LINK('upcoming-2'));
    await expect(upcomingRow).toContainText(OVERLAP);
    // Assert — 공개 응답은 오늘 노출 중인 팝업 하나(예정 팝업은 아직)
    expect((await activePopup()).popup?.linkUrl).toBe(LINK('main-event'));
  });

  test('진행중 팝업을 비활성으로 바꾸면 겹침 경고가 사라지고 공개 응답에서 빠진다', async ({
    page,
  }) => {
    // Arrange
    await page.goto('/popups');
    const ongoingRow = rowOf(page, LINK('main-event'));
    await expect(ongoingRow).toContainText(OVERLAP);
    // Act
    await ongoingRow.getByRole('button', { name: '팝업 수정' }).click();
    const dialog = page.getByRole('dialog', { name: '팝업 수정' });
    await dialog.getByLabel('활성').uncheck();
    await dialog.getByRole('button', { name: '저장' }).click();
    // Assert
    await expect(dialog).toBeHidden();
    await expect(ongoingRow).toContainText('비활성');
    await expect(ongoingRow).not.toContainText(OVERLAP);
    await expect(rowOf(page, LINK('upcoming-2'))).not.toContainText(OVERLAP);
    expect(await activePopup()).toEqual({ popup: null });
  });

  test('서버도 종료<시작은 POP_002, 저장소 밖 이미지는 UPL_003 으로 거절한다', async ({
    request,
  }) => {
    // Arrange
    const imageUrl = await uploadFixtureImage('POPUP');
    // Act
    const reversed = await request.post('/api/backend/v1/admin/popups', {
      data: {
        imageUrl,
        linkUrl: LINK('reversed'),
        startDate: kstDate(2),
        endDate: kstDate(1),
      },
    });
    const external = await request.post('/api/backend/v1/admin/popups', {
      data: {
        imageUrl: 'https://example.com/outside.png',
        linkUrl: LINK('external'),
        startDate: kstDate(1),
        endDate: kstDate(2),
      },
    });
    // Assert
    expect(reversed.status()).toBe(400);
    expect(await reversed.json()).toMatchObject({
      code: 'POP_002',
      message: '종료일은 시작일 이후여야 합니다.',
    });
    expect(external.status()).toBe(400);
    expect(await external.json()).toMatchObject({
      code: 'UPL_003',
      message: '이미지를 업로드해주세요.',
    });
  });

  test('다른 곳에서 삭제된 팝업을 저장하면 서버 POP_001 문구를 보인다', async ({
    page,
  }) => {
    // Arrange
    const created = await createPopup({
      linkUrl: LINK('gone'),
      startDate: kstDate(40),
      endDate: kstDate(41),
    });
    await page.goto('/popups');
    await rowOf(page, LINK('gone'))
      .getByRole('button', { name: '팝업 수정' })
      .click();
    const dialog = page.getByRole('dialog', { name: '팝업 수정' });
    await adminApi('DELETE', `/admin/popups/${created.id}`);
    // Act
    await dialog.getByRole('button', { name: '저장' }).click();
    // Assert
    await expect(
      dialog.getByText('팝업 정보를 찾을 수 없습니다.')
    ).toBeVisible();
  });

  test('삭제 확인에서 삭제하면 목록에서 사라진다', async ({ page }) => {
    // Arrange
    const created = await createPopup({
      linkUrl: LINK('delete'),
      startDate: kstDate(50),
      endDate: kstDate(50),
    });
    await page.goto('/popups');
    const row = rowOf(page, LINK('delete'));
    await expect(row).toBeVisible();
    // Act
    await row.getByRole('button', { name: '팝업 삭제' }).click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText('팝업을 삭제하시겠습니까?');
    await confirm.getByRole('button', { name: '삭제' }).click();
    // Assert
    await expect(confirm).toBeHidden();
    await expect(row).toHaveCount(0);
    const { items } = await adminApi<{ items: AdminPopupItem[] }>(
      'GET',
      '/admin/popups'
    );
    expect(items.map((p) => p.id)).not.toContain(created.id);
  });
});
