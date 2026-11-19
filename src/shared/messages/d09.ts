// ----------------------------------------------------------------------
// SCR-D09 연출진 관리 문구(MSG-D09-*) — 신규 화면(D5). 근거: design SCR-D09 · designer.md §3.4 §4.
// 현행·기획·디자인에 글자가 없는 문구는 지어내지 않고 designer 식별자를 그대로 둔다(확인 필요).
// ----------------------------------------------------------------------
export const MSG_D09 = {
  /** 메뉴 라벨(design SCR-D00 [D5]) = 페이지 제목 */
  TITLE: '연출진 관리',
  /** designer §3.4 §4 확인 필요 — design 에 글자 없음 */
  SUBTITLE: '[MSG-D09-SUB — 확인 필요]',
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
  /** 소개 placeholder — designer §3.4 §4 확인 필요 */
  BIO_PH: '[MSG-D09-BIO-PH — 확인 필요]',
  /** 이름 필수 — 현행 Members.tsx 문구(MSG_MEMBER_FORM.NAME_REQUIRED 와 같음) */
  NAME_REQUIRED: '이름을 입력해주세요',
  /** 역할 필수 — designer §3.4 §4 "역할을 입력해주세요 패턴" 기본안(확인 필요) */
  ROLE_REQUIRED: '역할을 입력해주세요',
  /** design SCR-D09 빈 상태(D03 빈 상태 패턴) */
  EMPTY: '등록된 연출진이 없습니다',
  /** design SCR-D09 "…을(를) 삭제하시겠습니까?" 패턴(Members.tsx:304) */
  deleteConfirm: (name: string) => `${name}을(를) 삭제하시겠습니까?`,
} as const;
