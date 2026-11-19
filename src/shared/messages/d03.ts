// ----------------------------------------------------------------------
// SCR-D03 공연 관리 문구(MSG-D03-*) — 근거: 현행 Performances.tsx(S-code-20) · design SCR-D03 · designer W3 D03.
// 다이얼로그 문구는 공용 MSG_PERF_FORM(performance-form.ts), "노출"/"비노출" 은 MSG_COMMON.
// ----------------------------------------------------------------------
export const MSG_D03 = {
  /** 머리 — Performances.tsx:100-106 */
  TITLE: '공연 관리',
  SUBTITLE: '공연 목록을 관리합니다',
  ADD: '공연 추가',
  /** 표 머리 — Performances.tsx:118-122 + [D5] "노출" 열(designer W3 D03, 사용자 확정 2026-11-19 "제안 문구 그대로") */
  COL_TITLE: '공연명',
  COL_TYPE: '타입',
  COL_STATUS: '상태',
  COL_VISIBLE: '노출',
  COL_CREATED: '등록일',
  /** 빈 — Performances.tsx:113 */
  EMPTY: '등록된 공연이 없습니다',
  /** 목록 조회 오류 — 기획·현행·디자인에 문구 없음(design §3 공통 "오류 = … 다시 시도") → MSG-D03-ERROR(사용자 결정 2026-11-19 확정) */
  ERROR: '일시적인 오류로 공연 목록을 불러오지 못했습니다',
  /** 포스터 없음 자리 aria-label — designer W3 사용자 확정 2026-11-19 "제안 문구 그대로" */
  NO_POSTER: '포스터 없음',
  /** 행·카드 aria-label — design §3 공통 "현행 title 속성 '상세 보기' 재사용" */
  ROW_ARIA: (title: string) => `${title} 상세 보기`,
  /** 표 aria-label(접근성 전용) = 페이지 제목 */
  TABLE_ARIA: '공연 관리',
} as const;
