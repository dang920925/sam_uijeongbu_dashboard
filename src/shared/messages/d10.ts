// ----------------------------------------------------------------------
// SCR-D10 팝업 관리 문구(MSG-D10-*) — 신규 화면(D5). 근거: design SCR-D10 · designer.md §3.4 §5 · develop §3.1.
// 현행·기획·디자인에 글자가 없는 문구는 지어내지 않고 designer 식별자를 그대로 둔다(확인 필요).
// 상태·활성 라벨은 코드값 맵(PERFORMANCE_STATUS_LABEL·CLASS_STATUS_LABEL) 재사용(designer §3.4 §5).
// ----------------------------------------------------------------------
export const MSG_D10 = {
  /** 메뉴 라벨(design SCR-D00 [D5]) = 페이지 제목 */
  TITLE: '팝업 관리',
  /** designer §3.4 §5 확인 필요 — design 에 글자 없음 */
  SUBTITLE: '홈페이지 팝업을 관리합니다',
  /** design SCR-D10 · D03~D08 "○○ 추가" 패턴 */
  ADD: '팝업 추가',
  ADD_TITLE: '팝업 추가',
  EDIT_TITLE: '팝업 수정',
  /** 아이콘 버튼 aria-label — designer §3.4 §0 "다이얼로그 제목과 같은 …" 규칙 */
  EDIT_ARIA: '팝업 수정',
  DELETE_ARIA: '팝업 삭제',
  /** 표 머리 — design SCR-D10 표현 형식 · designer §3.4 §5 */
  COL_IMAGE: '이미지',
  COL_LINK: '링크',
  COL_PERIOD: '노출 기간',
  COL_ACTIVE: '활성',
  COL_STATUS: '상태',
  /** 액션 열 머리 — designer 프레임 SCR-D10__default__lg 표 머리 "액션" */
  COL_ACTIONS: '액션',
  /** 필드 라벨 — design SCR-D10 필드(이미지 *·링크 URL·시작일 *·종료일 *·활성) */
  IMAGE: '이미지',
  LINK: '링크 URL',
  /** designer §3.4 §5 "계약 https 만" */
  LINK_PH: 'https://',
  START_DATE: '시작일',
  END_DATE: '종료일',
  ACTIVE: '활성',
  /** 겹침 경고 — designer §3.4 §5 확인 필요 */
  OVERLAP: '다른 팝업과 노출 기간이 겹칩니다',
  /** develop §3.1 POP_002 */
  END_BEFORE_START: '종료일은 시작일 이후여야 합니다.',
  /**
   * 링크 https 아님·날짜 비어 있음 — 계약에 전용 문구가 없어(designer 확인 필요) 검증 실패 기본 문구
   * develop §3.1 COMMON_001 "입력값을 확인해주세요." 를 쓴다(자체 결정, 지어내지 않음).
   */
  INVALID_INPUT: '입력값을 확인해주세요.',
  /** 빈 상태 — designer §3.4 §5 D03 패턴 기본안(확인 필요) */
  EMPTY: '등록된 팝업이 없습니다',
  /** 삭제 확인 — designer §3.4 §5 일정·이미지 삭제 패턴 기본안(확인 필요) */
  DELETE_CONFIRM: '팝업을 삭제하시겠습니까?',
} as const;
