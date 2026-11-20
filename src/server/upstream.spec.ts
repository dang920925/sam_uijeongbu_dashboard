// @vitest-environment node
import {
  buildUpstreamHeaders,
  callUpstream,
  type UpstreamRequest,
} from '@/src/server/upstream';

const BASE: UpstreamRequest = {
  method: 'GET',
  path: '/v1/admin/staff',
  search: '',
  token: 'token-1',
  contentType: null,
  body: null,
  visitorIp: '203.0.113.7',
  bffPath: '/api/backend/v1/admin/staff',
};

describe('buildUpstreamHeaders', () => {
  it('Bearer·중계 비밀·방문자 IP 를 붙인다', () => {
    // Act
    const headers = buildUpstreamHeaders(BASE, 'relay-secret');

    // Assert
    expect(headers.get('authorization')).toBe('Bearer token-1');
    expect(headers.get('x-relay-secret')).toBe('relay-secret');
    expect(headers.get('x-visitor-ip')).toBe('203.0.113.7');
    expect(headers.get('cookie')).toBeNull();
  });

  it('비밀·방문자 IP 가 없으면 그 헤더를 보내지 않는다', () => {
    // Act
    const headers = buildUpstreamHeaders(
      { ...BASE, visitorIp: null, token: null },
      null
    );

    // Assert
    expect(headers.has('x-relay-secret')).toBe(false);
    expect(headers.has('x-visitor-ip')).toBe(false);
    expect(headers.has('authorization')).toBe(false);
  });
});

describe('callUpstream', () => {
  beforeEach(() => {
    vi.stubEnv('MOCK_BACKEND', '');
    vi.stubEnv('API_BASE_URL', 'http://upstream.test');
    vi.stubEnv('RELAY_SECRET', 'relay-secret');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('서버에 닿지 못하면 503 COMMON_005 JSON 을 돌려준다', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('fetch failed'))
    );

    // Act
    const response = await callUpstream(BASE);

    // Assert
    expect(response.status).toBe(503);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toMatchObject({
      statusCode: 503,
      status: 'Service Unavailable',
      message: '서비스를 일시적으로 이용할 수 없습니다.',
      code: 'COMMON_005',
      path: '/api/backend/v1/admin/staff',
    });
  });

  it('서버가 응답한 오류는 그대로 돌려주고 시간 제한 신호를 붙인다', async () => {
    // Arrange
    const upstream = new Response('{"code":"STF_001"}', { status: 404 });
    const fetchMock = vi.fn().mockResolvedValue(upstream);
    vi.stubGlobal('fetch', fetchMock);

    // Act
    const response = await callUpstream(BASE);

    // Assert
    expect(response).toBe(upstream);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://upstream.test/api/v1/admin/staff');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(new Headers(init.headers).get('x-relay-secret')).toBe(
      'relay-secret'
    );
  });
});
