// ----------------------------------------------------------------------
// SCR-D06 신청서 관리 문구(MSG-D06-*). 근거: 현행 Applications.tsx(S-code-20) · design SCR-D06 ·
// 사용자 결정 2026-11-19 D6("승인과 등록 분리") · develop §3.1 오류 코드. 코드값 라벨은 src/types/codes.ts.
// ----------------------------------------------------------------------
export const MSG_D06 = {
  /** 현행 Applications.tsx:122-123 · design SCR-D06 */
  TITLE: '참관 신청 관리',
  SUBTITLE: '작품 참관 및 방문 상담 신청을 관리합니다',
  /** 현행 Applications.tsx:127 "미처리 {n}건" */
  PENDING: (count: number) => `미처리 ${count}건`,
  /** 현행 Applications.tsx:142,152 (이모지 유지 — designer W4 D06) */
  TAB_OBSERVATION: '🎭 작품 참관',
  TAB_CONSULTATION: '💬 방문 상담',
  /** 현행 Applications.tsx:158-169 */
  FILTER_LABEL: '상태 필터:',
  FILTER_ALL: '전체',
  TOTAL: (count: number) => `총 ${count}건`,
  /** 표 머리 — 현행 Applications.tsx:185-192, 235-242 */
  COL_APPLICANT: '신청자',
  COL_PHONE: '연락처',
  COL_AGE_GENDER: '나이 / 성별',
  COL_PERFORMANCE: '연결 공연',
  COL_PREFERRED_DATE: '희망 날짜',
  COL_METHOD: '상담 방법',
  COL_PREFERRED_TIME: '희망 시간',
  COL_CREATED: '신청일',
  COL_STATUS: '상태',
  COL_ACTIONS: '액션',
  /** 나이 표기 — 현행 Applications.tsx:201 `${age}세` */
  AGE: (age: number) => `${age}세`,
  /** 빈 상태 — 현행 Applications.tsx:178 */
  EMPTY_OBSERVATION: '참관 신청이 없습니다',
  EMPTY_CONSULTATION: '방문 상담 신청이 없습니다',
  /** 행 액션 aria-label·title — 현행 title "상세 보기"·"승인"·"거절"(Applications.tsx:426,438,448) */
  VIEW: '상세 보기',
  APPROVE: '승인',
  REJECT: '거절',
  /** 사용자 결정 2026-11-19 D6 — 승인된 신청의 별도 동작 · 등록 다이얼로그 제목 */
  REGISTER: '단원으로 등록',
  /** 보조 배지 — 사용자 결정 2026-11-19 D6 (neutral) */
  REGISTERED: '단원 등록됨',
  /** 상세 다이얼로그 제목 — 현행 Applications.tsx:291 */
  DETAIL_OBSERVATION: '🎭 작품 참관 신청 상세',
  DETAIL_CONSULTATION: '💬 방문 상담 신청 상세',
  /** 상세 라벨 — 현행 Applications.tsx:302-371 */
  PROCESSED_AT: (date: string) => `처리일: ${date}`,
  INFO_APPLICANT: '신청자',
  INFO_PHONE: '연락처',
  INFO_AGE: '나이',
  INFO_GENDER: '성별',
  INFO_PERFORMANCE: '연결 공연',
  INFO_PREFERRED_DATE: '희망 날짜',
  INFO_METHOD: '상담 방법',
  INFO_PREFERRED_TIME: '희망 시간',
  INFO_MOTIVATION: '신청 동기',
  INFO_QUESTION: '문의사항',
  INFO_CREATED: '신청일',
  /** 승인 확인 — 사용자 결정 2026-11-19 D6 + 현행 거절 틀(Applications.tsx:110) */
  CONFIRM_APPROVE: (name: string) => `${name}님의 신청을 승인하시겠습니까?`,
  /** 거절 확인 — 현행 Applications.tsx:110 */
  CONFIRM_REJECT: (name: string) => `${name}님의 신청을 거절하시겠습니까?`,
  /** 등록 성공 스낵바 — 사용자 결정 2026-11-19 D6 */
  REGISTERED_SUCCESS: '단원으로 등록되었습니다.',
} as const;
