// ----------------------------------------------------------------------
// SCR-D09 연출진 관리(FN-16·FN-18, D5 신규) — 빈 상태, 추가(필수 검증 · 사진 업로드 · 저장 후 목록),
// 수정(역할·노출 전환), 삭제 확인 "{이름}을(를) 삭제하시겠습니까?". desktop 은 표, mobile 은 카드.
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import { adminApi, pngFile, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-1-w4-';

/** 표(desktop)·카드(mobile) 중 보이는 쪽에서 해당 연출진 줄 */
function entryOf(page: Page, isMobile: boolean, name: string) {
  return isMobile
    ? page.getByRole('listitem').filter({ hasText: name })
    : page.getByRole('row').filter({ hasText: name });
}

test.describe('SCR-D09 연출진 관리', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('연출진이 없으면 빈 문구를 보인다', async ({ page }) => {
    // Act
    await page.goto('/staff');
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: '연출진 관리' })
    ).toBeVisible();
    await expect(page.getByText('등록된 연출진이 없습니다')).toBeVisible();
  });

  test('이름·역할 없이 추가하면 막고, 채워서 추가하면 닫히고 목록에 보인다', async ({
    page,
    isMobile,
  }) => {
    // Arrange
    const name = `${PREFIX}연출가`;
    await page.goto('/staff');
    await page.getByRole('button', { name: '연출진 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '연출진 추가' });
    await expect(dialog).toBeVisible();
    // Act — 빈 값 제출
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert
    await expect(dialog.getByText('이름을 입력해주세요')).toBeVisible();
    await expect(dialog.getByText('역할을 입력해주세요')).toBeVisible();
    // Act — 사진 업로드 + 필드 채우기
    const chooser = page.waitForEvent('filechooser');
    await dialog.getByRole('button', { name: '이미지 선택' }).click();
    await (await chooser).setFiles(pngFile(`${PREFIX}profile.png`));
    await expect(
      dialog.getByRole('button', { name: '이미지 변경' })
    ).toBeVisible();
    await dialog.getByPlaceholder('이름 입력').fill(name);
    await dialog
      .getByPlaceholder('예: 예술감독 · 연출')
      .fill('예술감독 · 연출');
    await expect(dialog.getByText(`${name.length}/50`)).toBeVisible();
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert
    await expect(dialog).toBeHidden();
    await expect(page.getByText('저장되었습니다')).toBeVisible();
    const entry = entryOf(page, isMobile, name);
    await expect(entry).toBeVisible();
    await expect(entry).toContainText('예술감독 · 연출');
    await expect(entry).toContainText('노출');
    await expect(entry.getByRole('img', { name })).toBeVisible();
  });

  test('수정에서 역할을 바꾸고 노출을 끄면 목록에 반영된다', async ({
    page,
    request,
    isMobile,
  }) => {
    // Arrange
    const name = `${PREFIX}수정 대상`;
    await adminApi(request, 'POST', '/admin/staff', {
      name,
      role: '연출',
      displayOrder: 0,
    });
    await page.goto('/staff');
    const entry = entryOf(page, isMobile, name);
    // Act
    await entry.getByRole('button', { name: '연출진 수정' }).click();
    const dialog = page.getByRole('dialog', { name: '연출진 수정' });
    await expect(dialog.getByPlaceholder('이름 입력')).toHaveValue(name);
    await dialog.getByPlaceholder('예: 예술감독 · 연출').fill('조연출');
    await dialog.getByLabel('노출 순서').fill('3');
    await dialog.getByLabel('홈페이지 노출').uncheck();
    await dialog.getByRole('button', { name: '저장' }).click();
    // Assert
    await expect(dialog).toBeHidden();
    await expect(entry).toContainText('조연출');
    await expect(entry).toContainText('비노출');
    await expect(entry).toContainText('3');
  });

  test('삭제 확인에서 삭제하면 목록에서 사라진다', async ({
    page,
    request,
    isMobile,
  }) => {
    // Arrange
    const name = `${PREFIX}삭제 대상`;
    await adminApi(request, 'POST', '/admin/staff', { name, role: '연출' });
    await page.goto('/staff');
    // Act
    await entryOf(page, isMobile, name)
      .getByRole('button', { name: '연출진 삭제' })
      .click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText(`${name}을(를) 삭제하시겠습니까?`);
    await confirm.getByRole('button', { name: '삭제' }).click();
    // Assert
    await expect(confirm).toBeHidden();
    await expect(page.getByText('등록된 연출진이 없습니다')).toBeVisible();
  });
});
