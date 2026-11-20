// ----------------------------------------------------------------------
// SCR-D07 갤러리(FN-14·FN-18) — 빈 상태, 파일을 고르면 바로 업로드 → 그리드에 표시(카테고리·설명),
// 카테고리 필터 pill(aria-pressed), svg 는 사전 검사 문구, 삭제 확인 후 사라짐.
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import {
  adminApi,
  pngFile,
  resetMock,
  uploadFixtureImage,
} from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-1-w4-';

async function chooseFile(page: Page, file: ReturnType<typeof pngFile>) {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '이미지 선택' }).click();
  await (await chooser).setFiles(file);
}

test.describe('SCR-D07 갤러리', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('이미지가 없으면 빈 문구와 업로드 카드를 보인다', async ({ page }) => {
    // Act
    await page.goto('/gallery');
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: '갤러리' })
    ).toBeVisible();
    await expect(
      page.getByText('공연 및 활동 사진을 관리합니다')
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: '이미지 업로드' })
    ).toBeVisible();
    await expect(page.getByText('등록된 이미지가 없습니다')).toBeVisible();
    await expect(page.getByRole('button', { name: '전체' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  test('파일을 고르면 바로 업로드되어 그리드에 보이고 카테고리 필터로 걸러진다', async ({
    page,
  }) => {
    // Arrange
    const description = `${PREFIX}리허설`;
    await page.goto('/gallery');
    await expect(page.getByText('등록된 이미지가 없습니다')).toBeVisible();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: '연습' }).click();
    await page.getByPlaceholder('사진 설명 입력').fill(description);
    // Act
    await chooseFile(page, pngFile(`${PREFIX}photo.png`));
    // Assert — 업로드 후 그리드에 표시(FN-18 수용 기준), 설명 칸은 비워진다
    const grid = page.getByRole('list', { name: '갤러리' });
    await expect(grid.getByRole('img', { name: description })).toBeVisible();
    await expect(grid.getByText('연습', { exact: true })).toBeAttached();
    await expect(page.getByPlaceholder('사진 설명 입력')).toHaveValue('');
    // Act — 다른 카테고리로 거르면 빈 문구
    await page.getByRole('button', { name: '공연', exact: true }).click();
    await expect(page.getByText('등록된 이미지가 없습니다')).toBeVisible();
    // Act — 같은 카테고리로 거르면 다시 보인다
    const practice = page.getByRole('button', { name: '연습', exact: true });
    await practice.click();
    await expect(practice).toHaveAttribute('aria-pressed', 'true');
    await expect(grid.getByRole('img', { name: description })).toBeVisible();
  });

  test('svg 파일은 업로드 전에 지원하지 않는 형식이라고 알린다', async ({
    page,
  }) => {
    // Arrange
    await page.goto('/gallery');
    // Act
    await chooseFile(page, {
      name: `${PREFIX}vector.svg`,
      mimeType: 'image/svg+xml',
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    });
    // Assert — FN-18 UPL_001 사전 검사, 등록되지 않는다
    await expect(
      page.getByText('지원하지 않는 파일 형식입니다.')
    ).toBeVisible();
    await expect(page.getByText('등록된 이미지가 없습니다')).toBeVisible();
  });

  test('삭제 확인에서 삭제하면 이미지가 그리드에서 사라진다', async ({
    page,
    request,
  }) => {
    // Arrange
    const description = `${PREFIX}삭제 대상`;
    const imageUrl = await uploadFixtureImage(request, 'GALLERY');
    await adminApi(request, 'POST', '/admin/galleries', {
      imageUrl,
      category: 'EVENT',
      description,
    });
    await page.goto('/gallery');
    const grid = page.getByRole('list', { name: '갤러리' });
    const tile = grid.getByRole('listitem').filter({ hasText: description });
    await expect(tile).toBeVisible();
    // Act
    await tile.hover();
    await tile.getByRole('button', { name: '삭제' }).click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText('이미지를 삭제하시겠습니까?');
    await confirm.getByRole('button', { name: '삭제' }).click();
    // Assert — FN-14 삭제 확인 후 사라짐
    await expect(confirm).toBeHidden();
    await expect(page.getByText('등록된 이미지가 없습니다')).toBeVisible();
  });
});
