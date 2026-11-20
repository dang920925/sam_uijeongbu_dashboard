// ----------------------------------------------------------------------
// SCR-D05 배우 프로필 'SAM 출연작'·'참여 직함'(R3 U26 보강 — design §12.1 · develop §17.5) 문구. 모두 "제안".
// ----------------------------------------------------------------------
export const MSG_D05_SAM = {
  CASTS_TITLE: 'SAM 출연작',
  CASTS_EMPTY: '연결된 SAM 출연작이 없습니다',
  CAST_ADD: 'SAM 출연작 추가',
  PERFORMANCE: '작품',
  PERFORMANCE_PH: '작품 선택',
  ROLE: '배역',
  ROLE_NONE: '배역 없음(출연)',
  NEW_ROLE: '새 배역 추가',
  NEW_ROLE_PH: '비우면 "출연"',
  NOTE: '메모',
  NOTE_PH: '예: A캐스트',
  SAVE: '저장',
  CANCEL: '취소',
  HIDDEN_PERFORMANCE: '비노출',
  ENDED: '종료',
  ENSEMBLE: '출연',
  UNLINK: '연결 해제',
  unlinkAria: (title: string, role: string) => `${title} ${role} 연결 해제`,
  PERFORMANCE_REQUIRED: '작품을 골라주세요',
  CREDITS_TITLE: '참여 직함',
  CREDITS_EMPTY: '참여 직함이 없습니다',
  CREDIT_ADD: '참여 직함 추가',
  CREDIT_TITLE: '직함',
  CREDIT_TITLE_PH: '예: 조연출',
  CREDIT_TITLE_REQUIRED: '직함을 입력해주세요',
  CREDIT_VISIBLE: '노출',
  CREDIT_HIDDEN: '비노출',
  creditDeleteAria: (title: string) => `${title} 삭제`,
  /** 회차별 캐스팅은 공연 쪽에서만(design §12.1) */
  SHOW_CAST_GUIDE: '회차별 캐스팅은 공연의 배역·캐스팅 탭에서',
  /** develop §17.5 안내 문구 */
  overrideLeft: (n: number) =>
    `회차별 캐스팅 ${n}칸은 배역·캐스팅 탭에서 정리해주세요.`,
} as const;
