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
      // R3 — 캐스트 공개 스위치가 공연 PATCH 에 실린다
      tags: ['public:performances', 'public:cast'],
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
    // 가격 등급 단건 PATCH·DELETE(지휘자 추가 2026-11-20)
    expect(
      revalidateTargetsFor('PATCH', '/v1/admin/price-tiers/t-1', 200)
    ).toEqual({ tags: ['public:performances'], paths: ['/', '/works'] });
    expect(
      revalidateTargetsFor('DELETE', '/v1/admin/price-tiers/t-1', 204)?.tags
    ).toEqual(['public:performances']);
    expect(
      revalidateTargetsFor(
        'POST',
        `/v1/admin/performances/${PERF_ID}/price-tiers`,
        201
      )?.paths
    ).toContain(`/works/${PERF_ID}`);
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

  it('R3 배역·회차 지정·참여자·배우 쪽 연결은 public:cast 를 고른다', () => {
    expect(
      revalidateTargetsFor(
        'POST',
        `/v1/admin/performances/${PERF_ID}/roles`,
        201
      )
    ).toEqual({
      tags: ['public:cast'],
      paths: [`/works/${PERF_ID}`, '/actors'],
    });
    expect(
      revalidateTargetsFor(
        'PUT',
        `/v1/admin/performances/${PERF_ID}/credits/order`,
        200
      )?.tags
    ).toEqual(['public:cast']);
    expect(
      revalidateTargetsFor('PUT', '/v1/admin/shows/s/roles/r/cast', 200)?.tags
    ).toEqual(['public:cast']);
    expect(revalidateTargetsFor('PATCH', '/v1/admin/roles/r', 200)).toEqual({
      tags: ['public:cast'],
      paths: ['/actors'],
    });
    expect(revalidateTargetsFor('DELETE', '/v1/admin/credits/c', 204)).toEqual({
      tags: ['public:cast'],
      paths: ['/actors', '/about'],
    });
    expect(
      revalidateTargetsFor(
        'POST',
        `/v1/admin/members/${PERF_ID}/cast-roles`,
        201
      )?.tags
    ).toEqual(['public:actors', 'public:cast']);
    expect(
      revalidateTargetsFor('PATCH', `/v1/admin/staff/${PERF_ID}`, 200)?.paths
    ).toContain(`/about/staff/${PERF_ID}`);
  });

  it('U48 단체샷·팀샷·팀 구성·회차 팀 지정은 public:cast, 미리보기 토큰은 부르지 않는다', () => {
    const TEAM_ID = '0190f0a1-2b3c-7000-8000-0000000000aa';
    expect(
      revalidateTargetsFor(
        'POST',
        `/v1/admin/performances/${PERF_ID}/group-photos`,
        201
      )
    ).toEqual({
      tags: ['public:cast'],
      paths: [`/works/${PERF_ID}`, '/actors'],
    });
    expect(
      revalidateTargetsFor(
        'PUT',
        `/v1/admin/performances/${PERF_ID}/group-photos/order`,
        200
      )?.tags
    ).toEqual(['public:cast']);
    expect(
      revalidateTargetsFor(
        'PUT',
        `/v1/admin/team-accounts/${TEAM_ID}/photo`,
        200
      )
    ).toEqual({ tags: ['public:cast'], paths: ['/works'] });
    expect(
      revalidateTargetsFor(
        'DELETE',
        `/v1/admin/team-accounts/${TEAM_ID}/members/x`,
        204
      )?.tags
    ).toEqual(['public:cast']);
    expect(
      revalidateTargetsFor('PATCH', '/v1/admin/shows/abc', 200)?.tags
    ).toEqual(['public:performances', 'public:cast']);
    expect(
      revalidateTargetsFor('PUT', `/v1/admin/roles/r1/photos/p1`, 200)?.tags
    ).toEqual(['public:cast']);
    expect(
      revalidateTargetsFor(
        'POST',
        `/v1/admin/performances/${PERF_ID}/preview-token`,
        201
      )
    ).toBeNull();
    // 팀 비밀번호 재발급·사용 끄기는 공개 무관 그대로
    expect(
      revalidateTargetsFor(
        'POST',
        `/v1/admin/team-accounts/${TEAM_ID}/reset-password`,
        200
      )
    ).toBeNull();
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
