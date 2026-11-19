// ----------------------------------------------------------------------
// 연동 스모크(리드) — 실서버 BFF 세션(쿠키 → Bearer)과 업로드 CORS 를 먼저 본다.
// - 저장한 세션으로 BFF 관리 API 가 200 을 돌려준다(쿠키 없는 요청은 서버 401 AUTH_003 그대로).
// - 로컬 대체 저장소 서명 URL PUT 이 대시보드 출처에서 CORS 를 통과한다(x-upsert 헤더 포함).
// ----------------------------------------------------------------------
import { expect, test } from '@playwright/test';

import { TINY_PNG } from '@/e2e-pw/integration/support/integration-api';

test('세션 쿠키로 BFF 관리 API 를 부른다', async ({ request }) => {
  const response = await request.get('/api/backend/v1/admin/dashboard/summary');
  expect(response.status()).toBe(200);
});

test('세션 없는 요청은 서버 401 AUTH_003 을 그대로 받는다', async ({
  playwright,
  baseURL,
}) => {
  // 테스트 프로젝트의 storageState 가 새 컨텍스트에도 들어가므로 빈 상태를 명시한다
  const anonymous = await playwright.request.newContext({
    baseURL,
    storageState: { cookies: [], origins: [] },
  });
  const response = await anonymous.get(
    '/api/backend/v1/admin/dashboard/summary'
  );
  expect(response.status()).toBe(401);
  expect(((await response.json()) as { code: string }).code).toBe('AUTH_003');
  await anonymous.dispose();
});

test('브라우저가 대시보드 출처에서 서명 URL 로 PUT 한다(CORS)', async ({
  page,
  request,
}) => {
  const upload = await request.post('/api/backend/v1/admin/uploads', {
    data: {
      purpose: 'GALLERY',
      contentType: 'image/png',
      size: TINY_PNG.byteLength,
    },
  });
  expect(upload.status()).toBe(201);
  const { signedUrl, publicUrl } = (await upload.json()) as {
    signedUrl: string;
    publicUrl: string;
  };
  await page.goto('/');
  const status = await page.evaluate(
    async ({ url, bytes }) => {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'content-type': 'image/png', 'x-upsert': 'false' },
        body: new Uint8Array(bytes),
      });
      return response.status;
    },
    { url: signedUrl, bytes: [...TINY_PNG] }
  );
  expect(status).toBeLessThan(300);
  const image = await request.get(publicUrl);
  expect(image.status()).toBe(200);
});
