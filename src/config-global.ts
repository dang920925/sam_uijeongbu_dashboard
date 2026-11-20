// ----------------------------------------------------------------------
// 브라우저에서 쓰는 전역 설정. NEXT_PUBLIC_* 는 쓰지 않는다(develop §7.3 — BFF 만 서버 주소를 안다).
// 서버 전용 환경변수는 src/server/server-config.ts 에서만 읽는다.
// ----------------------------------------------------------------------

/** 브라우저 → BFF 프록시 접두사. 서버 `/api/v1/...` 로 중계된다(app/api/backend/[...path]). */
export const BFF_API_PREFIX = '/api/backend/v1';

/** 메타 title — 현행 index.html "SAM 의정부 대시보드" */
export const APP_TITLE = 'SAM 의정부 대시보드';

/** PWA 이름(U37 — 기획 §26 "SAM 의정부 관리") · 홈 화면 아이콘 아래 짧은 이름(자체 결정) */
export const PWA_APP_NAME = 'SAM 의정부 관리';
export const PWA_SHORT_NAME = 'SAM 관리';
