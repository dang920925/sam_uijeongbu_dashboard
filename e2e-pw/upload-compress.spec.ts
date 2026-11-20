// ----------------------------------------------------------------------
// 업로드 전 이미지 자동 축소·압축(W5, 사용자 요청 2026-11-20 "포스터 15MB 화질 낮추기").
// 큰 사진(한도 5MB 초과 JPEG)은 브라우저에서 줄여 올리고 "…MB → …MB로 줄여 올렸습니다." 를 보인다.
// 목 업로드는 UPLOAD_MAX_BYTES 로 크기를 검사하므로 성공 = 한도 안으로 줄었다는 뜻.
// 큰 이미지는 테스트 안에서 브라우저 canvas 로 만든다(블록 노이즈 → JPEG 품질 0.95).
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import { pngFile, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-1-w5-';
const MB = 1024 * 1024;

/** 앱 페이지 안에서 width×height 노이즈 JPEG 를 만들어 바이트로 돌려준다 */
async function makeNoiseJpeg(
  page: Page,
  width: number,
  height: number
): Promise<Buffer> {
  const base64 = await page.evaluate(
    async ({ w, h }) => {
      const block = 3;
      const bw = Math.ceil(w / block);
      const bh = Math.ceil(h / block);
      const pixels = new ImageData(bw, bh);
      for (let i = 0; i < pixels.data.length; i += 65536) {
        crypto.getRandomValues(pixels.data.subarray(i, i + 65536));
      }
      for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = 255;
      const small = document.createElement('canvas');
      small.width = bw;
      small.height = bh;
      small.getContext('2d')?.putImageData(pixels, 0, 0);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas 2d 없음');
      context.imageSmoothingEnabled = false;
      context.drawImage(small, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.95)
      );
      if (!blob) throw new Error('JPEG 인코딩 실패');
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(blob);
      });
      return dataUrl.slice(dataUrl.indexOf(',') + 1);
    },
    { w: width, h: height }
  );
  return Buffer.from(base64, 'base64');
}

async function openStaffDialog(page: Page) {
  await page.goto('/staff');
  await page.getByRole('button', { name: '연출진 추가' }).click();
  const dialog = page.getByRole('dialog', { name: '연출진 추가' });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe('업로드 전 이미지 자동 축소·압축', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('한도(프로필 5MB)를 넘는 큰 사진은 줄여 올리고 줄인 크기를 알린다', async ({
    page,
  }) => {
    // Arrange
    test.setTimeout(120_000);
    const dialog = await openStaffDialog(page);
    const buffer = await makeNoiseJpeg(page, 3000, 4500);
    expect(buffer.byteLength).toBeGreaterThan(5 * MB);
    // Act
    const chooser = page.waitForEvent('filechooser');
    await dialog.getByRole('button', { name: '이미지 선택' }).click();
    await (
      await chooser
    ).setFiles({
      name: `${PREFIX}big.jpg`,
      mimeType: 'image/jpeg',
      buffer,
    });
    // Assert — 목 업로드 한도(5MB)를 통과해 썸네일로 바뀌고 안내가 보인다
    await expect(
      dialog.getByRole('button', { name: '이미지 변경' })
    ).toBeVisible({ timeout: 60_000 });
    const notice = dialog.getByText(/MB → [\d.]+MB로 줄여 올렸습니다\.$/);
    await expect(notice).toBeVisible();
    const [from, to] = ((await notice.textContent()) ?? '')
      .match(/[\d.]+(?=MB)/g)
      ?.map(Number) ?? [0, 0];
    expect(from).toBeCloseTo(buffer.byteLength / MB, 1);
    expect(to).toBeLessThanOrEqual(5);
    await expect(dialog.getByText('파일 크기가 초과되었습니다.')).toHaveCount(
      0
    );
  });

  test('작은 PNG 는 다시 인코딩하지 않고 그대로 올려 안내가 없다', async ({
    page,
  }) => {
    // Arrange
    const dialog = await openStaffDialog(page);
    // Act
    const chooser = page.waitForEvent('filechooser');
    await dialog.getByRole('button', { name: '이미지 선택' }).click();
    await (await chooser).setFiles(pngFile(`${PREFIX}small.png`));
    // Assert
    await expect(
      dialog.getByRole('button', { name: '이미지 변경' })
    ).toBeVisible();
    await expect(dialog.getByText(/줄여 올렸습니다/)).toHaveCount(0);
  });

  test('브라우저가 열지 못하는 HEIC 는 JPG·PNG 로 다시 올리라고 안내한다', async ({
    page,
  }) => {
    // Arrange
    const dialog = await openStaffDialog(page);
    // Act
    const chooser = page.waitForEvent('filechooser');
    await dialog.getByRole('button', { name: '이미지 선택' }).click();
    await (
      await chooser
    ).setFiles({
      name: `${PREFIX}photo.heic`,
      mimeType: 'image/heic',
      buffer: Buffer.from('not-a-real-heic-image'),
    });
    // Assert — 다시 시도는 숨기고(같은 파일은 결과가 같다) 이미지 선택만
    await expect(
      dialog.getByText(
        '이미지를 열 수 없습니다. JPG·PNG로 저장해 다시 올려 주세요.'
      )
    ).toBeVisible();
    await expect(dialog.getByRole('button', { name: '다시 시도' })).toHaveCount(
      0
    );
  });

  test('갤러리(10MB)도 큰 사진을 줄여 올려 그리드에 보인다', async ({
    page,
  }) => {
    // Arrange
    test.setTimeout(120_000);
    const description = `${PREFIX}큰 사진`;
    await page.goto('/gallery');
    await expect(page.getByText('등록된 이미지가 없습니다')).toBeVisible();
    const buffer = await makeNoiseJpeg(page, 3000, 4500);
    expect(buffer.byteLength).toBeGreaterThan(10 * MB);
    await page.getByPlaceholder('사진 설명 입력').fill(description);
    // Act
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: '이미지 선택' }).click();
    await (
      await chooser
    ).setFiles({
      name: `${PREFIX}gallery.jpg`,
      mimeType: 'image/jpeg',
      buffer,
    });
    // Assert
    const grid = page.getByRole('list', { name: '갤러리' });
    await expect(grid.getByRole('img', { name: description })).toBeVisible({
      timeout: 60_000,
    });
  });
});
