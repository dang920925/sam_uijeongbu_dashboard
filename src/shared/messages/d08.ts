// ----------------------------------------------------------------------
// SCR-D08 일정 관리 문구(MSG-D08-*). 근거: 현행 Schedules.tsx(S-code-20) · design SCR-D08 ·
// designer W4 D08 · develop §3.1 SCH_002. 타입 라벨은 src/types/codes.ts SCHEDULE_TYPE_LABEL.
// ----------------------------------------------------------------------
export const MSG_D08 = {
  /** 현행 Schedules.tsx:148-153 */
  TITLE: '일정 관리',
  SUBTITLE: '연습, 공연, 이벤트 일정을 관리합니다',
  ADD: '일정 추가',
  /** 필터 "전체" — 현행 Schedules.tsx:165 / 필터 묶음 aria-label 은 열 머리 "타입" 재사용 */
  FILTER_ALL: '전체',
  /** 표 머리 — 현행 Schedules.tsx:189-194 */
  COL_TITLE: '제목',
  COL_TYPE: '타입',
  COL_START: '시작 시간',
  COL_END: '종료 시간',
  COL_LOCATION: '장소',
  COL_ACTIONS: '액션',
  /** 빈 상태 — 현행 Schedules.tsx:184 */
  EMPTY: '등록된 일정이 없습니다',
  /** 다이얼로그 제목 — 현행 Schedules.tsx:246 */
  DIALOG_ADD: '일정 추가',
  DIALOG_EDIT: '일정 수정',
  /** 아이콘 버튼 aria-label — designer W4 공통 "다이얼로그 제목과 같은 '일정 수정'·'일정 삭제'" */
  EDIT: '일정 수정',
  DELETE: '일정 삭제',
  /** 필드 — 현행 Schedules.tsx:250-282 */
  FIELD_TITLE: '제목',
  FIELD_TITLE_PH: '일정 제목',
  FIELD_TYPE: '타입',
  FIELD_START: '시작 시간',
  FIELD_END: '종료 시간',
  FIELD_LOCATION: '장소',
  FIELD_LOCATION_PH: '장소 입력',
  FIELD_DESCRIPTION: '설명',
  FIELD_DESCRIPTION_PH: '일정 설명',
  /** 검증 — 현행 Schedules.tsx:26,28 / develop §3.1 SCH_002 */
  TITLE_REQUIRED: '제목을 입력해주세요',
  START_REQUIRED: '시작 시간을 입력해주세요',
  END_BEFORE_START: '종료 일시는 시작 일시 이후여야 합니다.',
  /** 연결 묶음 — design SCR-D08 "연결 반/공연"(D5) · "연결 공연"(현행 Applications.tsx:188 라벨 재사용) */
  LINK_GROUP: '연결 반/공연',
  LINK_PERFORMANCE: '연결 공연',
  /** designer W4 D08 — 확인 필요(신규 라벨) */
  LINK_CLASS: '연결 반',
  /** 빈 select 기본값 — designer W4 D08 "선택 안 함 옵션" 기본안, 확인 필요 */
  LINK_NONE: '선택 안 함',
  /** 도움말 — 문구 미확정(designer W4 D08). 뜻: 공연 일정에 공연을 연결해야 홈페이지 '작품 상세' 버튼이 나온다 */
  LINK_HELP: '[MSG-D08-LINK-HELP — 확인 필요]',
  /** 삭제 확인 — 현행 Schedules.tsx:226 */
  CONFIRM_DELETE: '일정을 삭제하시겠습니까?',
} as const;
