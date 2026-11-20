import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  refreshSessionToken,
  shouldRefreshSession,
} from '@/src/server/session-refresh';
import { callUpstream } from '@/src/server/upstream';

vi.mock('@/src/server/upstream', () => ({ callUpstream: vi.fn() }));

const callUpstreamMock = vi.mocked(callUpstream);
const NOW = new Date('2026-11-20T00:00:00.000Z');
const DAY_S = 24 * 60 * 60;

/** exp 만 담은 서명 없는 JWT 모양(테스트 전용) */
function tokenExpiringIn(seconds: number): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: NOW.getTime() / 1000 + seconds })
  ).toString('base64url');
  return `fixture.${payload}.sig`;
}

describe('shouldRefreshSession', () => {
  it('남은 기간이 3일 미만이면 연장한다', () => {
    expect(shouldRefreshSession(tokenExpiringIn(3 * DAY_S - 1), NOW)).toBe(
      true
    );
    expect(shouldRefreshSession(tokenExpiringIn(60), NOW)).toBe(true);
  });

  it('3일 이상 남았으면 연장하지 않는다', () => {
    expect(shouldRefreshSession(tokenExpiringIn(3 * DAY_S), NOW)).toBe(false);
    expect(shouldRefreshSession(tokenExpiringIn(7 * DAY_S), NOW)).toBe(false);
  });

  it('이미 만료됐거나 exp 를 읽을 수 없으면 연장하지 않는다', () => {
    expect(shouldRefreshSession(tokenExpiringIn(-1), NOW)).toBe(false);
    expect(shouldRefreshSession('not-a-jwt', NOW)).toBe(false);
  });
});

describe('refreshSessionToken', () => {
  const input = {
    token: 'old.token.sig',
    visitorIp: '203.0.113.7',
    bffPath: '/api/backend/v1/auth/me',
  };

  beforeEach(() => callUpstreamMock.mockReset());

  it('서버 POST /v1/auth/refresh 를 그 토큰으로 부르고 새 토큰·만료를 돌려준다', async () => {
    callUpstreamMock.mockResolvedValue(
      Response.json({
        accessToken: 'new.token.sig',
        expiresAt: '2026-11-27T00:00:00.000Z',
      })
    );

    await expect(refreshSessionToken(input)).resolves.toEqual({
      accessToken: 'new.token.sig',
      expiresAt: '2026-11-27T00:00:00.000Z',
    });
    expect(callUpstreamMock).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/auth/refresh',
      search: '',
      token: 'old.token.sig',
      contentType: null,
      body: null,
      visitorIp: '203.0.113.7',
      bffPath: '/api/backend/v1/auth/me',
    });
  });

  it('세션 버전이 바뀌어 401 이면 null 이다', async () => {
    callUpstreamMock.mockResolvedValue(
      Response.json({ code: 'AUTH_003' }, { status: 401 })
    );

    await expect(refreshSessionToken(input)).resolves.toBeNull();
  });

  it('본문이 틀리거나 호출이 실패해도 던지지 않고 null 이다', async () => {
    callUpstreamMock.mockResolvedValueOnce(Response.json({ accessToken: 1 }));
    callUpstreamMock.mockRejectedValueOnce(new TypeError('network'));

    await expect(refreshSessionToken(input)).resolves.toBeNull();
    await expect(refreshSessionToken(input)).resolves.toBeNull();
  });
});
