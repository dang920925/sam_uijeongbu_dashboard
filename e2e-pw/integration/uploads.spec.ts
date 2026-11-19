// ----------------------------------------------------------------------
// 연동 E2E — FN-18 공용 업로드(uploadImage → POST /admin/uploads → 서명 URL PUT) × 실서버 로컬 대체 저장소.
// D07·D09·D10 은 각 화면 스펙에서 보고, 여기서는 다른 화면이 같은 함수를 쓰는 자리를 본다:
// - D03 공연 추가: 포스터(PERFORMANCE_POSTER)·상세 이미지(PERFORMANCE_DETAIL) 업로드 → 미리보기가 실제로 로드 → 저장 시 공개 URL 저장.
// - D05 배우 패널 사진(ACTOR_PROFILE) → 아바타 로드 · 프로필 저장.
// - 브라우저 PUT 이 대시보드 출처에서 CORS 를 통과(access-control-allow-origin = 대시보드 출처).
// - 실패 문구: svg → UPL_001, 포스터 6MB → UPL_002(화면 사전 검사 + 서버 POST /admin/uploads 도 같은 코드로 거절),
//   서명 토큰이 틀려 저장소가 PUT 을 거절 → "파일 업로드에 실패했습니다. 다시 시도해주세요." → 다시 시도로 회복.
// 픽스처: 공연 title · 단원 name 은 fixturePrefix('uploads') 로 시작.
// ----------------------------------------------------------------------
import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
  TINY_PNG,
} from '@/e2e-pw/integration/support/integration-api';

const PREFIX = fixturePrefix('uploads');
const MB = 1024 * 1024;
const PNG = (name: string) => ({
  name: `${PREFIX}${name}`,
  mimeType: 'image/png',
  buffer: TINY_PNG,
});

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

async function openPerformanceDialog(page: Page) {
  await page.goto('/performances');
  await page.getByRole('button', { name: '공연 추가' }).click();
  const dialog = page.getByRole('dialog', { name: '공연 추가' });
  await expect(dialog).toBeVisible();
  return {
    dialog,
    poster: dialog.locator('input[type="file"]:not([multiple])'),
    details: dialog.locator('input[type="file"][multiple]'),
  };
}

test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

test.describe('FN-18 공용 업로드 — D03 포스터·상세 이미지', () => {
  test('포스터·상세 이미지를 올리면 미리보기가 로드되고 저장하면 공개 URL 이 공연에 저장된다', async ({
    page,
    baseURL,
  }) => {
    // Arrange
    const title = `${PREFIX}업로드 공연`;
    const { dialog, poster, details } = await openPerformanceDialog(page);
    await dialog.getByPlaceholder('공연 제목 입력').fill(title);
    const posterTicket = page.waitForResponse((r) =>
      r.url().endsWith('/api/backend/v1/admin/uploads')
    );
    const posterPut = page.waitForResponse(
      (r) =>
        r.request().method() === 'PUT' &&
        r.url().includes('/local-storage/upload/performance')
    );
    // Act — 포스터
    await poster.setInputFiles(PNG('poster.png'));
    // Assert — 발급 본문·CORS 통과·미리보기
    const ticket = await posterTicket;
    expect(ticket.request().postDataJSON()).toEqual({
      purpose: 'PERFORMANCE_POSTER',
      contentType: 'image/png',
      size: TINY_PNG.byteLength,
    });
    const posterUrl = ((await ticket.json()) as { publicUrl: string })
      .publicUrl;
    const put = await posterPut;
    expect(put.status()).toBeLessThan(300);
    expect((await put.allHeaders())['access-control-allow-origin']).toBe(
      new URL(baseURL as string).origin
    );
    await expectImageLoaded(dialog.getByRole('img', { name: '포스터 이미지' }));
    // Act — 상세 이미지
    const detailTicket = page.waitForResponse((r) =>
      r.url().endsWith('/api/backend/v1/admin/uploads')
    );
    await details.setInputFiles(PNG('detail.png'));
    const detailRequest = (await detailTicket).request().postDataJSON() as {
      purpose: string;
    };
    // Assert
    expect(detailRequest.purpose).toBe('PERFORMANCE_DETAIL');
    await expectImageLoaded(dialog.getByRole('img', { name: '상세 이미지 1' }));
    // Act — 저장
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert — 서버에 저장된 URL
    await expect(dialog).toBeHidden();
    const { items } = await adminApi<{
      items: { id: string; title: string }[];
    }>('GET', '/admin/performances?size=100');
    const created = items.find((p) => p.title === title);
    expect(created).toBeDefined();
    const detail = await adminApi<{
      posterImageUrl: string | null;
      detailImageUrls: string[];
    }>('GET', `/admin/performances/${created?.id}`);
    expect(detail.posterImageUrl).toBe(posterUrl);
    expect(detail.detailImageUrls).toHaveLength(1);
    expect(detail.detailImageUrls[0]).toMatch(
      /\/local-storage\/public\/performance/
    );
  });

  test('svg 포스터는 UPL_001, 6MB 포스터는 UPL_002 문구를 보이고 서버 발급을 부르지 않는다', async ({
    page,
  }) => {
    // Arrange
    const { dialog, poster } = await openPerformanceDialog(page);
    let uploadCalls = 0;
    page.on('request', (r) => {
      if (r.url().endsWith('/admin/uploads')) uploadCalls += 1;
    });
    // Act — svg
    await poster.setInputFiles({
      name: `${PREFIX}vector.svg`,
      mimeType: 'image/svg+xml',
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    });
    // Assert
    await expect(
      dialog.getByText('지원하지 않는 파일 형식입니다.')
    ).toBeVisible();
    // Act — 6MB png(포스터 상한 5MB)
    await poster.setInputFiles({
      ...PNG('large.png'),
      buffer: Buffer.concat([TINY_PNG, Buffer.alloc(6 * MB)]),
    });
    // Assert
    await expect(dialog.getByText('파일 크기가 초과되었습니다.')).toBeVisible();
    expect(uploadCalls).toBe(0);
  });

  test('서버 POST /admin/uploads 도 svg 는 UPL_001, 포스터 6MB 는 UPL_002 로 거절한다', async ({
    request,
  }) => {
    // Act
    const svg = await request.post('/api/backend/v1/admin/uploads', {
      data: { purpose: 'GALLERY', contentType: 'image/svg+xml', size: 100 },
    });
    const large = await request.post('/api/backend/v1/admin/uploads', {
      data: {
        purpose: 'PERFORMANCE_POSTER',
        contentType: 'image/png',
        size: 6 * MB,
      },
    });
    const detailSixMb = await request.post('/api/backend/v1/admin/uploads', {
      data: {
        purpose: 'PERFORMANCE_DETAIL',
        contentType: 'image/png',
        size: 6 * MB,
      },
    });
    // Assert — 화면 사전 검사와 같은 코드·문구, 상세(10MB)는 통과
    expect(svg.status()).toBe(400);
    expect(await svg.json()).toMatchObject({
      code: 'UPL_001',
      message: '지원하지 않는 파일 형식입니다.',
    });
    expect(large.status()).toBe(400);
    expect(await large.json()).toMatchObject({
      code: 'UPL_002',
      message: '파일 크기가 초과되었습니다.',
    });
    expect(detailSixMb.status()).toBe(201);
  });

  test('저장소가 PUT 을 거절하면 실패 문구를 보이고 다시 시도로 회복한다', async ({
    page,
  }) => {
    // Arrange — 실제 발급 응답의 서명 토큰만 망가뜨린다(저장소가 진짜로 거절)
    let tamper = true;
    await page.route('**/api/backend/v1/admin/uploads', async (route) => {
      const response = await route.fetch();
      const body = (await response.json()) as { signedUrl: string };
      if (tamper) {
        tamper = false;
        body.signedUrl = body.signedUrl.replace(/token=[^&]+/, 'token=0.bad');
      }
      await route.fulfill({ response, json: body });
    });
    const { dialog, poster } = await openPerformanceDialog(page);
    const rejected = page.waitForResponse(
      (r) => r.request().method() === 'PUT' && r.url().includes('token=0.bad')
    );
    // Act
    await poster.setInputFiles(PNG('retry.png'));
    // Assert
    expect((await rejected).status()).toBeGreaterThanOrEqual(400);
    await expect(
      dialog.getByText('파일 업로드에 실패했습니다. 다시 시도해주세요.')
    ).toBeVisible();
    // Act — 다시 시도(새 서명 URL)
    await dialog.getByRole('button', { name: '다시 시도' }).click();
    // Assert
    await expectImageLoaded(dialog.getByRole('img', { name: '포스터 이미지' }));
  });
});

test.describe('FN-18 공용 업로드 — D05 배우 사진', () => {
  test('배우 패널에서 사진을 올리면 아바타가 로드되고 프로필에 저장된다', async ({
    page,
  }) => {
    // Arrange
    const name = `${PREFIX}배우`;
    const member = await adminApi<{ id: string }>('POST', '/admin/members', {
      name,
      type: 'ACTOR',
      phone: null,
    });
    await page.goto(`/members?member=${member.id}`);
    const sheet = page
      .locator('aside, [role="dialog"]')
      .filter({ has: page.getByRole('heading', { level: 2, name }) })
      .filter({ visible: true });
    const ticket = page.waitForResponse((r) =>
      r.url().endsWith('/api/backend/v1/admin/uploads')
    );
    // Act
    await sheet.locator('input[type="file"]').setInputFiles(PNG('actor.png'));
    // Assert
    const response = await ticket;
    expect(
      (response.request().postDataJSON() as { purpose: string }).purpose
    ).toBe('ACTOR_PROFILE');
    const { publicUrl } = (await response.json()) as { publicUrl: string };
    await expectImageLoaded(sheet.getByRole('img', { name }));
    await expect
      .poll(
        async () =>
          (
            await adminApi<{ profileImageUrl: string | null }>(
              'GET',
              `/admin/members/${member.id}/actor-profile`
            )
          ).profileImageUrl
      )
      .toBe(publicUrl);
  });
});
