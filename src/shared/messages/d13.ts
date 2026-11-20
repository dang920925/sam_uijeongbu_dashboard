// ----------------------------------------------------------------------
// SCR-D13 입장 체크 문구(MSG-D13-*) — 화면은 식별자만 인용한다(가이드 §11.9).
// 근거: design §6 SCR-D13 · §6.1a · §6.1b(새 문구는 모두 "제안" — 사용자 확인 대상) ·
// designer §13.6 · §13.7.4(W4 제안 문구 표 · 보강2 §10.2) · 지휘자 결정 2026-11-20(RSV_010·007·008 정본 문구).
// 상태 Label 은 ReservationStatusLabel(codes.ts), 단위는 MSG_BOOKING.
// ----------------------------------------------------------------------
export const MSG_D13 = {
  /** design §6 SCR-D13 · designer MSG-D13-SUB(md·lg 만) */
  TITLE: '입장 체크',
  SUBTITLE: '공연 당일 예매자를 찾아 입장 인원을 기록합니다',
  /** MSG-D13-SHOWS-ARIA */
  SHOWS_ARIA: '회차 선택',
  /** 회차 칩 — "[작품 제목] · 12/12 14:00"(designer §13.7.4 1.7) */
  SHOW_LABEL: (title: string, when: string) =>
    title ? `${title} · ${when}` : when,
  /** MSG-D13-STAT — "입장 {a} / 확정 {c}매 · 미입장 · 입금 대기 {n}건" */
  STAT_ARIA: '입장 현황',
  STAT_ADMITTED: '입장 / 확정',
  STAT_NOT_ADMITTED: '미입장',
  STAT_PENDING: '입금 대기',
  COUNT_UNIT: '건',
  /** 사용자 동작 뒤 화면 읽기 — design §6 "입장 {a} / 확정 {c}매" */
  STAT_ANNOUNCE: (admitted: number, confirmed: number) =>
    `입장 ${admitted} / 확정 ${confirmed}매`,
  /** MSG-D13-FRESH · STALE · PANEL-FRESH · REFRESH */
  FRESH: '방금 갱신',
  STALE: (time: string) => `${time} 기준`,
  PANEL_FRESH: '방금 갱신 · 10초마다 새로고침',
  PANEL_SHOW: '회차',
  REFRESH: '지금 새로고침',
  /** MSG-D13-SEARCH-* · KEYPAD · RESULT */
  SEARCH_PH: '이름, 예매번호, 연락처 뒤 4자리',
  SEARCH_ARIA: '예매 검색',
  SEARCH_CLEAR: '검색어 지우기',
  KEYPAD: '123',
  KEYPAD_ARIA: '숫자 키패드 123',
  RESULT: (count: number) => `검색 결과 ${count}건`,
  /** MSG-D13-META(보강2 — 매수 삭제) */
  META_CODE: (code: string) => `예매 ${code}`,
  META_PHONE: (last4: string) => `연락처 끝 ${last4}`,
  /** MSG-D13-TIERS 읽기 — "등급별 매수: 일반 3매, 스태프 1매" */
  TIERS_ARIA: (text: string) => `등급별 매수: ${text}`,
  /** 할인(링크 전용) 등급 줄 표시 글자 — 지휘자 전달(2026-11-20) "링크 전용(할인)" · 색만으로 알리지 않게 */
  DISCOUNT: '링크 전용(할인)',
  /** 등급 줄이 없는 예매(옛 자료)의 매수 줄 — design §6 SCR-D13 ④ "매수" */
  LINES_FALLBACK: '매수',
  /** MSG-D13-COUNT */
  COUNT_LABEL: '입장',
  COUNT: (admitted: number, quantity: number) => `${admitted}/${quantity}`,
  /** 표 머리(lg) — designer default lg */
  COL_BOOKER: '예매자',
  COL_ADMISSION: '입장',
  COL_STATUS: '상태',
  COL_ACTIONS: '처리',
  /** MSG-D13-DONE · PLUS · ALL · MINUS · PAY */
  DONE: '입장 완료',
  PLUS: '+1 입장',
  PLUS_ARIA: (name: string) => `${name} 1명 입장`,
  ALL: '전원 입장',
  ALL_ARIA: (name: string, remaining: number) =>
    `${name} 남은 ${remaining}명 모두 입장`,
  MINUS: '−1',
  MINUS_ARIA: (name: string) => `${name} 입장 1명 되돌리기`,
  PAY: '입금 확인 + 입장',
  /** MSG-D13-ADMIN · 관리자 등록 행(design §6.1b) */
  ADMIN_SOURCE: '관리자 등록',
  /** MSG-D13-SHEET-TITLE · SHEET-INFO */
  SHEET_TITLE: (amount: string) => `${amount}원 입금을 확인했나요?`,
  SHEET_BOOKER: '예매자',
  SHEET_BOOKER_VALUE: (name: string, code: string, quantity: number) =>
    `${name} · 예매 ${code} · ${quantity}매`,
  SHEET_DEPOSITOR: '입금자명',
  SHEET_ADMIT: '입장 인원',
  SHEET_ADMIT_RANGE: (max: number) => `1~${max}명`,
  SHEET_DECREASE: '입장 인원 줄이기',
  SHEET_INCREASE: '입장 인원 늘리기',
  /** MSG-D13-ONSITE */
  ONSITE: '현장 예매 등록',
  /** MSG-D13-SNACK-ADMIT — "[이름] {n}명 입장"(되돌리기 버튼은 공용 스낵바에 동작 자리가 없어 −1 버튼으로 대신) */
  SNACK_ADMIT: (name: string, count: number) => `${name} ${count}명 입장`,
  SNACK_UNDO: (name: string) => `${name} 입장 1명 되돌림`,
  SNACK_ONSITE: (name: string) => `${name} 예매를 등록했습니다`,
  /** MSG-D13-CONFLICT — 지휘자 결정 2026-11-20: RSV_010·007·008 모두 이 문구 + 즉시 재조회 */
  CONFLICT: '다른 스태프가 먼저 처리했습니다. 목록을 새로 불러왔습니다.',
  /** MSG-D13-OFFLINE */
  OFFLINE: '연결이 끊겼습니다. 처리하지 못했을 수 있으니 다시 확인해주세요.',
  /** MSG-D13-NORESULT · NOSHOW */
  NO_RESULT: '찾는 예매가 없습니다. 이름이나 번호를 다시 확인해주세요.',
  NO_SHOW: '오늘 이후 회차가 없습니다',
  /** 검색어 없이 명단이 빈 회차 — 근거 문구 없음 */
  EMPTY: '[MSG-D13-EMPTY — 확인 필요] 이 회차에 예매가 없습니다.',
  /** MSG-D13-OTHER-* (design §6.1a) */
  OTHER_TITLE: '다른 회차 예매입니다',
  OTHER_SUB: (when: string) => `이 회차(${when}) 명단에는 없습니다.`,
  OTHER_META: (parts: string[]) => parts.join(' · '),
  OTHER_MOVE: '그 회차로 이동',
} as const;
