// ----------------------------------------------------------------------
// 대시보드 BFF 운영 조건 연동(리드, qa1) — 별도 실행에서만 돈다(기본 연동 실행에서는 skip, `--no-deps`).
// - INT_SCENARIO=server-down (QA1-003·U13): 앱의 API_BASE_URL 이 응답 없는 주소. BFF 는 503 COMMON_005 JSON,
//   화면은 기존 공용 문구(서버 message 를 노출하지 않음).
// - INT_SCENARIO=rate-limit (QA1-001·U11): 실제 로그인 레이트리밋(10/분)의 서버. BFF 앞 x-forwarded-for 로 방문자를
//   흉내 내면 서버가 방문자별로 센다. 브라우저가 보낸 X-Visitor-IP 는 BFF 가 버린다.
// ----------------------------------------------------------------------
import { expect, test, type APIRequestContext } from '@playwright/test';

const SCENARIO = process.env.INT_SCENARIO;

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('U13 서버 연결 실패', () => {
  test.skip(SCENARIO !== 'server-down', 'INT_SCENARIO=server-down 실행 전용');

  test('로그인·관리 프록시 BFF 는 503 COMMON_005 JSON 을 돌려준다', async ({
    request,
  }) => {
    const login = await request.post('/api/auth/login', {
      data: { username: 'x', password: 'y' },
    });
    expect(login.status()).toBe(503);
    expect(await login.json()).toMatchObject({
      statusCode: 503,
      status: 'Service Unavailable',
      code: 'COMMON_005',
      path: '/api/auth/login',
    });
    const proxy = await request.get('/api/backend/v1/admin/staff');
    expect(proxy.status()).toBe(503);
    expect(((await proxy.json()) as { code: string }).code).toBe('COMMON_005');
  });

  test('로그인 화면은 기존 공용 오류 문구를 보인다', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('아이디').fill('fixture-integration-down');
    await page.getByLabel('비밀번호').fill('fixture-password');
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(
      page.getByText('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText('서비스를 일시적으로 이용할 수 없습니다.')
    ).toHaveCount(0);
  });
});

test.describe('U11 방문자 IP 별 로그인 레이트리밋', () => {
  test.skip(SCENARIO !== 'rate-limit', 'INT_SCENARIO=rate-limit 실행 전용');

  const login = (request: APIRequestContext, headers: Record<string, string>) =>
    request.post('/api/auth/login', {
      data: { username: 'fixture-integration-nobody', password: 'wrong' },
      headers,
    });

  test('방문자 A 가 10회를 쓰면 11번째는 429, 방문자 B 는 따로 센다', async ({
    request,
  }) => {
    const visitorA = { 'x-forwarded-for': '203.0.113.21' };
    for (let index = 0; index < 10; index += 1) {
      expect((await login(request, visitorA)).status()).toBe(401);
    }
    const eleventh = await login(request, visitorA);
    expect(eleventh.status()).toBe(429);
    expect(((await eleventh.json()) as { code: string }).code).toBe(
      'COMMON_003'
    );
    expect(
      (await login(request, { 'x-forwarded-for': '203.0.113.22' })).status()
    ).toBe(401);
  });

  test('브라우저가 보낸 X-Visitor-IP 는 버려져 버킷을 바꾸지 못한다', async ({
    request,
  }) => {
    const forged = await login(request, {
      'x-forwarded-for': '203.0.113.21',
      'x-visitor-ip': '198.51.100.99',
      'x-relay-secret': 'forged',
    });
    expect(forged.status()).toBe(429);
  });
});
