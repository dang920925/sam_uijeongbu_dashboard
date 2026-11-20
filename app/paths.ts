// ----------------------------------------------------------------------
// 모든 경로 상수(문자열 하드코딩 금지 — 가이드 A4). 경로는 현행 대시보드 라우트 그대로 + D5 신규 2개
// + R1(U24·U25) 신규: 회차·예매 탭(SCR-D11) · 예매 관리(D12) · 입장 체크(D13) · 계정 설정(D15).
// R3 배역·캐스팅(SCR-D14)은 `performances.cast(id)` 자리로 들어온다(design §6.1 탭 경로).
// ----------------------------------------------------------------------
export const paths = {
  login: '/login',
  dashboard: '/',
  performances: {
    root: '/performances',
    detail: (id: string) => `/performances/${id}`,
    /** SCR-D11 회차·예매 탭(공연 상세의 탭 — design §6 SCR-D11) */
    shows: (id: string) => `/performances/${id}/shows`,
    /** U34 팀 계정 탭(공연 상세의 탭 — design §13 SCR-D04 '팀 계정') */
    teams: (id: string) => `/performances/${id}/teams`,
    /** SCR-D14 배역·캐스팅 탭(R3 — design §6 SCR-D14) */
    cast: (id: string) => `/performances/${id}/cast`,
  },
  /** U34 연습실 예약 목록(관리자 — U23 캘린더 레이어는 T-SA 배포 뒤 연결) */
  roomReservations: '/room-reservations',
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
  /** SCR-D12 예매 관리(U24 R1) */
  reservations: '/reservations',
  /**
   * 예매 관리에서 특정 예매 열기(헤더 빠른 검색 → "예매 관리에서 보기", 지휘자 추가 요청 2026-11-20).
   * D12 는 performanceId 공연을 고르고 q=code 로 검색해 정확히 일치하는 행을 강조·상세를 연다.
   */
  reservationFocus: (performanceId: string, code: string) =>
    `/reservations?performanceId=${encodeURIComponent(performanceId)}&q=${encodeURIComponent(code)}`,
  /** SCR-D13 입장 체크(U24 R1) */
  admission: '/admission',
  /** 회차 입장 명단 인쇄·PDF 저장(오프라인 대비 — 지휘자 추가 2026-11-20). sort=code 면 예매번호순 */
  admissionPrint: (showId: string, sort?: 'name' | 'code') =>
    `/admission/${encodeURIComponent(showId)}/print${sort === 'code' ? '?sort=code' : ''}`,
  /** 입장 체크 특정 회차로(다른 회차 예매 안내 → 이동 버튼) */
  admissionShow: (showId: string) =>
    `/admission?showId=${encodeURIComponent(showId)}`,
  /** SCR-D15 계정 설정(U25 R1) */
  account: '/account',
} as const;
