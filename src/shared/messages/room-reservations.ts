// ----------------------------------------------------------------------
// U34 관리자 연습실 예약 목록 문구 — design §13(SCR-D08 레이어의 상세·"예약 삭제" 문구를 목록 화면에 먼저 쓴다).
// ----------------------------------------------------------------------
export const MSG_ROOMS = {
  TITLE: '연습실 예약',
  SUBTITLE:
    '팀이 홈페이지에서 예약한 연습실 시간입니다. 메모는 관리자와 그 팀만 봅니다.',
  WEEK_PREV: '이전 주',
  WEEK_NEXT: '다음 주',
  WEEK_TODAY: '이번 주',
  EMPTY: '이 주에는 연습실 예약이 없습니다.',
  TABLE_ARIA: '연습실 예약 목록',
  COL_DATE: '날짜',
  COL_TIME: '시간',
  COL_TEAM: '팀',
  COL_PERFORMANCE: '작품',
  COL_MEMO: '메모',
  COL_ACTIONS: '동작',
  DELETE: '예약 삭제',
  DELETE_ARIA: (team: string, time: string) => `${team} ${time} 예약 삭제`,
  DELETE_CONFIRM: '이 연습실 예약을 삭제하시겠습니까?',
  DELETE_DESC: (team: string, when: string) => `${team} · ${when}`,
  DELETED: '예약을 삭제했습니다.',
  NO_MEMO: '-',
  /** (U45) 참석자 — 팀이 예약할 때 체크한 배우 */
  COL_ATTENDEES: '참석자',
  NO_ATTENDEES: '체크 안 함',
} as const;
