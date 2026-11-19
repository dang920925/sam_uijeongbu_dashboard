// ----------------------------------------------------------------------
// 서버 전용 환경변수(Route Handler 에서만 import — 가이드 A3 경계, A13).
// - API_BASE_URL: NestJS 서버 배포 URL(예 https://sam-uijeongbu-server.vercel.app). 서버 경로 `/api/v1/...` 를 붙인다.
// - MOCK_BACKEND=true: 서버 없이 개발·E2E 할 때 BFF 가 메모리 목 백엔드(src/_mock)로 응답한다(develop §8.8 "계약 mock").
//   Vercel 에서는 켤 수 없다(실수로 운영에 목이 뜨는 것을 막는 fail-fast — style-guide §8.5).
// ----------------------------------------------------------------------
export interface ServerConfig {
  apiBaseUrl: string;
  isMockBackend: boolean;
  isProduction: boolean;
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
  };
}
