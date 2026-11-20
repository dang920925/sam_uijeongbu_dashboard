// ----------------------------------------------------------------------
// 연동 E2E 도우미(리드 소유) — 실제 서버(:4200 등)와 로컬 DB 에 붙어 "채운 상태" 픽스처를 만들고 지운다.
// - 픽스처는 화면이 아니라 서버 API 로 직접 만든다: 관리 API(Bearer — 픽스처 관리자 계정),
//   신청은 공개 API + X-Relay-Secret(홈페이지 BFF 와 같은 경로). 앱의 BFF·화면은 검증 대상이라 거치지 않는다.
// - 이름·제목에는 반드시 fixturePrefix(tag) 접두사를 붙인다. 정리는 그 접두사 행만 지운다(역할 문서 §3).
//   소프트 삭제 행도 남지 않게 로컬 DB 관리 계정(docker exec psql)으로 지운다 — 런타임 계정은 DELETE 권한이 없다.
// - 로컬 DB 가 아니면 쓰지 않는다: 컨테이너 이름·DB 이름은 integration 전용 값만 받는다.
// 환경변수(리드가 playwright 실행 때 넣는다): INT_API_BASE_URL · INT_RELAY_SECRET · INT_ADMIN_USERNAME ·
//   INT_ADMIN_PASSWORD · INT_DB_CONTAINER · INT_DB_NAME · INT_FIXTURE_BASE
// ----------------------------------------------------------------------
import { execFileSync } from 'node:child_process';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`연동 E2E 환경변수 ${key} 가 없습니다.`);
  return value;
}

export const INT_API_BASE_URL = (
  process.env.INT_API_BASE_URL ?? 'http://localhost:4200'
).replace(/\/+$/, '');

/** 모든 연동 픽스처의 공통 접두사(작업자는 fixture-integration-w<n>-) */
export const FIXTURE_BASE =
  process.env.INT_FIXTURE_BASE ?? 'fixture-integration-';

/** 스펙 파일마다 다른 접두사 — 예) fixturePrefix('works') → fixture-integration-works- */
export function fixturePrefix(tag: string): string {
  return `${FIXTURE_BASE}${tag}-`;
}

let cachedToken: string | null = null;

/** 픽스처 관리자 계정으로 서버에 직접 로그인한 access token(파일 안에서 재사용) */
export async function adminToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  const response = await fetch(`${INT_API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: requireEnv('INT_ADMIN_USERNAME'),
      password: requireEnv('INT_ADMIN_PASSWORD'),
    }),
  });
  if (!response.ok) {
    throw new Error(`픽스처 관리자 로그인 실패 ${response.status}`);
  }
  const body = (await response.json()) as { accessToken: string };
  cachedToken = body.accessToken;
  return cachedToken;
}

/** 관리 API 직접 호출(경로는 '/admin/...' — /api/v1 뒤). 실패하면 상태·본문과 함께 던진다. */
export async function adminApi<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(`${INT_API_BASE_URL}/api/v1${path}`, {
    method,
    headers: {
      authorization: `Bearer ${await adminToken()}`,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok)
    throw new Error(`${method} ${path} → ${response.status} ${text}`);
  return (text ? JSON.parse(text) : undefined) as T;
}

/** 공개 신청 접수(중계 비밀 포함) — 응답 상태·본문을 그대로 돌려준다 */
export async function relayApplication(
  body: Record<string, unknown>
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${INT_API_BASE_URL}/api/v1/applications`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-relay-secret': requireEnv('INT_RELAY_SECRET'),
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

/** 공개 POST 중계(예매 접수 /reservations · 예매 확인 /reservations/lookup 등) — 중계 비밀 포함, 상태·본문 그대로 */
export async function relayPost(
  path: string,
  body: Record<string, unknown>
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${INT_API_BASE_URL}/api/v1${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-relay-secret': requireEnv('INT_RELAY_SECRET'),
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

/** 2×3 회색 PNG — 업로드 흐름용 최소 이미지 */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAEElEQVR4nGM4ffUhEDGgUACdUA8HMpQj4AAAAABJRU5ErkJggg==',
  'base64'
);

export type UploadPurpose =
  | 'PERFORMANCE_POSTER'
  | 'PERFORMANCE_DETAIL'
  | 'ACTOR_PROFILE'
  | 'STAFF_PROFILE'
  | 'GALLERY'
  | 'POPUP';

/** 서명 URL 업로드(FN-18)를 실제로 거쳐 저장소 공개 URL 을 돌려준다 */
export async function uploadFixtureImage(
  purpose: UploadPurpose
): Promise<string> {
  const upload = await adminApi<{ signedUrl: string; publicUrl: string }>(
    'POST',
    '/admin/uploads',
    { purpose, contentType: 'image/png', size: TINY_PNG.byteLength }
  );
  const put = await fetch(upload.signedUrl, {
    method: 'PUT',
    headers: { 'content-type': 'image/png', 'x-upsert': 'false' },
    body: TINY_PNG,
  });
  if (!put.ok) throw new Error(`이미지 PUT 실패 ${put.status}`);
  return upload.publicUrl;
}

const DB_CONTAINER = process.env.INT_DB_CONTAINER ?? 'sam-uijeongbu-db-int';
const DB_NAME = process.env.INT_DB_NAME ?? 'sam_uijeongbu';

function psql(sql: string, prefix: string): void {
  if (!/^[a-z0-9_]+$/.test(DB_NAME) || !DB_NAME.startsWith('sam_uijeongbu')) {
    throw new Error(`연동 E2E 는 로컬 sam_uijeongbu* DB 만 씁니다: ${DB_NAME}`);
  }
  execFileSync(
    'docker',
    [
      'exec',
      '-i',
      DB_CONTAINER,
      'psql',
      '-U',
      'postgres',
      '-d',
      DB_NAME,
      '-q',
      '-v',
      'ON_ERROR_STOP=1',
      '-v',
      `p=${prefix}%`,
    ],
    { input: sql, stdio: ['pipe', 'ignore', 'inherit'] }
  );
}

// 신청서는 불변 트리거가 있지만 DELETE 는 막지 않는다(파기 경로). 접두사 행만 지운다.
// 팝업은 이름 칼럼이 없어 link_url 에 접두사를 넣는 규칙이다(예: https://example.com/<접두사>).
// R1(예매): 예매는 공연·회차를 RESTRICT 로 잡으므로 공연보다 먼저 지운다(줄·입장 기록은 CASCADE).
// 회차·예매 설정·가격 등급은 공연 삭제에 CASCADE. 관리자 등록 예매의 예매자 이름도 접두사 규칙.
const CLEANUP_SQL = `
DELETE FROM reservations WHERE booker_name LIKE :'p'
  OR performance_id IN (SELECT id FROM performances WHERE title LIKE :'p');
DELETE FROM applications WHERE applicant_name LIKE :'p';
DELETE FROM schedules WHERE title LIKE :'p';
DELETE FROM galleries WHERE description LIKE :'p';
DELETE FROM staff WHERE name LIKE :'p';
DELETE FROM popups WHERE link_url LIKE 'https://example.com/' || :'p';
DELETE FROM members WHERE name LIKE :'p';
DELETE FROM performances WHERE title LIKE :'p';
`;

/** 접두사(기본: 모든 연동 픽스처)로 시작하는 행만 영구 삭제한다 */
export function cleanupFixtures(prefix: string = FIXTURE_BASE): void {
  if (!prefix.startsWith('fixture-integration-')) {
    throw new Error(`픽스처 접두사가 아닙니다: ${prefix}`);
  }
  psql(CLEANUP_SQL, prefix);
}

/** 픽스처 관리자 계정들의 로그인 잠금을 푼다(잠금 시험 뒤) */
export function resetFixtureAdminLocks(): void {
  psql(
    `UPDATE admins SET consecutive_failures = 0, locked_until = NULL, hard_locked_at = NULL
     WHERE username LIKE 'fixture-integration-%';`,
    FIXTURE_BASE
  );
}
