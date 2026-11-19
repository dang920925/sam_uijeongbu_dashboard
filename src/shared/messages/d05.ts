// ----------------------------------------------------------------------
// SCR-D05 단원 관리 + 배우 프로필 패널 문구(MSG-D05-*) — 화면은 식별자만 인용한다(가이드 §11.9).
// 근거: 현행 Members.tsx(S-code-20) · design SCR-D05 · designer.md §3.4 §1 · develop FN-11·12.
// 단원 추가 폼 문구는 공용 member-form.ts, 버튼 "취소·추가·저장·삭제" 는 common.ts.
// ----------------------------------------------------------------------
export const MSG_D05 = {
  /** 머리 — Members.tsx:131-136 */
  TITLE: '단원 관리',
  SUBTITLE: '배우 및 일반 단원을 통합 관리합니다',
  ADD: '단원 추가',

  /** 필터 — Members.tsx:121-125 */
  FILTER_ALL: '전체',
  FILTER_ACTOR: '배우',
  FILTER_GENERAL: '일반',
  /** 필터 묶음 aria-label — 페이지 제목 재사용(접근성 전용) */
  FILTER_ARIA: '단원 구분',

  /** 표 머리 — Members.tsx:168-173 (사진 열은 머리 글자 없음) */
  COL_NAME: '이름',
  COL_TYPE: '구분',
  COL_PHONE: '연락처',
  COL_JOINED: '가입일',
  TABLE_ARIA: '단원 목록',
  /** 빈 상태 — Members.tsx:163 */
  EMPTY: '등록된 단원이 없습니다',

  /** 패널(배우) — Members.tsx:246-282 */
  INTRO: '소개',
  INTRO_PH: '배우 소개',
  /** 소개 200자 초과 — develop FN-12 · §3.4 ActorProfileUpsert.intro */
  INTRO_TOO_LONG: '한 줄 소개는 200자 이내로 입력해주세요.',
  SNS_URL: 'SNS URL',
  SNS_URL_PH: 'https://instagram.com/...',
  /** [D5] 칸 — design SCR-D05 [D5] */
  ACTIVITY_START: '활동 시작일',
  DISPLAY_ORDER: '노출 순서',
  /** 노출 순서 도움말 — develop §3.4 displayOrder 0~9999 (designer W4 제안 — 사용자 확정 2026-11-19 "제안 문구 그대로") */
  DISPLAY_ORDER_HELP: '0~9999',
  FILMOGRAPHY: '출연작',
  /** 출연작 행 추가 버튼 — designer W4 "○○ 추가" 패턴 줄임(사용자 확정 2026-11-19 "제안 문구 그대로") */
  FILMOGRAPHY_ADD: '추가',
  FILM_TITLE: '작품명',
  FILM_ROLE: '배역',
  FILM_YEAR: '연도',
  /** 출연작 행 삭제 aria-label — designer W4 신규(사용자 확정 2026-11-19 "제안 문구 그대로") */
  FILM_REMOVE_ARIA: '출연작 삭제',
  /** 저장 성공 인라인 — Members.tsx:278(현행 문구 그대로, ✓ 포함) */
  SAVED_INLINE: '저장되었습니다 ✓',
  SAVE_PROFILE: '프로필 저장',

  /** 패널(일반) — Members.tsx:292-297 */
  PHONE: '연락처',
  JOINED: '가입일',

  /** 공통 — Members.tsx:309 */
  DELETE: '단원 삭제',
} as const;

/** 단원 삭제 확인 — Members.tsx:304 "{이름}을(를) 삭제하시겠습니까?" */
export function formatMemberDeleteConfirm(name: string): string {
  return `${name}을(를) 삭제하시겠습니까?`;
}

/** 소개 글자 수 카운터 "[n]/200" — designer W4 제안 — 사용자 확정 2026-11-19 "제안 문구 그대로"(값 범위는 develop §3.4) */
export function formatIntroCounter(length: number, max: number): string {
  return `${length}/${max}`;
}
