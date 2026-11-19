// ----------------------------------------------------------------------
// E2E 도우미 — 목 백엔드(MOCK_BACKEND=true) 상태 초기화와 픽스처 생성(BFF 경유, 세션 쿠키 사용).
// 픽스처 이름은 `fixture-<차수>-w<번호>-...` 접두사로 실데이터처럼 보이지 않게 한다(style-guide §8.7 규칙 4).
// ----------------------------------------------------------------------
import type { APIRequestContext } from '@playwright/test';

export const FIXTURE_ADMIN = {
  username: 'fixture-admin',
  password: 'fixture-password',
};

const API = '/api/backend/v1';

export async function resetMock(request: APIRequestContext): Promise<void> {
  await request.post(`${API}/__mock/reset`);
}

/** BFF 를 거쳐 관리 API 를 부른다(본문 JSON). 실패하면 던진다. */
export async function adminApi<T>(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  data?: unknown
): Promise<T> {
  const response = await request.fetch(`${API}${path}`, { method, data });
  if (!response.ok()) {
    throw new Error(
      `${method} ${path} → ${response.status()} ${await response.text()}`
    );
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** 2×3 회색 PNG — 업로드 흐름용 최소 이미지(캡처에서 흰 배경과 구분되게 회색) */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAEElEQVR4nGM4ffUhEDGgUACdUA8HMpQj4AAAAABJRU5ErkJggg==',
  'base64'
);

export function pngFile(name = 'fixture.png') {
  return { name, mimeType: 'image/png', buffer: TINY_PNG };
}

/** 업로드 API 로 이미지 하나를 올리고 공개 URL 을 돌려준다(목 Storage) */
export async function uploadFixtureImage(
  request: APIRequestContext,
  purpose: string
): Promise<string> {
  const ticket = await adminApi<{ signedUrl: string; publicUrl: string }>(
    request,
    'POST',
    '/admin/uploads',
    {
      purpose,
      contentType: 'image/png',
      size: TINY_PNG.byteLength,
    }
  );
  await request.put(ticket.signedUrl, {
    data: TINY_PNG,
    headers: { 'content-type': 'image/png' },
  });
  return ticket.publicUrl;
}
