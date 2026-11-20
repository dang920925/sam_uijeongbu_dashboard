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
  /** 행 액션 aria-label·title — 현행 title "상세 보기"(Applications.tsx:426). (U39) 승인·거절 문구는 없앴다 */
  VIEW: '상세 보기',
  /** 사용자 결정 2026-11-19 D6 — 등록 동작 · 등록 다이얼로그 제목(U39 — 승인 없이 미등록 신청 모두) */
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
  /** 등록 성공 스낵바 — 사용자 결정 2026-11-19 D6 */
  REGISTERED_SUCCESS: '단원으로 등록되었습니다.',

  // ── U31 보강(design §10·§10.1 · designer §18.3 "제안") — 한 행 목록·상세 드로어 ──
  /** 머리 상자 — designer §18.3 "미처리 [n]건 · 연락 전 [n]건" */
  PENDING_UNCONTACTED: (pending: number, uncontacted: number) =>
    `미처리 ${pending}건 · 연락 전 ${uncontacted}건`,
  /** 유형 pill·유형 열 — designer §18.3 */
  TYPE_GROUP: '유형',
  TYPE_ALL: '전체',
  TYPE_OBSERVATION: '참관',
  TYPE_CONSULTATION: '상담',
  /** 필터 라벨 — designer §18.3 확인 필요 ⑥(제안) */
  FILTER_WORK: '작품',
  FILTER_WORK_ALL: '전체 작품',
  FILTER_CONTACT: '연락',
  FILTER_PROGRESS: '진행',
  CONTACT_BEFORE: '연락 전',
  CONTACT_DONE: '연락 완료',
  /** 결과 없음 — designer §18.3 */
  EMPTY_FILTERED: '조건에 맞는 신청이 없습니다',
  /** 열 머리 — designer §18.3 확인 필요 ⑥(제안) */
  COL_TYPE: '유형',
  COL_NAME_PHONE: '이름 / 연락처',
  COL_NAME: '이름',
  COL_WORK: '작품',
  COL_SCHEDULE: '희망 일정',
  COL_CONTACT: '연락',
  COL_PROGRESS: '진행',
  COL_RECEIVED: '접수일',
  /** 정렬 버튼 이름(스크린리더) — "{열} 정렬" */
  SORT_BY: (column: string) => `${column} 정렬`,
  /** 작품 칸 — design §10 "참관 {작품명}" · 넘침 "+n" · 상담 "아직 모르겠어요" */
  WORK_OBSERVATION: (title: string) => `참관 ${title}`,
  WORK_MORE: (count: number) => `+${count}`,
  WORK_MORE_LABEL: (count: number) => `작품 ${count}개 더`,
  WORK_UNDECIDED: '아직 모르겠어요',
  /** U29 — design §8 "일정 취소됨"·"사유: {사유}"(제안) */
  SCHEDULE_CANCELLED: '일정 취소됨',
  CANCEL_REASON: (reason: string) => `사유: ${reason}`,
  /** 진행 Label 버튼 이름 — designer §18.3 시안 aria-label */
  PROGRESS_CHANGE: (label: string) => `진행 단계 ${label}, 바꾸기`,
  PROGRESS_LOCKED: (label: string) => `진행 단계 ${label}(거절된 신청)`,
  /** 상세 드로어 — designer §18.3 */
  DRAWER_CREATED: (date: string) => `신청일 ${date}`,
  INFO_OBSERVATION_WORK: '참관 작품',
  INFO_INTEREST_WORK: '관심 작품',
  INFO_HOPE_WORK: '희망 작품',
  INFO_METHOD_TIME: '상담 방법 · 희망 시간',
  SEC_CONTACT: '연락',
  SEC_PROGRESS: '진행 단계',
  MEMO: '메모',
  MEMO_PLACEHOLDER: '예: 12/6 참관 안내 문자 보냄',
  MEMO_MAX: 200,
  MEMO_COUNT: (length: number) => `${length}/200`,
  PHONE_CALL: (phone: string) => `${phone} 전화 걸기`,
} as const;
