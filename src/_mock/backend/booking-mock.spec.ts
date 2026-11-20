// @vitest-environment node
// 목 백엔드 예매 계약 흐름(develop §11.4·§11.10) — 화면 E2E 가 기대는 목 동작을 빠르게 확인한다.
import { handleMockRequest } from '@/src/_mock/backend/mock-router';
import { getStore, resetStoreData } from '@/src/_mock/backend/mock-store';

const TOKEN = 'spec-token';

async function call<T = Record<string, unknown>>(
  method: string,
  path: string,
  body?: unknown,
  token: string | null = TOKEN
): Promise<{ status: number; body: T }> {
  const [pathname, search = ''] = path.split('?');
  const res = await handleMockRequest({
    method,
    path: pathname,
    search: search ? `?${search}` : '',
    token,
    contentType: body === undefined ? null : 'application/json',
    body:
      body === undefined
        ? null
        : (new TextEncoder().encode(JSON.stringify(body))
            .buffer as ArrayBuffer),
    visitorIp: null,
    bffPath: path,
  });
  const text = await res.text();
  return { status: res.status, body: (text ? JSON.parse(text) : {}) as T };
}

async function setup() {
  const perf = await call<{ id: string }>('POST', '/v1/admin/performances', {
    title: 'fixture-spec-공연',
    type: 'PLAY',
    status: 'UPCOMING',
    description: null,
    posterUrl: null,
    detailImageUrls: [],
    isVisible: true,
  });
  const performanceId = perf.body.id;
  const show = await call<{ id: string }>(
    'POST',
    `/v1/admin/performances/${performanceId}/shows`,
    {
      showDate: '2099-12-12',
      startTime: '14:00',
      totalSeats: 4,
      bookingOpenAt: '2000-01-01T00:00:00.000Z',
    }
  );
  const tier = await call<{ id: string }>(
    'POST',
    `/v1/admin/performances/${performanceId}/price-tiers`,
    { name: '일반', price: 20000, visibility: 'PUBLIC' }
  );
  return { performanceId, showId: show.body.id, tierId: tier.body.id };
}

describe('목 예매 계약', () => {
  beforeEach(() => {
    resetStoreData();
    const store = getStore();
    store.sessions.set(TOKEN, Date.now() + 60_000);
    store.sessionVersions.set(TOKEN, 0);
  });

  it('0원 등급은 만들 수 없고 링크 전용 등급은 토큰을 받는다', async () => {
    // Arrange
    const { performanceId } = await setup();
    // Act
    const free = await call(
      'POST',
      `/v1/admin/performances/${performanceId}/price-tiers`,
      { name: '무료', price: 0, visibility: 'PUBLIC' }
    );
    const staff = await call<{ linkToken: string }>(
      'POST',
      `/v1/admin/performances/${performanceId}/price-tiers`,
      { name: '스태프', price: 10000, visibility: 'LINK_ONLY' }
    );
    // Assert
    expect(free.status).toBe(400);
    expect(staff.status).toBe(201);
    expect(staff.body.linkToken).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it('관리자 수동 등록: 직접 입력 2매·0원·확정·연락처 없음 → 좌석 차감, 관리자 등록(S48 ①)', async () => {
    // Arrange
    const { showId } = await setup();
    // Act
    const created = await call<Record<string, unknown>>(
      'POST',
      '/v1/admin/reservations',
      {
        showId,
        bookerName: '초대 손님',
        customLine: { quantity: 2, amount: 0 },
        status: 'CONFIRMED',
        memo: '초대 — 연출 지인',
      }
    );
    const shows = await call<{ items: { remainingSeats: number }[] }>(
      'GET',
      `/v1/admin/shows?from=2099-01-01`
    );
    // Assert
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      source: 'ADMIN',
      amount: 0,
      bookerPhone: null,
      depositDueAt: null,
      deadlinePassed: false,
      quantity: 2,
    });
    expect(shows.body.items[0].remainingSeats).toBe(2);
  });

  it('입장 증감은 매수를 넘으면 409 RSV_010, 연락처 없는 예매는 phoneLast4 null(S20·S22)', async () => {
    // Arrange
    const { showId } = await setup();
    const created = await call<{ id: string }>(
      'POST',
      '/v1/admin/reservations',
      {
        showId,
        bookerName: '현장',
        customLine: { quantity: 1, amount: 0 },
        status: 'CONFIRMED',
      }
    );
    // Act
    const first = await call(
      'POST',
      `/v1/admin/reservations/${created.body.id}/admission`,
      { delta: 1 }
    );
    const second = await call<{ code: string }>(
      'POST',
      `/v1/admin/reservations/${created.body.id}/admission`,
      { delta: 1 }
    );
    const board = await call<{ items: { phoneLast4: string | null }[] }>(
      'GET',
      `/v1/admin/shows/${showId}/admission`
    );
    // Assert
    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('RSV_010');
    expect(board.body.items[0].phoneLast4).toBeNull();
  });

  it('계정을 바꾸면 이전 토큰은 401, 새 토큰은 유효하다(S32)', async () => {
    // Arrange
    vi.stubEnv('MOCK_ADMIN_USERNAME', 'fixture-admin');
    vi.stubEnv('MOCK_ADMIN_PASSWORD', 'fixture-password');
    // Act
    const changed = await call<{ accessToken: string }>(
      'PATCH',
      '/v1/admin/account',
      {
        currentPassword: 'fixture-password',
        newUsername: 'fixture-admin-2',
        newPassword: null,
      }
    );
    const oldToken = await call('GET', '/v1/auth/me');
    const newToken = await call(
      'GET',
      '/v1/auth/me',
      undefined,
      changed.body.accessToken
    );
    // Assert
    expect(changed.status).toBe(200);
    expect(oldToken.status).toBe(401);
    expect(newToken.status).toBe(200);
    vi.unstubAllEnvs();
  });
});
