// ----------------------------------------------------------------------
// 연동 E2E — SCR-D07 갤러리(FN-14·FN-18) × 실서버(/api/v1/admin/galleries · /admin/uploads · 로컬 대체 저장소).
// - 현재 상태: 빈 DB → "등록된 이미지가 없습니다".
// - 채운 상태: 화면에서 파일 선택 → 서명 URL 발급 → 브라우저가 대시보드 출처에서 직접 PUT(content-type·x-upsert:false,
//   서버 CORS 통과) → POST /admin/galleries → 그리드 타일 이미지가 실제로 로드(naturalWidth > 0).
//   분류·설명이 서버에 그대로 저장되고 분류 필터가 서버 쿼리로 걸린다. svg 는 UPL_001 문구, 삭제 확인 후 사라짐.
// - 오류: 목록 5xx·네트워크 실패(BFF 경로만 page.route) → 오류 문구 + "다시 시도".
// 픽스처: 갤러리 description 은 fixturePrefix('gallery') 로 시작(정리 SQL 이 description 으로 지움).
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

const PREFIX = fixturePrefix('gallery');
const EMPTY = '등록된 이미지가 없습니다';
const SERVER_ERROR = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

interface GalleryItem {
  id: string;
  imageUrl: string;
  category: string;
  description: string | null;
  createdAt: string;
}

/** next/image(unoptimized) 가 실제 바이트를 받아 그렸는지 */
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

function uploadCard(page: Page) {
  return page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: '이미지 업로드' }) });
}

async function listGalleries() {
  return adminApi<{ items: GalleryItem[] }>('GET', '/admin/galleries?size=100');
}

test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

test.describe('SCR-D07 갤러리 — 현재 상태(빈 DB)', () => {
  test('이미지가 없으면 빈 문구와 업로드 카드를 보인다', async ({ page }) => {
    // Act
    await page.goto('/gallery');
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: '갤러리' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: '이미지 업로드' })
    ).toBeVisible();
    await expect(page.getByText(EMPTY)).toBeVisible();
    await expect(page.getByRole('button', { name: '전체' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});

test.describe('SCR-D07 갤러리 — 채운 상태(실서버)', () => {
  test('파일을 고르면 서명 URL 로 직접 PUT 해 등록되고 타일 이미지가 실제로 로드된다', async ({
    page,
  }) => {
    // Arrange
    const description = `${PREFIX}리허설 사진`;
    await page.goto('/gallery');
    await expect(page.getByText(EMPTY)).toBeVisible();
    const card = uploadCard(page);
    await card.getByRole('combobox').click();
    await page.getByRole('option', { name: '연습' }).click();
    await card.getByPlaceholder('사진 설명 입력').fill(description);
    const ticketResponse = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/backend/v1/admin/uploads') &&
        r.request().method() === 'POST'
    );
    const putRequest = page.waitForRequest(
      (r) => r.method() === 'PUT' && r.url().includes('/local-storage/upload/')
    );
    const putResponse = page.waitForResponse(
      (r) =>
        r.request().method() === 'PUT' &&
        r.url().includes('/local-storage/upload/')
    );
    // Act
    await card.locator('input[type="file"]').setInputFiles({
      name: `${PREFIX}photo.png`,
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    // Assert — 발급(BFF) → 서버 출처로 직접 PUT(헤더 · CORS 통과)
    const ticket = await ticketResponse;
    expect(ticket.status()).toBe(201);
    expect(ticket.request().postDataJSON()).toEqual({
      purpose: 'GALLERY',
      contentType: 'image/png',
      size: TINY_PNG.byteLength,
    });
    const { signedUrl, publicUrl } = (await ticket.json()) as {
      signedUrl: string;
      publicUrl: string;
    };
    expect(signedUrl.startsWith(INT_API_BASE_URL)).toBe(true);
    const put = await putRequest;
    expect(put.url()).toBe(signedUrl);
    const putHeaders = await put.allHeaders();
    expect(putHeaders['content-type']).toBe('image/png');
    expect(putHeaders['x-upsert']).toBe('false');
    expect((await putResponse).status()).toBeLessThan(300);
    // Assert — 그리드에 실제 이미지, 설명 칸 비움
    const grid = page.getByRole('list', { name: '갤러리' });
    const image = grid.getByRole('img', { name: description });
    await expectImageLoaded(image);
    await expect(image).toHaveAttribute('src', publicUrl);
    await expect(grid.getByText('연습', { exact: true })).toBeAttached();
    await expect(card.getByPlaceholder('사진 설명 입력')).toHaveValue('');
    // Assert — 서버에 분류·설명·공개 URL 이 그대로 저장됐다
    const { items } = await listGalleries();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      imageUrl: publicUrl,
      category: 'PRACTICE',
      description,
    });
  });

  test('분류 필터는 서버 category 쿼리로 거르고 설명이 오버레이에 보인다', async ({
    page,
  }) => {
    // Arrange — 서버에 직접 만든 두 분류
    const imageUrl = await uploadFixtureImage('GALLERY');
    const eventDesc = `${PREFIX}행사`;
    const groupDesc = `${PREFIX}단체`;
    await adminApi('POST', '/admin/galleries', {
      imageUrl,
      category: 'EVENT',
      description: eventDesc,
    });
    await adminApi('POST', '/admin/galleries', {
      imageUrl: await uploadFixtureImage('GALLERY'),
      category: 'GROUP',
      description: groupDesc,
    });
    await page.goto('/gallery');
    const grid = page.getByRole('list', { name: '갤러리' });
    await expectImageLoaded(grid.getByRole('img', { name: eventDesc }));
    await expectImageLoaded(grid.getByRole('img', { name: groupDesc }));
    const filtered = page.waitForRequest((r) =>
      r.url().includes('/api/backend/v1/admin/galleries?category=GROUP')
    );
    // Act
    await page.getByRole('button', { name: '단체사진', exact: true }).click();
    // Assert
    await filtered;
    await expect(grid.getByRole('img', { name: groupDesc })).toBeVisible();
    await expect(grid.getByRole('img', { name: eventDesc })).toHaveCount(0);
    const tile = grid.getByRole('listitem').filter({ hasText: groupDesc });
    await tile.hover();
    await expect(tile.getByText(groupDesc)).toBeVisible();
    await expect(tile.getByText('단체사진', { exact: true })).toBeVisible();
  });

  test('svg 는 서버에 발급 요청 없이 지원하지 않는 형식이라고 알린다', async ({
    page,
  }) => {
    // Arrange
    await page.goto('/gallery');
    await expect(
      page.getByRole('list', { name: '갤러리' }).or(page.getByText(EMPTY))
    ).toBeVisible();
    let uploadCalls = 0;
    page.on('request', (r) => {
      if (r.url().endsWith('/admin/uploads')) uploadCalls += 1;
    });
    // Act
    await uploadCard(page)
      .locator('input[type="file"]')
      .setInputFiles({
        name: `${PREFIX}vector.svg`,
        mimeType: 'image/svg+xml',
        buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      });
    // Assert — UPL_001 계약 문구
    await expect(
      uploadCard(page).getByText('지원하지 않는 파일 형식입니다.')
    ).toBeVisible();
    expect(uploadCalls).toBe(0);
  });

  test('발급 API 가 실패하면 업로드 카드에 실패 문구를 보이고 등록하지 않는다', async ({
    page,
  }) => {
    // Arrange — 서버 UPL_004(저장소 실패) 흉내: BFF 경로만 가로챈다
    const before = (await listGalleries()).items.length;
    await page.route('**/api/backend/v1/admin/uploads', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 500,
          status: 'INTERNAL_SERVER_ERROR',
          message: '이미지 업로드 URL 을 만들지 못했습니다.',
          code: 'UPL_004',
          timestamp: '2026-11-19T00:00:00.000Z',
          path: '/api/v1/admin/uploads',
        }),
      })
    );
    await page.goto('/gallery');
    const card = uploadCard(page);
    await card.getByPlaceholder('사진 설명 입력').fill(`${PREFIX}실패`);
    // Act
    await card.locator('input[type="file"]').setInputFiles({
      name: `${PREFIX}fail.png`,
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    // Assert — 현행 문구(Gallery.tsx:126)
    await expect(card.getByText('업로드 중 오류가 발생했습니다')).toBeVisible();
    expect((await listGalleries()).items).toHaveLength(before);
  });

  test('삭제 확인에서 삭제하면 타일이 사라지고 서버에서도 지워진다', async ({
    page,
  }) => {
    // Arrange
    const description = `${PREFIX}삭제 대상`;
    const created = await adminApi<GalleryItem>('POST', '/admin/galleries', {
      imageUrl: await uploadFixtureImage('GALLERY'),
      category: 'ETC',
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
    // Assert
    await expect(confirm).toBeHidden();
    await expect(tile).toHaveCount(0);
    const { items } = await listGalleries();
    expect(items.map((g) => g.id)).not.toContain(created.id);
  });

  test('이미 지워진 이미지를 삭제하면 서버 GAL_001 문구를 스낵바로 알린다', async ({
    page,
  }) => {
    // Arrange — 화면을 연 뒤 다른 곳에서 먼저 지운다
    const description = `${PREFIX}먼저 삭제됨`;
    const created = await adminApi<GalleryItem>('POST', '/admin/galleries', {
      imageUrl: await uploadFixtureImage('GALLERY'),
      category: 'ETC',
      description,
    });
    await page.goto('/gallery');
    const tile = page
      .getByRole('list', { name: '갤러리' })
      .getByRole('listitem')
      .filter({ hasText: description });
    await expect(tile).toBeVisible();
    await adminApi('DELETE', `/admin/galleries/${created.id}`);
    // Act
    await tile.hover();
    await tile.getByRole('button', { name: '삭제' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '삭제' })
      .click();
    // Assert
    await expect(
      page.getByText('갤러리 이미지를 찾을 수 없습니다.')
    ).toBeVisible();
  });

  test('목록 조회가 5xx(본문 없음)·네트워크 실패면 오류 문구와 다시 시도를 보인다', async ({
    page,
  }) => {
    // Arrange — 서버 중단 시 BFF 가 돌려주는 HTML 500 과 같은 모양
    await page.route('**/api/backend/v1/admin/galleries?**', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'text/html',
        body: '<h1>500</h1>',
      })
    );
    // Act
    await page.goto('/gallery');
    // Assert
    await expect(page.getByText(SERVER_ERROR).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
    // Arrange — 네트워크 실패로 바꾸고 다시 시도(쿼리 재시도 1회까지 끝나야 오류 상태가 확정된다)
    await page.unroute('**/api/backend/v1/admin/galleries?**');
    let aborted = 0;
    await page.route('**/api/backend/v1/admin/galleries?**', (route) => {
      aborted += 1;
      return route.abort('connectionrefused');
    });
    // Act
    await page.getByRole('button', { name: '다시 시도' }).click();
    // Assert
    await expect.poll(() => aborted).toBe(2);
    await expect(page.getByText(SERVER_ERROR).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeEnabled();
    // Act — 복구되면 다시 시도로 목록이 뜬다
    await page.unroute('**/api/backend/v1/admin/galleries?**');
    await page.getByRole('button', { name: '다시 시도' }).click();
    await expect(
      page.getByRole('list', { name: '갤러리' }).or(page.getByText(EMPTY))
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toHaveCount(
      0
    );
  });
});
