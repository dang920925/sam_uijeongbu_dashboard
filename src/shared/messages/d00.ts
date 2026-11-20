// ----------------------------------------------------------------------
// SCR-D00 대시보드 공용(사이드바·헤더) 문구 — 현행 Layout.tsx:14-21,37,69,78 + D5 메뉴 2개(design SCR-D00).
// ----------------------------------------------------------------------
export const MSG_D00 = {
  LOGO: 'SAM 의정부',
  /** 레일(md) 로고 — designer W3 `.ad-rail__logo` "SAM" */
  RAIL_LOGO: 'SAM',
  HEADER: 'SAM 의정부 관리자 대시보드',
  NAV_DASHBOARD: '대시보드',
  NAV_PERFORMANCES: '공연 관리',
  NAV_MEMBERS: '단원 관리',
  NAV_APPLICATIONS: '신청서 관리',
  NAV_GALLERY: '갤러리',
  NAV_SCHEDULES: '일정 관리',
  NAV_STAFF: '연출진 관리',
  NAV_POPUPS: '팝업 관리',
  /** R1(U24·U25) 신규 메뉴 — design §6.1 사이드바 순서(제안) · designer SHELL-ADMIN-R1 시안 */
  NAV_RESERVATIONS: '예매 관리',
  NAV_ADMISSION: '입장 체크',
  /** U34 연습실 예약 목록(관리자) */
  NAV_ROOM_RESERVATIONS: '연습실 예약',
  NAV_ACCOUNT: '계정 설정',
  LOGOUT: '로그아웃',
  /** 햄버거 aria-label — 접근성 신규(자체 결정, 현행 햄버거 없음) */
  OPEN_MENU: '메뉴 열기',
  NAV_LABEL: '관리자 메뉴',
  /** (U40) 메뉴 배지 이름 — 지휘자 명세 2026-11-20 "입금 대기 3건"(연락 전은 같은 틀 — 제안) */
  NAV_BADGE_RESERVATIONS: (count: number) => `입금 대기 ${count}건`,
  NAV_BADGE_APPLICATIONS: (count: number) => `연락 전 ${count}건`,
  /** 99 초과 표시 */
  NAV_BADGE_OVERFLOW: '99+',
} as const;

/** 404·오류 화면(가이드 A4 신설) — 대시보드용 문구는 기획에 없다 → designer 제안 문구 — 사용자 확정 2026-11-19 "제안 문구 그대로" */
export const MSG_D00_STATE = {
  NOT_FOUND: '페이지를 찾을 수 없습니다',
  ERROR: '일시적인 오류가 발생했습니다',
  /** 이동 버튼 라벨 = 현행 메뉴 라벨 "대시보드" */
  GO_DASHBOARD: '대시보드',
} as const;
