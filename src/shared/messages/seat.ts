// ----------------------------------------------------------------------
// U35 좌석 지정·U36 초대자 문구(MSG-SEAT-*) — 화면은 식별자만 인용한다(가이드 §11.9).
// 근거: design §14(D11 "좌석 지정 예매"·"좌석 배치"·"다른 회차 배치 복사" · D12 "좌석 변경"·좌석 현황 ·
// D13 "좌석 미정") · design §15(D05 "예매 초대자 목록에 표시" · D12 초대 집계 묶음) — 모두 "제안" 문구.
// 서버 오류 SEAT_001·002·004·RSV_007 은 서버 message 를 그대로 쓴다(toApiErrorMessage).
// ----------------------------------------------------------------------
export const MSG_SEAT = {
  STAGE: 'STAGE',
  UNASSIGNED: '좌석 미정',
  COLUMN: '좌석',
  ROW_LABEL: (row: string) => `${row}열`,
  SEAT_ARIA: (row: string, n: number) => `${row}열 ${n}번`,
  SEAT_ARIA_SOLD: (row: string, n: number, name: string | null) =>
    name
      ? `${row}열 ${n}번, 예매 완료 — ${name}`
      : `${row}열 ${n}번, 예매 완료`,
  SEAT_ARIA_MINE: (row: string, n: number) => `${row}열 ${n}번, 이 예매의 좌석`,
  SEAT_ARIA_FULL: (row: string, n: number) =>
    `${row}열 ${n}번, 매수만큼 이미 골랐습니다`,
  LEGEND: '좌석 범례',
  LEGEND_AVAILABLE: '선택 가능',
  LEGEND_SELECTED: '선택한 좌석',
  LEGEND_SOLD: '예매 완료',
  LEGEND_MINE: '이 예매의 좌석',
  LEGEND_SEAT: '좌석',
  LEGEND_AISLE: '통로',
  LEGEND_VOID: '사용 안 함',
  REMAINING: (n: number, total: number) => `잔여 ${n}/${total}석`,
  PICKED: (labels: string, picked: number, need: number) =>
    `선택한 좌석 ${labels || '없음'} (${picked}/${need}석)`,
  LOAD_ERROR: '좌석 지도를 불러오지 못했습니다.',
  RETRY: '다시 시도',

  /** D11 회차·예매 탭 — 좌석 지정 스위치(design §14 제안) */
  SWITCH_TITLE: '좌석 지정 예매',
  SWITCH_LABEL: '좌석 지정 예매 사용',
  SWITCH_HELP:
    '켜면 관객이 예매할 때 좌석 지도에서 매수만큼 좌석을 고릅니다. 회차마다 좌석 배치를 저장해야 예매가 열립니다.',
  SWITCH_SAVED_ON: '좌석 지정 예매를 켰습니다.',
  SWITCH_SAVED_OFF: '좌석 지정 예매를 껐습니다.',
  LAYOUT_BUTTON: '좌석 배치',
  LAYOUT_BUTTON_ARIA: (show: string) => `${show} 좌석 배치`,
  LAYOUT_NONE: '배치 없음',
  LAYOUT_SEATS: (n: number) => `${n}석`,

  /** 배치 편집기 */
  EDITOR_TITLE: (show: string) => `좌석 배치 — ${show}`,
  EDITOR_ROWS: '열 수',
  EDITOR_COLS: '열당 칸 수',
  EDITOR_SIZE_HELP: '열 수 1~40, 열당 칸 수 1~60',
  EDITOR_GRID:
    '배치 편집 — 칸을 누르면 좌석 → 통로 → 사용 안 함 순으로 바뀝니다',
  EDITOR_CELL_ARIA: (row: number, col: number, kind: string) =>
    `${row}행 ${col}칸, ${kind}`,
  EDITOR_CELL_LOCKED: (label: string) => `${label}, 예매된 좌석 — 바꿀 수 없음`,
  EDITOR_PREVIEW: '미리보기(관객 화면)',
  EDITOR_SUMMARY: (seats: number) => `좌석 ${seats}석`,
  EDITOR_HINT:
    '열 이름(A, B…)과 번호는 왼쪽부터 자동으로 붙습니다. 통로는 번호를 건너뜁니다.',
  EDITOR_COPY_LABEL: '다른 회차 배치 복사',
  EDITOR_COPY_PH: '복사할 회차 선택',
  EDITOR_COPY_BUTTON: '복사',
  EDITOR_COPY_DONE: '다른 회차의 배치를 복사했습니다.',
  EDITOR_SAVE: '배치 저장',
  EDITOR_SAVED: '좌석 배치를 저장했습니다.',
  EDITOR_EMPTY: '좌석이 한 칸 이상 있어야 저장할 수 있습니다.',
  EDITOR_INVALID_SIZE: '열 수는 1~40, 열당 칸 수는 1~60 사이로 입력해주세요.',
  EDITOR_NEW: '아직 배치가 없습니다. 열 수와 칸 수를 정하고 저장하세요.',

  /** D12 예매 관리 */
  STATUS_BUTTON: '좌석 현황',
  STATUS_TITLE: (show: string) => `좌석 현황 — ${show}`,
  STATUS_PICK_SHOW: '회차를 고르면 좌석 현황을 볼 수 있습니다.',
  STATUS_NO_LAYOUT: '이 회차는 아직 좌석 배치가 없습니다.',
  STATUS_SELECTED: (seat: string, name: string) => `${seat} — ${name}`,
  STATUS_FIND: '이 예매 찾기',
  STATUS_HINT: '예매 완료 칸을 누르면 그 예매를 볼 수 있습니다.',
  CHANGE_ACTION: '좌석 변경',
  CHANGE_TITLE: (name: string) => `좌석 변경 — ${name}`,
  CHANGE_HELP: (n: number) =>
    `매수(${n}석)만큼 고르세요. 파란 칸은 지금 이 예매의 좌석입니다.`,
  CHANGE_SUBMIT: '좌석 저장',
  CHANGE_SAVED: '좌석을 바꿨습니다.',
  CHANGE_NEED: (n: number) => `좌석을 ${n}석 골라주세요.`,
  MANUAL_SEAT: '좌석',
  MANUAL_SEAT_OPTIONAL: '(선택 — 비우면 좌석 미정)',
  MANUAL_SEAT_OPEN: '좌석 고르기',
  MANUAL_SEAT_CLEAR: '좌석 비우기',
  MANUAL_SEAT_NEED: (n: number) =>
    `좌석을 고르려면 매수(${n}석)만큼 고르거나 모두 비워주세요.`,
  MANUAL_SEAT_NO_QTY: '매수를 먼저 정하면 좌석을 고를 수 있습니다.',

  /** U36 초대자 */
  INVITER_STAFF: '연출·스태프 관계자',
  /** U41 — SAM 관계자(design §17) */
  INVITER_SAM: 'SAM 관계자',
  INVITER_NONE: '없음/모름',
  INVITER_LISTED: '예매 초대자 목록에 표시',
  INVITER_LISTED_HELP:
    '켜면 홈페이지 예매 폼의 "초대한 단원" 목록에 이름이 나옵니다.',
} as const;
