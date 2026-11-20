// ----------------------------------------------------------------------
// SCR-D09 연출진 관리 문구(MSG-D09-*) — 신규 화면(D5). 근거: design SCR-D09 · designer.md §3.4 §4.
// 현행·기획·디자인에 글자가 없던 문구(MSG-D09-*)는 사용자 결정 2026-11-19 로 확정됐다.
// ----------------------------------------------------------------------
export const MSG_D09 = {
  /** 메뉴 라벨(design SCR-D00 [D5]) = 페이지 제목 */
  TITLE: '연출진 관리',
  /** MSG-D09-SUB — 사용자 결정 2026-11-19 확정 */
  SUBTITLE: '연출진 정보를 관리합니다',
  /** design SCR-D09 "○○ 추가" 패턴 */
  ADD: '연출진 추가',
  ADD_TITLE: '연출진 추가',
  EDIT_TITLE: '연출진 수정',
  /** 아이콘 버튼 aria-label — designer §3.4 §0 "다이얼로그 제목과 같은 '연출진 수정'…" */
  EDIT_ARIA: '연출진 수정',
  DELETE_ARIA: '연출진 삭제',
  /** 표 머리·필드 라벨 — design SCR-D09 필드 · designer §3.4 §4 표 */
  COL_PHOTO: '사진',
  COL_NAME: '이름',
  COL_ROLE: '역할',
  COL_BIO: '소개',
  COL_ORDER: '노출 순서',
  COL_VISIBLE: '노출',
  /** 액션 열 머리 — designer 프레임 SCR-D09__default__lg 표 머리 "액션" */
  COL_ACTIONS: '액션',
  /** 이름 placeholder — Members.tsx:324 (designer §3.4 §4) */
  NAME_PH: '이름 입력',
  /** 역할 placeholder — 홈 app/page.tsx:37 표기(designer §3.4 §4) */
  ROLE_PH: '예: 예술감독 · 연출',
  /** 소개 placeholder MSG-D09-BIO-PH — 사용자 결정 2026-11-19 확정 */
  BIO_PH: '연출진 소개',
  /** 이름 필수 — 현행 Members.tsx 문구(MSG_MEMBER_FORM.NAME_REQUIRED 와 같음) */
  NAME_REQUIRED: '이름을 입력해주세요',
  /** 역할 필수 — designer §3.4 §4 "역할을 입력해주세요 패턴" 제안 문구 — 사용자 확정 2026-11-19 "제안 문구 그대로" */
  ROLE_REQUIRED: '역할을 입력해주세요',
  /** U28 연혁 입력(design §7 SCR-D09 — "제안") */
  HISTORY: '연혁',
  HISTORY_ADD: '연혁 추가',
  HISTORY_YEAR: '연도',
  HISTORY_CONTENT: '내용',
  HISTORY_MAX_HELP: '연혁은 50개까지 넣을 수 있습니다.',
  HISTORY_INVALID: '연도(4자리)와 내용을 확인해주세요.',
  HISTORY_UP_ARIA: '위로',
  HISTORY_DOWN_ARIA: '아래로',
  HISTORY_REMOVE_ARIA: '연혁 삭제',
  /** 목록 표 "연혁 {n}개" */
  COL_HISTORY: '연혁',
  historyCount: (n: number) => `연혁 ${n}개`,
  /** design SCR-D09 빈 상태(D03 빈 상태 패턴) */
  EMPTY: '등록된 연출진이 없습니다',
  /** design SCR-D09 "…을(를) 삭제하시겠습니까?" 패턴(Members.tsx:304) */
  deleteConfirm: (name: string) => `${name}을(를) 삭제하시겠습니까?`,
} as const;
