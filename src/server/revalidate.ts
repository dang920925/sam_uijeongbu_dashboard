// ----------------------------------------------------------------------
// 홈페이지 즉시 반영(U27, FN-45 — develop §12.1) — 서버 전용(Route Handler 에서만 import).
// 공용 BFF 프록시가 `/admin/*` 의 POST·PUT·PATCH·DELETE 가 2xx 로 끝나면 `after()` 안에서
// 홈페이지 `POST {CLIENT_PUBLIC_URL}/api/revalidate`(Bearer REVALIDATE_SECRET)를 부른다.
// 실패·시간 초과(5초)는 console.warn 만 — 관리 작업 응답·상태코드에 영향 없음(이미 응답함). 60초 안전망은 홈페이지가 유지.
// 경로 → 태그·경로 표는 develop §12.1 표 그대로 + R3: 배역·회차 지정·참여자·배우 쪽 연결·캐스트 공개 스위치는
// public:cast(홈페이지의 작품 캐스트·배우 상세·연출진 상세 요청이 모두 이 태그를 단다).
// ----------------------------------------------------------------------
import { readRevalidateConfig } from '@/src/server/server-config';

export type PublicTag =
  | 'public:performances'
  | 'public:actors'
  | 'public:staff'
  | 'public:schedules'
  | 'public:galleries'
  | 'public:popups'
  | 'public:cast';

export interface RevalidateTargets {
  tags: PublicTag[];
  paths: string[];
}

/** 재검증 호출 시간 제한(develop §12.1) */
export const REVALIDATE_TIMEOUT_MS = 5_000;

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function idPath(prefix: string, id: string | undefined): string[] {
  return id && UUID.test(id) ? [`${prefix}/${id}`] : [];
}

/**
 * 관리 요청 → 무효화할 공개 태그·경로. 대상이 아니면(GET·실패 응답·공개 무관 경로) null.
 * upstreamPath 는 서버 기준 `/v1/admin/...`(쿼리 제외).
 */
export function revalidateTargetsFor(
  method: string,
  upstreamPath: string,
  status: number
): RevalidateTargets | null {
  if (!MUTATING.has(method.toUpperCase())) return null;
  if (status < 200 || status >= 300) return null;
  const match = /^\/v1\/admin\/(.+)$/.exec(upstreamPath);
  if (!match) return null;
  const segments = match[1].split('/').filter(Boolean);
  const [resource, id, sub] = segments;
  // R3 — 공연 아래 배역·격자·참여자, 회차 지정(shows/{id}/roles/{roleId}/cast)은 캐스트만 바뀐다
  if (
    (resource === 'performances' &&
      (sub === 'roles' || sub === 'credits' || sub === 'show-casts')) ||
    (resource === 'shows' && sub === 'roles')
  ) {
    return {
      tags: ['public:cast'],
      paths: [
        ...(resource === 'performances' ? idPath('/works', id) : []),
        '/actors',
      ],
    };
  }
  switch (resource) {
    case 'roles':
      return { tags: ['public:cast'], paths: ['/actors'] };
    case 'credits':
      return { tags: ['public:cast'], paths: ['/actors', '/about'] };
    case 'performances':
    case 'classes':
    case 'shows':
    // 가격 등급 단건 PATCH·DELETE·링크 재발급(develop §11.10) — 지휘자 추가 2026-11-20
    case 'price-tiers':
    // 가격 등급 단건 PATCH·DELETE·링크 재발급(develop §11.10) — 작품 상세 예매 버튼·등급 표시(지휘자 추가 2026-11-20)
    case 'price-tiers':
      return {
        // 공연 행 PATCH 는 캐스트 공개 스위치(castPublic)도 담을 수 있다 → public:cast 함께
        tags:
          resource === 'performances' && id && !sub
            ? ['public:performances', 'public:cast']
            : ['public:performances'],
        paths: [
          '/',
          '/works',
          ...(resource === 'performances' ? idPath('/works', id) : []),
        ],
      };
    case 'members':
      // 초대 코드(`members/invite-codes`·`members/{id}/invite-code`)는 공개 페이지에 안 나온다
      if (id === 'invite-codes' || sub === 'invite-code') return null;
      return {
        // R3 배우 쪽 SAM 출연작·참여 직함(cast-roles · credits)은 캐스트도 바뀐다
        tags:
          sub === 'cast-roles' || sub === 'credits'
            ? ['public:actors', 'public:cast']
            : ['public:actors'],
        paths: ['/actors', ...idPath('/actors', id)],
      };
    case 'staff':
      return {
        tags: ['public:staff'],
        paths: ['/', '/about', ...idPath('/about/staff', id)],
      };
    case 'schedules':
      return { tags: ['public:schedules'], paths: ['/schedule'] };
    case 'galleries':
      return { tags: ['public:galleries'], paths: ['/'] };
    case 'popups':
      return { tags: ['public:popups'], paths: ['/'] };
    default:
      // uploads · applications · reservations · account · deposit-notifications 등 — 공개 무관
      return null;
  }
}

/**
 * 홈페이지 재검증을 부른다. 설정(CLIENT_PUBLIC_URL + 32자 이상 REVALIDATE_SECRET)이 없으면 건너뛴다.
 * 절대 던지지 않는다 — 실패는 console.warn(비밀·본문은 로그에 남기지 않음).
 */
export async function notifyClientRevalidate(
  targets: RevalidateTargets,
  fetchImpl: typeof fetch = fetch
): Promise<boolean> {
  const config = readRevalidateConfig();
  if (!config) return false;
  try {
    const response = await fetchImpl(`${config.clientUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.secret}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(targets),
      signal: AbortSignal.timeout(REVALIDATE_TIMEOUT_MS),
      cache: 'no-store',
    });
    if (!response.ok) {
      console.warn(
        `[revalidate] 홈페이지 재검증 실패 ${response.status} (${targets.tags.join(',')})`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn(
      `[revalidate] 홈페이지 재검증 호출 오류 (${targets.tags.join(',')}): ${
        error instanceof Error ? error.name : 'unknown'
      }`
    );
    return false;
  }
}
