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
  /** designer W4 D08 제안 라벨 — 사용자 확정 2026-11-19 "제안 문구 그대로" */
  LINK_CLASS: '연결 반',
  /** 빈 select 기본값 — designer W4 D08 "선택 안 함 옵션" 제안 문구 — 사용자 확정 2026-11-19 "제안 문구 그대로" */
  LINK_NONE: '선택 안 함',
  /** 도움말 — MSG-D08-LINK-HELP 확정 문구(사용자 확정 2026-11-19 "제안 문구 그대로"). 뜻: 공연 일정에 공연을 연결해야 홈페이지 '작품 상세' 버튼이 나온다 */
  LINK_HELP:
    '공연 일정은 공연을 연결해야 홈페이지 일정에 작품 상세 버튼이 표시됩니다',
  /** 삭제 확인 — 현행 Schedules.tsx:226 */
  CONFIRM_DELETE: '일정을 삭제하시겠습니까?',

  // ---------------------------------------------------------------------
  // U23 보강(구글 캘린더식 월·주·목록) — design SCR-D08 "U23 보강"·designer §14 "제안" 문구 그대로.
  // ---------------------------------------------------------------------
  /** 도구 줄 — design U23 보강 "오늘"(제안) · ‹ › aria "이전"·"다음" */
  TODAY: '오늘',
  PREV: '이전',
  NEXT: '다음',
  /** 보기 전환 — "월 · 주 · 목록"(제안), 묶음 aria "보기 방식"(design U23 MSG-D08-VIEW-ARIA 제안) */
  VIEW_ARIA: '보기 방식',
  VIEW_MONTH: '월',
  VIEW_WEEK: '주',
  VIEW_LIST: '목록',
  /** 범위 제목 — 월 "{year}년 {month}월"(SCR-07), 주 "{year}년 {m}월 {d}일 – {d2}일" / 달이 바뀌면 "… – {m2}월 {d2}일"(제안) */
  MONTH_TITLE: (year: number, month: number) => `${year}년 ${month}월`,
  WEEK_TITLE: (year: number, m: number, d: number, m2: number, d2: number) =>
    m === m2
      ? `${year}년 ${m}월 ${d}일 – ${d2}일`
      : `${year}년 ${m}월 ${d}일 – ${m2}월 ${d2}일`,
  /** 월 칸 넘침 — "+{n}개 더"(제안) */
  MORE: (count: number) => `+${count}개 더`,
  /** xs 아젠다 빈 달 — "이 달에는 일정이 없습니다"(제안) */
  MONTH_EMPTY: '이 달에는 일정이 없습니다',
  /** 주 보기 자정 넘김 — "→ 다음 날 {HH:mm}"(제안) */
  OVERNIGHT: (time: string) => `→ 다음 날 ${time}`,
  /** 칸 aria — "{year}년 {month}월 {day}일" + ", 오늘" + ", 일정 {count}건"(SCR-07 MSG-D08-CELL-ARIA) */
  CELL_ARIA: (
    year: number,
    month: number,
    day: number,
    isToday: boolean,
    count: number
  ) =>
    `${year}년 ${month}월 ${day}일${isToday ? ', 오늘' : ''}${count > 0 ? `, 일정 ${count}건` : ''}`,
  /** 더보기 팝오버·xs 시트 날짜 제목 "{m}월 {d}일 {요일}요일"(SCR-07 형식 "11월 20일 금요일") */
  DAY_TITLE: (month: number, day: number, weekday: string) =>
    `${month}월 ${day}일 ${weekday}요일`,
  /** 상세 날짜 줄 "{M월 D일 (요일)} HH:mm – HH:mm" */
  WHEN: (month: number, day: number, weekday: string, time: string) =>
    `${month}월 ${day}일 (${weekday}) ${time}`,
  /** 시간 범위 "{start} – {end}"(SCR-07 MSG-D08-TIME-RANGE) */
  TIME_RANGE: (start: string, end: string) => `${start} – ${end}`,
  /** v1.3.1 연습실 예약 레이어(design §13 — 제안 문구) */
  ROOM_LAYER: '연습실 예약',
  ROOM_LAYER_TOGGLE_ARIA: '연습실 예약 표시',
  ROOM_CHIP: (team: string) => `${team} 연습실`,
  ROOM_ARIA: (title: string, month: number, day: number, time: string) =>
    `연습실 예약 ${title}, ${month}월 ${day}일 ${time}`,
  ROOM_DETAIL_TEAM: '팀',
  ROOM_DETAIL_TIME: '시간',
  ROOM_DETAIL_PERFORMANCE: '작품',
  ROOM_DETAIL_MEMO: '메모',
  ROOM_DETAIL_NOTE:
    '팀이 등록한 연습실 예약입니다. 공식 일정이 아니며 홈페이지에는 보이지 않습니다.',
  ROOM_DELETE: '예약 삭제',
  ROOM_DELETE_CONFIRM: '이 연습실 예약을 삭제하시겠습니까?',
  ROOM_DELETED: '연습실 예약을 삭제했습니다.',
  ROOM_LIST_TITLE: '다가오는 연습실 예약(30일)',
  ROOM_LIST_EMPTY: '다가오는 연습실 예약이 없습니다.',
  /** 칩·블록 aria "{유형} {제목}, {M월 D일} {HH:mm}–{HH:mm}"(제안), 취소면 앞에 "취소된 일정, "(designer §14.5) */
  EVENT_ARIA: (
    typeLabel: string,
    title: string,
    month: number,
    day: number,
    time: string,
    isCancelled: boolean
  ) =>
    `${isCancelled ? '취소된 일정, ' : ''}${typeLabel} ${title}, ${month}월 ${day}일 ${time}`,
  /** 주 보기 빈 30분 칸 aria "{M}월 {D}일 {HH:mm} 일정 추가"(designer §14.7 #2 제안) */
  SLOT_ADD_ARIA: (month: number, day: number, time: string) =>
    `${month}월 ${day}일 ${time} 일정 추가`,

  // ---------------------------------------------------------------------
  // U29 일정 취소 — design §8 SCR-D08 · designer §14.3 "제안" 문구 그대로.
  // ---------------------------------------------------------------------
  CANCEL: '일정 취소',
  RESTORE: '취소 해제',
  CANCEL_SUBMIT: '취소 처리',
  CANCEL_REASON: '사유',
  CANCEL_REASON_PH: '예: 공연 단체관람',
  /** designer §14.7 #2 추가 제안 */
  CANCEL_REASON_REQUIRED: '사유를 입력해주세요',
  CANCEL_REASON_COUNT: (length: number, max: number) => `${length}/${max}`,
  CANCEL_OBSERVATION: '이 날 참관 신청 받지 않음',
  CANCEL_OBSERVATION_HELP:
    '체크하면 홈페이지 참관 신청에서 이 날짜가 빠집니다.',
  CANCEL_IMPACT: (count: number) =>
    `이 날짜에 참관 신청 ${count}건이 있습니다. 신청서 관리에서 연락해주세요.`,
  CANCEL_IMPACT_REST: (count: number) => `외 ${count}건`,
  /** 취소 표시 — 칩·블록 앞 글자 / Label */
  CANCELLED_TAG: '취소',
  CANCELLED_REASON: (reason: string) => `취소 · ${reason}`,
  OBSERVATION_CLOSED: '참관 받지 않음',
  CONFIRM_RESTORE: '취소를 해제하시겠습니까?',
} as const;
