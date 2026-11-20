// @vitest-environment node
import {
  notifyClientRevalidate,
  revalidateTargetsFor,
} from '@/src/server/revalidate';

const PERF_ID = '0190f0a1-2b3c-7000-8000-000000000001';

describe('revalidateTargetsFor (develop §12.1 R-1)', () => {
  it('공연·반·회차·예매 설정 변경은 public:performances 와 홈·작품 경로를 고른다', () => {
    expect(
      revalidateTargetsFor('PATCH', `/v1/admin/performances/${PERF_ID}`, 200)
    ).toEqual({
      tags: ['public:performances'],
      paths: ['/', '/works', `/works/${PERF_ID}`],
    });
    expect(
      revalidateTargetsFor(
        'PUT',
        `/v1/admin/performances/${PERF_ID}/booking-policy`,
        200
      )?.paths
    ).toContain(`/works/${PERF_ID}`);
    expect(
      revalidateTargetsFor(
        'POST',
        `/v1/admin/performances/${PERF_ID}/shows`,
        201
      )?.tags
    ).toEqual(['public:performances']);
    expect(revalidateTargetsFor('DELETE', '/v1/admin/shows/abc', 204)).toEqual({
      tags: ['public:performances'],
      paths: ['/', '/works'],
    });
    expect(
      revalidateTargetsFor('PATCH', '/v1/admin/classes/x', 200)?.tags
    ).toEqual(['public:performances']);
  });

  it('단원·연출진·일정·갤러리·팝업은 표의 태그·경로를 고른다', () => {
    expect(
      revalidateTargetsFor(
        'PUT',
        `/v1/admin/members/${PERF_ID}/actor-profile`,
        200
      )
    ).toEqual({
      tags: ['public:actors'],
      paths: ['/actors', `/actors/${PERF_ID}`],
    });
    expect(revalidateTargetsFor('DELETE', '/v1/admin/staff/x', 204)).toEqual({
      tags: ['public:staff'],
      paths: ['/', '/about'],
    });
    expect(revalidateTargetsFor('POST', '/v1/admin/schedules', 201)).toEqual({
      tags: ['public:schedules'],
      paths: ['/schedule'],
    });
    expect(
      revalidateTargetsFor('POST', '/v1/admin/galleries', 201)?.tags
    ).toEqual(['public:galleries']);
    expect(
      revalidateTargetsFor('PATCH', '/v1/admin/popups/x', 200)?.tags
    ).toEqual(['public:popups']);
  });

  it('GET·실패 응답·공개 무관 경로는 부르지 않는다', () => {
    expect(revalidateTargetsFor('GET', '/v1/admin/staff', 200)).toBeNull();
    expect(revalidateTargetsFor('POST', '/v1/admin/staff', 400)).toBeNull();
    expect(revalidateTargetsFor('DELETE', '/v1/admin/staff/x', 500)).toBeNull();
    for (const path of [
      '/v1/admin/uploads',
      '/v1/admin/applications/x/approve',
      '/v1/admin/reservations/x/confirm',
      '/v1/admin/account',
      '/v1/admin/members/invite-codes',
      `/v1/admin/members/${PERF_ID}/invite-code`,
      '/v1/auth/login',
    ]) {
      expect(revalidateTargetsFor('POST', path, 200)).toBeNull();
    }
  });
});

describe('notifyClientRevalidate', () => {
  const SECRET = 'x'.repeat(32);
  afterEach(() => vi.unstubAllEnvs());

  it('Bearer 비밀과 태그·경로 본문으로 홈페이지 재검증을 부른다', async () => {
    // Arrange
    vi.stubEnv('CLIENT_PUBLIC_URL', 'https://client.test/');
    vi.stubEnv('REVALIDATE_SECRET', SECRET);
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    // Act
    const ok = await notifyClientRevalidate(
      { tags: ['public:staff'], paths: ['/about'] },
      fetchMock
    );
    // Assert
    expect(ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://client.test/api/revalidate');
    expect(new Headers(init.headers).get('authorization')).toBe(
      `Bearer ${SECRET}`
    );
    expect(JSON.parse(String(init.body))).toEqual({
      tags: ['public:staff'],
      paths: ['/about'],
    });
  });

  it('비밀이 32자 미만이거나 주소가 없으면 부르지 않는다', async () => {
    // Arrange
    vi.stubEnv('CLIENT_PUBLIC_URL', 'https://client.test');
    vi.stubEnv('REVALIDATE_SECRET', 'short');
    const fetchMock = vi.fn();
    // Act
    const ok = await notifyClientRevalidate(
      { tags: ['public:staff'], paths: [] },
      fetchMock
    );
    // Assert
    expect(ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('실패·네트워크 오류는 던지지 않고 false 만 돌려준다', async () => {
    // Arrange
    vi.stubEnv('CLIENT_PUBLIC_URL', 'https://client.test');
    vi.stubEnv('REVALIDATE_SECRET', SECRET);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Act
    const failed = await notifyClientRevalidate(
      { tags: ['public:staff'], paths: [] },
      vi.fn().mockResolvedValue(new Response('', { status: 404 }))
    );
    const errored = await notifyClientRevalidate(
      { tags: ['public:staff'], paths: [] },
      vi.fn().mockRejectedValue(new TypeError('fetch failed'))
    );
    // Assert
    expect(failed).toBe(false);
    expect(errored).toBe(false);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(String(warn.mock.calls[0][0])).not.toContain(SECRET);
    warn.mockRestore();
  });
});
