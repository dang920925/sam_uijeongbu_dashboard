// ----------------------------------------------------------------------
// 모든 경로 상수(문자열 하드코딩 금지 — 가이드 A4). 경로는 현행 대시보드 라우트 그대로 + D5 신규 2개.
// ----------------------------------------------------------------------
export const paths = {
  login: '/login',
  dashboard: '/',
  performances: {
    root: '/performances',
    detail: (id: string) => `/performances/${id}`,
  },
  members: {
    root: '/members',
    /** 신청서 "단원 등록됨" 링크 → 해당 단원 패널을 연다(designer W4 제안 — front-end 판단, 자체 결정) */
    detail: (id: string) => `/members?member=${encodeURIComponent(id)}`,
  },
  applications: '/applications',
  gallery: '/gallery',
  schedules: '/schedules',
  staff: '/staff',
  popups: '/popups',
} as const;
