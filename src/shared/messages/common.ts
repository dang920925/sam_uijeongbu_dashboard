// ----------------------------------------------------------------------
// 대시보드 공용 문구(MSG-COMMON-*) — 화면은 식별자만 인용한다(가이드 §11.9).
// 근거: 현행 대시보드 코드 문자열(S-code-20) · develop §3.1 오류 코드 표 · design §3 공통.
// designer.md §8.2 자리표시(MSG-UPLOAD-* 등)는 사용자 결정 2026-11-19 "제안 문구 그대로"로 확정됐다.
// ----------------------------------------------------------------------
export const MSG_COMMON = {
  /** 현행 버튼 라벨 — Performances.tsx·Members.tsx·Schedules.tsx 다이얼로그 */
  CANCEL: '취소',
  ADD: '추가',
  SAVE: '저장',
  DELETE: '삭제',
  EDIT: '수정',
  REGISTER: '등록',
  /** 오류 상태 재시도 버튼 — design §3 공통 "오류 = … '다시 시도' 버튼" */
  RETRY: '다시 시도',
  /** 스켈레톤 영역 aria-label(접근성 전용, 자체 결정) */
  LOADING_ARIA: '불러오는 중',
  /** 다이얼로그·패널 닫기 aria-label — 현행 dialog.tsx sr-only "닫기" */
  CLOSE: '닫기',
  /** 값 없음 표기 — 현행 formatDate '-' */
  EMPTY_VALUE: '-',
  /** 페이지네이션 aria-label — designer W3 신규 접근성 라벨(사용자 확정 2026-11-19 "제안 문구 그대로") */
  PREV_PAGE: '이전 페이지',
  NEXT_PAGE: '다음 페이지',
  /** 저장 성공 — 현행 Members.tsx:278 "저장되었습니다 ✓" (스낵바에선 ✓ 를 아이콘으로, designer 확인 4) */
  SAVED: '저장되었습니다',
  /** 홈페이지 노출 라벨·값 — design SCR-D03·D05 [D5], designer W3 "노출"/"비노출" */
  VISIBLE_LABEL: '홈페이지 노출',
  VISIBLE: '노출',
  HIDDEN: '비노출',
} as const;

/** 업로드(FN-18) 문구 — develop §3.1 UPL_001·002·004, 진행 문구는 현행 Gallery.tsx:121 */
export const MSG_UPLOAD = {
  SELECT: '이미지 선택',
  CHANGE: '이미지 변경',
  UPLOADING: '업로드 중...',
  TYPE_INVALID: '지원하지 않는 파일 형식입니다.',
  SIZE_EXCEEDED: '파일 크기가 초과되었습니다.',
  FAILED: '파일 업로드에 실패했습니다. 다시 시도해주세요.',
  REQUIRED: '이미지를 업로드해주세요.',
  /** 업로드 전 자동 축소·압축(W5, 사용자 요청 2026-11-20) — 제안 문구(지휘자 명세 제안 그대로, 확정 전) */
  OPTIMIZING: '이미지 최적화 중...',
  COMPRESSED: (from: string, to: string) =>
    `${from} → ${to}로 줄여 올렸습니다.`,
  DECODE_FAILED: '이미지를 열 수 없습니다. JPG·PNG로 저장해 다시 올려 주세요.',
  /** 규격 안내 — MSG-UPLOAD-HELP/HINT 확정 문구(사용자 결정 2026-11-19 "제안 문구 그대로", integration §11.1). 규격 근거 FN-18 */
  HELP: 'JPG·PNG·WEBP, 포스터 5MB · 상세 이미지 10MB 이하',
  HINT: 'JPG·PNG·WEBP, 5MB 이하',
  /** aria-label — designer W3 신규 접근성 라벨(사용자 확정 2026-11-19 "제안 문구 그대로") */
  MOVE_UP: '위로 이동',
  MOVE_DOWN: '아래로 이동',
  REMOVE: '삭제',
} as const;

/** 세션·네트워크 — develop §3.1 AUTH_003·COMMON_004 */
export const MSG_API = {
  UNAUTHORIZED: '로그인이 필요합니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
} as const;
