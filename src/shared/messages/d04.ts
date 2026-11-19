// ----------------------------------------------------------------------
// SCR-D04 공연 상세·반 관리 문구(MSG-D04-*) — 화면은 식별자만 인용한다(가이드 §11.9).
// 근거: 현행 PerformanceDetail.tsx(S-code-20) · design SCR-D04 · designer.md §3.3 SCR-D04 · develop §3.1·§3.4.
// designer 가 새로 붙인 접근성 라벨·표기("공연 관리로 돌아가기" 등)는 designer W3 제안 문구 — 사용자 확정 2026-11-19 "제안 문구 그대로".
// ----------------------------------------------------------------------
export const MSG_D04 = {
  /** 머리 부제 — PerformanceDetail.tsx:197 */
  SUBTITLE: '공연 상세 정보',
  /** ← 아이콘 버튼 aria-label — designer W3 신규(사용자 확정 2026-11-19 "제안 문구 그대로") */
  BACK: '공연 관리로 돌아가기',

  /** "공연 정보" 카드 — PerformanceDetail.tsx:204-221 */
  INFO_TITLE: '공연 정보',
  INFO_NAME: '공연명',
  INFO_TYPE: '타입',
  INFO_STATUS: '상태',
  INFO_CREATED: '등록일',
  INFO_DESCRIPTION: '설명',
  /** [D5] 상세 이미지 수 — design SCR-D04 [D5], develop AdminPerformance.detailImageUrls */
  INFO_DETAIL_IMAGES: '상세 이미지',
  /** 포스터 없음 자리 aria-label — designer W3 신규(사용자 확정 2026-11-19 "제안 문구 그대로") */
  NO_POSTER: '포스터 없음',

  /** "반(Class) 관리" 카드 — PerformanceDetail.tsx:230-247 */
  CLASS_TITLE: '반(Class) 관리',
  CLASS_ADD: '반 추가',
  CLASS_COL_NAME: '반 이름',
  CLASS_COL_DAYS: '요일',
  CLASS_COL_TIME: '시간',
  CLASS_COL_DEADLINE: '마감일',
  CLASS_COL_STATUS: '상태',
  /** 표 aria-label — 카드 제목 재사용 */
  CLASS_TABLE_ARIA: '반 목록',
  /** 빈 반 — PerformanceDetail.tsx:237 */
  CLASS_EMPTY: '등록된 반이 없습니다',
  /** 행 아이콘 버튼 aria-label — designer W3 신규(사용자 확정 2026-11-19 "제안 문구 그대로"), 다이얼로그 제목과 같은 말 */
  CLASS_EDIT_ARIA: '반 수정',
  CLASS_DELETE_ARIA: '반 삭제',
  /** 반 삭제 확인 — PerformanceDetail.tsx:271 */
  CLASS_DELETE_CONFIRM: '반을 삭제하시겠습니까?',

  /** 반 다이얼로그 — PerformanceDetail.tsx:322-421, [D5] "반 수정" 겸용(design SCR-D04) */
  CLASS_DIALOG_ADD: '반 추가',
  CLASS_DIALOG_EDIT: '반 수정',
  CLASS_NAME: '반 이름',
  CLASS_NAME_PH: '예: A반, 주말반',
  /** 반 이름 빈 값 — develop §3.4 ClassUpsert.name "반 이름을 입력해주세요." */
  CLASS_NAME_REQUIRED: '반 이름을 입력해주세요.',
  CLASS_DAYS: '요일 (복수 선택 가능)',
  CLASS_START: '시작 시간',
  CLASS_END: '종료 시간',
  /** 종료 ≤ 시작 — develop §3.1 CLS_003 문구(서버와 같은 문구로 미리 막는다) */
  CLASS_TIME_ORDER: '종료 일시는 시작 일시 이후여야 합니다.',
  CLASS_DEADLINE: '마감일',
  /** 마감일 보조 문구 — PerformanceDetail.tsx:392 "(선택, 마감 후 해당 시간 재사용 가능)" */
  CLASS_DEADLINE_HINT: '(선택, 마감 후 해당 시간 재사용 가능)',
  CLASS_LOCATION: '장소',
  CLASS_LOCATION_PH: '연습실 A',
  CLASS_STATUS: '상태',
  /** 충돌 경고 — PerformanceDetail.tsx:386 */
  CLASS_CONFLICT_WARNING: '선택한 요일/시간에 이미 운영 중인 반이 있습니다',
  /** 제출 차단 — PerformanceDetail.tsx:164, develop CLS_002 와 같은 문구 */
  CLASS_CONFLICT_BLOCKED: '선택한 요일/시간에 이미 다른 반이 있습니다',

  /** 404 PERF_001 — PerformanceDetail.tsx:187 */
  NOT_FOUND: '공연을 찾을 수 없습니다',
  /** xs 반 카드의 마감일 접두 — designer W3 신규(사용자 확정 2026-11-19 "제안 문구 그대로"), 표 머리 "마감일" 재사용 */
  CARD_DEADLINE_PREFIX: '마감일',
} as const;

/** 상세 이미지 [n]장 — designer W3 신규 표기(사용자 확정 2026-11-19 "제안 문구 그대로") */
export function formatDetailImageCount(count: number): string {
  return `${count}장`;
}
