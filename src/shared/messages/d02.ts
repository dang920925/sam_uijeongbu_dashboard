// ----------------------------------------------------------------------
// SCR-D02 요약 문구(MSG-D02-*) — 근거: 현행 Dashboard.tsx(S-code-20) · design SCR-D02 · designer W3 D02.
// 오류 문구는 기획·현행에 없다(design "오류 다시 시도(신설 — 문구 확인 필요)") → designer 자리표시를 사용자가 확정(2026-11-19).
// ----------------------------------------------------------------------
export const MSG_D02 = {
  /** 머리 — Dashboard.tsx:75-76 */
  TITLE: '대시보드',
  SUBTITLE: 'SAM 의정부 현황 요약',
  /** KPI — Dashboard.tsx:81-108 */
  KPI_PERFORMANCES: '전체 공연',
  KPI_PERFORMANCES_DESC: (ongoing: number, upcoming: number) =>
    `진행중 ${ongoing}개 · 예정 ${upcoming}개`,
  KPI_ACTORS: '등록 배우',
  KPI_ACTORS_DESC: '전체 배우 회원',
  KPI_PENDING: '대기 신청서',
  KPI_PENDING_DESC: '승인 대기 중',
  KPI_SCHEDULES: '등록 일정',
  KPI_SCHEDULES_DESC: '전체 일정 수',
  /** 카드 제목 — Dashboard.tsx:115,148 */
  RECENT_PERFORMANCES: '최근 공연',
  PENDING_APPLICATIONS: '대기 중인 신청서',
  /** 빈 — Dashboard.tsx:119,152 */
  RECENT_EMPTY: '등록된 공연이 없습니다',
  PENDING_EMPTY: '대기 중인 신청서가 없습니다',
  /** 오류 — MSG-D02-ERROR(designer.md §3.3 자리표시 → 사용자 결정 2026-11-19 확정) */
  ERROR: '일시적인 오류로 현황을 불러오지 못했습니다',
} as const;
