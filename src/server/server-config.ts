// ----------------------------------------------------------------------
// 서버 전용 환경변수(Route Handler 에서만 import — 가이드 A3 경계, A13).
// - API_BASE_URL: NestJS 서버 배포 URL(예 https://sam-uijeongbu-server.vercel.app). 서버 경로 `/api/v1/...` 를 붙인다.
// - RELAY_SECRET: 서버·홈페이지와 같은 중계 비밀(qa1 U11 — J-16). BFF 가 방문자 IP 와 함께 보내면 서버가 그 IP 로
//   레이트리밋을 센다. 비어 있으면 보내지 않고, 서버는 오류 없이 BFF IP 로 센다(로그인·관리 기능은 그대로 동작).
// - MOCK_BACKEND=true: 서버 없이 개발·E2E 할 때 BFF 가 메모리 목 백엔드(src/_mock)로 응답한다(develop §8.8 "계약 mock").
//   Vercel 에서는 켤 수 없다(실수로 운영에 목이 뜨는 것을 막는 fail-fast — style-guide §8.5).
// ----------------------------------------------------------------------
export interface ServerConfig {
  apiBaseUrl: string;
  isMockBackend: boolean;
  isProduction: boolean;
  /** 서버 RELAY_SECRET 과 같은 값. 없으면 null */
  relaySecret: string | null;
}

export function readServerConfig(): ServerConfig {
  const isMockBackend = process.env.MOCK_BACKEND === 'true';
  const apiBaseUrl = (process.env.API_BASE_URL ?? '').replace(/\/+$/, '');
  if (isMockBackend && process.env.VERCEL) {
    throw new Error(
      'MOCK_BACKEND 는 Vercel 배포에서 켤 수 없습니다. 환경변수를 지우세요.'
    );
  }
  if (!isMockBackend && !apiBaseUrl) {
    throw new Error(
      'API_BASE_URL 이 비어 있습니다. .env.example 을 보고 서버 주소를 넣으세요(로컬 목은 MOCK_BACKEND=true).'
    );
  }
  return {
    apiBaseUrl,
    isMockBackend,
    isProduction: process.env.NODE_ENV === 'production',
    relaySecret: process.env.RELAY_SECRET || null,
  };
}

/** 비밀 최소 길이 — develop §12.1 "32자 미만이면 대시보드는 호출을 건너뛴다" */
export const REVALIDATE_SECRET_MIN_LENGTH = 32;

/**
 * 홈페이지 주소(develop §11.4 초대 링크 · §12.1 재검증 대상) — `CLIENT_PUBLIC_URL`, 끝 `/` 제거. 없으면 null.
 * 운영 = https://sam-uijeongbu-client.vercel.app
 */
export function readClientPublicUrl(): string | null {
  const value = (process.env.CLIENT_PUBLIC_URL ?? '')
    .trim()
    .replace(/\/+$/, '');
  return value === '' ? null : value;
}

/**
 * 홈페이지 재검증 호출 설정(U27 FN-45) — 주소와 32자 이상 비밀이 모두 있어야 켠다. 아니면 null(호출 건너뜀, 부팅은 계속).
 */
export function readRevalidateConfig(): {
  clientUrl: string;
  secret: string;
} | null {
  const clientUrl = readClientPublicUrl();
  const secret = process.env.REVALIDATE_SECRET ?? '';
  if (!clientUrl || secret.length < REVALIDATE_SECRET_MIN_LENGTH) return null;
  return { clientUrl, secret };
}
