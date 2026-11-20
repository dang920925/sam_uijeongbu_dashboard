// ----------------------------------------------------------------------
// U27(FN-45) 공개 페이지 즉시 반영 실측(리드) — INT_SCENARIO=u27 별도 실행에서만 돈다.
// 홈페이지는 production 빌드(`next build && next start`, ISR 60초 그대로)로 INT_CLIENT_PUBLIC_URL 에 떠 있고,
// 이 대시보드는 CLIENT_PUBLIC_URL·REVALIDATE_SECRET 을 그 홈페이지와 같게 받는다.
// - R-3: 대시보드 BFF 로 연출진을 추가·이름 변경·노출 끄기·삭제하면, 응답 뒤 10초 안의 **첫 GET** `/`·`/about` HTML 이
//   새 내용이다(재검증 + warm-up). 매 단계 GET 은 한 번만 — 다시 받아 통과시키지 않는다.
// - 재검증 라우트: 비밀이 없거나 틀리면 404, 맞으면 200 { revalidated, tags, paths, warmed }.
// 대시보드 BFF 는 `after()` 로 응답 뒤에 재검증을 부르므로 응답 직후 잠깐(3초) 기다린 뒤 첫 GET 을 한다.
// ----------------------------------------------------------------------
import { expect, test, type APIRequestContext } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
} from '@/e2e-pw/integration/support/integration-api';

const SCENARIO = process.env.INT_SCENARIO;
const CLIENT = (process.env.INT_CLIENT_PUBLIC_URL ?? '').replace(/\/+$/, '');
const PREFIX = fixturePrefix('u27');
const STAFF = '/api/backend/v1/admin/staff';
/** after() 재검증 + warm-up 이 끝나기를 기다리는 시간(R-3 기준 10초 안) */
const SETTLE_MS = 3_000;

async function firstGetHtml(path: string): Promise<string> {
  const response = await fetch(`${CLIENT}${path}`, { cache: 'no-store' });
  expect(response.status, path).toBe(200);
  return response.text();
}

async function bff<T>(
  request: APIRequestContext,
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  data?: unknown
): Promise<T> {
  const response = await request.fetch(path, { method, data });
  expect(response.ok(), `${method} ${path} ${response.status()}`).toBe(true);
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const settle = () => new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

test.describe('U27 공개 페이지 즉시 반영(production 홈페이지)', () => {
  test.skip(SCENARIO !== 'u27', 'INT_SCENARIO=u27 실행 전용');
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
  test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

  let staffId = '';
  const name = `${PREFIX}연출`;
  const renamed = `${PREFIX}연출수정`;

  test('재검증 라우트는 비밀이 없거나 틀리면 404, 맞으면 200 이고 warm-up 한다', async () => {
    const body = JSON.stringify({ tags: ['public:staff'], paths: ['/about'] });
    const none = await fetch(`${CLIENT}/api/revalidate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
    const wrong = await fetch(`${CLIENT}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${'x'.repeat(40)}`,
      },
      body,
    });
    const ok = await fetch(`${CLIENT}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.INT_REVALIDATE_SECRET}`,
      },
      body,
    });
    expect(none.status).toBe(404);
    expect(wrong.status).toBe(404);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({
      revalidated: true,
      tags: ['public:staff'],
      paths: ['/about'],
      warmed: 1,
    });
  });

  test('R-3 추가: 대시보드 저장 뒤 첫 GET /about·/ 에 새 연출진이 있다', async ({
    request,
  }) => {
    // 홈을 한 번 받아 캐시를 채워 둔다(옛 화면이 남을 조건)
    await firstGetHtml('/');
    await firstGetHtml('/about');
    const created = await bff<{ id: string }>(request, 'POST', STAFF, {
      name,
      role: '연출',
      profileImageUrl: null,
      bio: null,
      displayOrder: 0,
      isVisible: true,
    });
    staffId = created.id;
    await settle();
    expect(await firstGetHtml('/about')).toContain(name);
    expect(await firstGetHtml('/')).toContain(name);
  });

  test('R-3 이름 변경: 첫 GET 이 새 이름이다', async ({ request }) => {
    await bff(request, 'PATCH', `${STAFF}/${staffId}`, { name: renamed });
    await settle();
    const about = await firstGetHtml('/about');
    expect(about).toContain(renamed);
    expect(about).not.toContain(`${name}<`);
  });

  test('R-3 노출 끄기: 첫 GET 에서 빠진다', async ({ request }) => {
    await bff(request, 'PATCH', `${STAFF}/${staffId}`, { isVisible: false });
    await settle();
    expect(await firstGetHtml('/about')).not.toContain(renamed);
    expect(await firstGetHtml('/')).not.toContain(renamed);
  });

  test('R-3 삭제: 노출을 다시 켠 뒤 지우면 첫 GET 에 없다', async ({
    request,
  }) => {
    await bff(request, 'PATCH', `${STAFF}/${staffId}`, { isVisible: true });
    await settle();
    expect(await firstGetHtml('/about')).toContain(renamed);
    await bff(request, 'DELETE', `${STAFF}/${staffId}`);
    await settle();
    expect(await firstGetHtml('/about')).not.toContain(renamed);
    expect(await firstGetHtml('/')).not.toContain(renamed);
  });

  test('T-SA 일정: 대시보드에서 연습 일정을 저장하면 첫 GET /apply 의 신청 선택지에 그 작품이 있다(public:schedules 태그)', async ({
    request,
  }) => {
    // 공연·반은 서버에 직접(재검증 없음) — 이것만으로는 /apply 가 옛 화면이어야 한다
    // 실행마다 다른 이름 — 이전 실행이 남긴 ISR 캐시와 섞이지 않게
    const title = `${PREFIX}모집작품-${Date.now()}`;
    const performance = await adminApi<{ id: string }>(
      'POST',
      '/admin/performances',
      {
        title,
        type: 'PLAY',
        status: 'ONGOING',
        description: null,
        posterImageUrl: null,
        detailImageUrls: [],
        isVisible: true,
      }
    );
    const klass = await adminApi<{ id: string }>(
      'POST',
      `/admin/performances/${performance.id}/classes`,
      {
        name: `${PREFIX}반`,
        daysOfWeek: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        startTime: '19:00',
        endTime: '21:00',
        deadline: null,
        location: null,
        status: 'ACTIVE',
      }
    );
    // 대조: 서버 직접 변경만으로는 ISR 캐시가 남아 첫 GET 에 아직 없다
    expect(await firstGetHtml('/apply')).not.toContain(title);
    // 일정 저장은 대시보드 BFF → public:schedules 재검증(/apply 의 선택지 fetch 가 이 태그를 단다)
    const date = new Date(Date.now() + 9 * 3600_000 + 3 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    await bff(request, 'POST', '/api/backend/v1/admin/schedules', {
      title: `${PREFIX}연습`,
      type: 'PRACTICE',
      startAt: `${date}T19:00:00+09:00`,
      endAt: null,
      location: null,
      description: null,
      classId: klass.id,
      performanceId: null,
    });
    await settle();
    expect(await firstGetHtml('/apply')).toContain(title);
  });
});
