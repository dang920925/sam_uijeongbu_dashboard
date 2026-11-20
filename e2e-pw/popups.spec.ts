// ----------------------------------------------------------------------
// SCR-D10 팝업 관리(FN-17·FN-18, D5 신규) — 빈 상태, 추가(이미지 필수 UPL_003 · 종료<시작 POP_002 · https 링크),
// 겹치는 기간은 막지 않고 행·다이얼로그에 경고, 기간 상태(진행중/예정/종료), 삭제 확인.
// desktop(1440)은 표, mobile 은 카드(cardBelow lg).
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import {
  adminApi,
  pngFile,
  resetMock,
  uploadFixtureImage,
} from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-1-w4-';
const OVERLAP = '다른 팝업과 노출 기간이 겹칩니다';

/** 오늘(KST)에서 days 만큼 옮긴 'YYYY-MM-DD' */
function kstDate(days: number): string {
  const time = Date.now() + days * 24 * 60 * 60 * 1000;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(time)
  );
}

const dotted = (date: string) => date.replaceAll('-', '.');

function entries(page: Page, isMobile: boolean) {
  return isMobile
    ? page.getByRole('list', { name: '팝업 관리' }).getByRole('listitem')
    : page.getByRole('table', { name: '팝업 관리' }).getByRole('row');
}

function entryOf(page: Page, isMobile: boolean, period: string) {
  return entries(page, isMobile).filter({ hasText: period });
}

test.describe('SCR-D10 팝업 관리', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('팝업이 없으면 빈 문구를 보인다', async ({ page }) => {
    // Act
    await page.goto('/popups');
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: '팝업 관리' })
    ).toBeVisible();
    await expect(page.getByText('등록된 팝업이 없습니다')).toBeVisible();
  });

  test('이미지 없이·종료일이 시작일보다 앞서면 막고, 고쳐서 추가하면 진행중으로 보인다', async ({
    page,
    isMobile,
  }) => {
    // Arrange
    const start = kstDate(-1);
    const end = kstDate(5);
    await page.goto('/popups');
    await page.getByRole('button', { name: '팝업 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '팝업 추가' });
    await dialog.getByLabel('시작일').fill(start);
    await dialog.getByLabel('종료일').fill(kstDate(-3));
    // Act
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert — UPL_003 · POP_002 (FN-17 수용 기준)
    await expect(dialog.getByText('이미지를 업로드해주세요.')).toBeVisible();
    await expect(
      dialog.getByText('종료일은 시작일 이후여야 합니다.')
    ).toBeVisible();
    // Act — https 아닌 링크
    await dialog.getByPlaceholder('https://').fill('http://sam.example');
    await dialog.getByLabel('종료일').fill(end);
    const chooser = page.waitForEvent('filechooser');
    await dialog.getByRole('button', { name: '이미지 선택' }).click();
    await (await chooser).setFiles(pngFile(`${PREFIX}popup.png`));
    await expect(
      dialog.getByRole('button', { name: '이미지 변경' })
    ).toBeVisible();
    await dialog.getByRole('button', { name: '추가' }).click();
    await expect(dialog.getByText('입력값을 확인해주세요.')).toBeVisible();
    // Act — 고쳐서 추가
    await dialog.getByPlaceholder('https://').fill('https://sam.example/event');
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert
    await expect(dialog).toBeHidden();
    const entry = entryOf(page, isMobile, `${dotted(start)} ~ ${dotted(end)}`);
    await expect(entry).toBeVisible();
    await expect(entry).toContainText('https://sam.example/event');
    await expect(entry).toContainText('활성');
    await expect(entry).toContainText('진행중');
    await expect(entry).not.toContainText(OVERLAP);
  });

  test('기간이 겹치는 활성 팝업은 막지 않고 행과 수정 다이얼로그에 경고를 보인다', async ({
    page,
    request,
    isMobile,
  }) => {
    // Arrange — 활성 2개(겹침) + 비활성 종료 1개
    const imageUrl = await uploadFixtureImage(request, 'POPUP');
    const first = { start: kstDate(-2), end: kstDate(3) };
    const second = { start: kstDate(1), end: kstDate(10) };
    const ended = { start: kstDate(-20), end: kstDate(-10) };
    for (const p of [first, second]) {
      await adminApi(request, 'POST', '/admin/popups', {
        imageUrl,
        startDate: p.start,
        endDate: p.end,
      });
    }
    await adminApi(request, 'POST', '/admin/popups', {
      imageUrl,
      startDate: ended.start,
      endDate: ended.end,
      isActive: false,
    });
    await page.goto('/popups');
    const period = (p: { start: string; end: string }) =>
      `${dotted(p.start)} ~ ${dotted(p.end)}`;
    const firstEntry = entryOf(page, isMobile, period(first));
    const secondEntry = entryOf(page, isMobile, period(second));
    const endedEntry = entryOf(page, isMobile, period(ended));
    // Assert — 행 경고·상태
    await expect(firstEntry).toContainText(OVERLAP);
    await expect(secondEntry).toContainText(OVERLAP);
    await expect(secondEntry).toContainText('예정');
    await expect(endedEntry).toContainText('비활성');
    await expect(endedEntry).toContainText('종료');
    await expect(endedEntry).not.toContainText(OVERLAP);
    // Act — 수정 다이얼로그에도 경고, 저장은 막지 않는다
    await secondEntry.getByRole('button', { name: '팝업 수정' }).click();
    const dialog = page.getByRole('dialog', { name: '팝업 수정' });
    await expect(dialog.getByText(OVERLAP)).toBeVisible();
    await dialog
      .getByPlaceholder('https://')
      .fill('https://sam.example/second');
    await dialog.getByRole('button', { name: '저장' }).click();
    // Assert
    await expect(dialog).toBeHidden();
    await expect(secondEntry).toContainText('https://sam.example/second');
    await expect(secondEntry).toContainText(OVERLAP);
  });

  test('삭제 확인에서 삭제하면 목록에서 사라진다', async ({
    page,
    request,
    isMobile,
  }) => {
    // Arrange
    const imageUrl = await uploadFixtureImage(request, 'POPUP');
    await adminApi(request, 'POST', '/admin/popups', {
      imageUrl,
      startDate: kstDate(0),
      endDate: kstDate(0),
    });
    await page.goto('/popups');
    // Act
    await entries(page, isMobile)
      .filter({ hasText: dotted(kstDate(0)) })
      .getByRole('button', { name: '팝업 삭제' })
      .click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText('팝업을 삭제하시겠습니까?');
    await confirm.getByRole('button', { name: '삭제' }).click();
    // Assert
    await expect(confirm).toBeHidden();
    await expect(page.getByText('등록된 팝업이 없습니다')).toBeVisible();
  });
});
