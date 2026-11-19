// ----------------------------------------------------------------------
// 브라우저에서 쓰는 전역 설정. NEXT_PUBLIC_* 는 쓰지 않는다(develop §7.3 — BFF 만 서버 주소를 안다).
// 서버 전용 환경변수는 src/server/server-config.ts 에서만 읽는다.
// ----------------------------------------------------------------------

/** 브라우저 → BFF 프록시 접두사. 서버 `/api/v1/...` 로 중계된다(app/api/backend/[...path]). */
export const BFF_API_PREFIX = '/api/backend/v1';

/** 메타 title — 현행 index.html "SAM 의정부 대시보드" */
export const APP_TITLE = 'SAM 의정부 대시보드';
