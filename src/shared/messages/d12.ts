// ----------------------------------------------------------------------
// SCR-D12 예매 관리 문구(MSG-D12-*) + 공용 수동 등록 Dialog·예매 상세 드로어 문구(D12·D13·헤더 빠른 검색 공용).
// 근거: design §6 SCR-D12·§6.1a·§6.1b(새 문구는 모두 "제안") · designer §13.7.3 제안 문구 표·§11.3(보강2) ·
// 지휘자 결정 2026-11-20(충돌 스낵바 정본 문구). 서버 message 를 그대로 쓰는 오류(RSV_003·009·011·012 등)는
// toApiErrorMessage 로 보인다. 상태 Label 은 RESERVATION_STATUS_LABEL·CANCEL_REASON_LABEL(codes.ts), 단위는 MSG_BOOKING.
// ----------------------------------------------------------------------
export const MSG_D12 = {
  TITLE: '예매 관리',
  SUBTITLE: '회차별 예매와 입금을 관리합니다',
  PERF_LABEL: '공연',

  /** KPI — design §6 SCR-D12(제안) · designer MSG-D12-KPI(-CAP) */
  KPI_PENDING: '입금 대기',
  KPI_CONFIRMED: '확정',
  KPI_REMAINING: '남은 좌석',
  KPI_AMOUNT: '확정 금액',
  KPI_PENDING_CAP: (qty: number, overdue: number) =>
    `${qty}매 · 기한 지남 ${overdue}건`,
  KPI_CONFIRMED_CAP: '입금 확인된 매수',
  KPI_REMAINING_CAP: (shows: number) => `${shows}회차 합계`,
  KPI_AMOUNT_CAP: '확정 예매 합계',
  COUNT_UNIT: '건',

  BTN_ADD: '예매 등록',
  BTN_OVERDUE: '기한 지난 예매 취소',

  TAB_LIST: '예매',
  TAB_SUMMARY: '집계',
  TAB_INVITE: '초대 링크',

  /** 필터 — designer MSG-D12-FILTER·SEARCH */
  FILTER_SHOW: '회차',
  FILTER_STATUS: '상태',
  FILTER_ALL: '전체',
  FILTER_OVERDUE: '기한 지남만',
  SEARCH_PH: '이름, 연락처, 예매번호',
  SEARCH_ARIA: '예매 검색',
  COUNT: (n: number) => `총 ${n}건 · 접수 최신순`,
  /** §6.1a 정확 일치 — designer MSG-D12-EXACT */
  COUNT_EXACT: (n: number, code: string) =>
    `총 ${n}건 · 예매번호 ${code} 와 같은 예매를 맨 위에 강조했습니다`,

  /** 표 머리 — designer MSG-D12-COLS·COL-TIERS */
  COL_CODE: '예매번호',
  COL_BOOKER: '예매자',
  COL_SHOW: '회차',
  COL_TIERS: '등급별 매수',
  COL_AMOUNT: '금액 / 입금자명',
  COL_STATUS: '상태',
  COL_ADMISSION: '입장',
  COL_INVITER: '초대',
  COL_ACTIONS: '처리',
  TOTAL_QTY: (n: number) => `총 ${n}매`,
  DUE: (text: string) => `기한 ${text}`,
  DEPOSITOR: '입금자명',
  ADMISSION: '입장',
  INVITER: '초대',
  INVITER_NOTE: (note: string) => `${note} (직접 입력)`,
  ADMIN_LABEL: '관리자 등록',
  FREE_LABEL: '무료',
  /** 금액 덮어쓴 건(amountOverridden) — 지휘자 전달(2026-11-20, back-end 표시 필드 표) "금액 조정" */
  OVERRIDDEN: '금액 조정',
  /** LINK_ONLY 등급 줄 Label — 지휘자 전달(2026-11-20) "링크 전용(할인)" */
  LINK_ONLY: '링크 전용(할인)',
  NO_PHONE: '연락처 없음',

  /** 처리 — designer MSG-D12-ACT */
  ACT_CONFIRM: '입금 확인',
  ACT_UNCONFIRM: '확인 취소',
  ACT_CANCEL: '취소',
  ACT_RESTORE: '되살리기',
  ACT_ITEMS: '등급 수정',
  ACT_DETAIL: '상세 보기',
  MEMO_ADD: '메모 추가',
  MEMO_EDIT: '메모 보기·수정',
  /** 입장 인원이 있는 확정 건 — RSV_009 문구(develop §11.4) 그대로 */
  LOCKED_REASON:
    '입장한 인원이 있어 처리할 수 없습니다. 입장을 먼저 되돌려주세요.',

  /** 입금 확인 스낵바 — designer MSG-D12-CONFIRMED */
  CONFIRMED: (code: string) => `${code} 입금을 확인했습니다.`,
  UNDO: '되돌리기',
  UNDONE: (code: string) => `${code} 입금 확인을 되돌렸습니다.`,
  /** RSV_007·008 충돌 — 지휘자 결정 2026-11-20 정본 문구 */
  CONFLICT: '다른 스태프가 먼저 처리했습니다. 목록을 새로 불러왔습니다.',
  CANCELLED: (code: string) => `${code} 예매를 취소했습니다.`,
  RESTORED: (code: string) => `${code} 예매를 되살렸습니다.`,
  UNCONFIRMED: (code: string) => `${code} 입금 확인을 취소했습니다.`,
  REGISTERED: (code: string) => `${code} 예매를 등록했습니다.`,

  /** 취소 Dialog — designer MSG-D12-CANCEL-* */
  CANCEL_TITLE: '예매를 취소하시겠습니까?',
  CANCEL_REASON: '취소 사유',
  CANCEL_HELP:
    "취소하면 좌석이 다시 열립니다. 잘못 취소했다면 '되살리기'로 되돌릴 수 있습니다.",
  CANCEL_CLOSE: '닫기',
  CANCEL_SUBMIT: '예매 취소',

  /** 일괄 취소 — design §6 제안 · designer MSG-D12-OVERDUE-* */
  OVERDUE_CONFIRM: (n: number) =>
    `입금 기한이 지난 입금 대기 예매 ${n}건을 취소하시겠습니까?`,
  OVERDUE_CAP: "취소 사유는 '기한 지남'으로 기록됩니다.",
  OVERDUE_SUBMIT: (n: number) => `${n}건 취소`,
  OVERDUE_DONE: (n: number) => `기한 지난 예매 ${n}건을 취소했습니다.`,
  OVERDUE_NONE: '기한 지난 입금 대기 예매가 없습니다.',

  /** 메모 Dialog — designer MSG-D12-MEMO-* */
  MEMO_TITLE: '메모',
  MEMO_HELP: '관리자만 봅니다 · 최대 500자',
  MEMO_TOO_LONG: '메모는 500자까지 쓸 수 있습니다.',

  /** 등급 수정 Dialog — designer MSG-D12-ITEMS-* */
  ITEMS_TITLE: '등급 수정',
  ITEMS_KEEP: '같은 등급은 예매 당시 가격을 유지합니다.',
  ITEMS_PRICE_KEPT: (price: string) => `예매 당시 ${price}`,
  ITEMS_PRICE_NOW: (price: string) => `지금 가격 ${price}`,
  ITEMS_BEFORE: (qty: number, amount: string) => `변경 전 ${qty}매 · ${amount}`,
  ITEMS_AFTER: '변경 후',
  ITEMS_HELP:
    '상태(입금 대기·확정)는 바뀌지 않습니다. 늘어난 매수만큼 남은 좌석을 다시 확인합니다.',
  ITEMS_SAVED: (code: string) => `${code} 등급을 수정했습니다.`,

  /** 수동 등록 Dialog(공용 — D12 "예매 등록" · D13 "현장 예매 등록") — designer MSG-D12-MANUAL-* */
  MANUAL_TITLE: '예매 등록',
  MANUAL_SHOW: '회차',
  MANUAL_SHOW_OPT: (label: string, remaining: number | null) =>
    remaining === null ? label : `${label} · 남은 ${remaining}석`,
  MANUAL_NAME: '이름',
  MANUAL_PHONE: '연락처',
  MANUAL_PHONE_OPTIONAL: '(선택)',
  MANUAL_PHONE_PH: '010-0000-0000',
  MANUAL_MODE: '입력 방식',
  MANUAL_MODE_TIER: '등급별 수량',
  MANUAL_MODE_CUSTOM: '직접 입력',
  MANUAL_TIER_HELP:
    '관리자 등록은 링크 전용 등급도 고를 수 있고, 1인 최대 매수를 적용하지 않습니다 (최대 20매)',
  MANUAL_CUSTOM_LABEL: '표시 이름',
  MANUAL_CUSTOM_LABEL_PH: '직접 입력',
  MANUAL_CUSTOM_LABEL_HELP:
    '목록·입장 체크에 등급 이름 대신 보입니다 · 30자까지',
  MANUAL_CUSTOM_QTY: '매수',
  MANUAL_CUSTOM_AMOUNT: '금액',
  MANUAL_CUSTOM_AMOUNT_HELP:
    '0원도 넣을 수 있습니다 — 무료 초대는 이렇게 등록합니다.',
  MANUAL_TOTAL_TIER: '등급 가격 합계',
  MANUAL_TOTAL: '합계',
  MANUAL_TOTAL_VALUE: (qty: number, amount: string) => `${qty}매 · ${amount}`,
  MANUAL_OVERRIDE: '금액 직접 정하기',
  MANUAL_OVERRIDE_ARIA: '직접 정한 금액',
  MANUAL_OVERRIDE_HELP:
    '넣으면 등급 가격 합계 대신 이 금액을 씁니다. 0원도 넣을 수 있습니다.',
  MANUAL_STATUS: '상태',
  MANUAL_STATUS_PENDING_HELP:
    '입금 대기로 두면 입금 기한이 붙고, 입금 확인은 목록에서 합니다.',
  MANUAL_STATUS_CONFIRMED_HELP: "0원 확정 예매는 목록에 '무료'로 표시됩니다.",
  MANUAL_ADMIT: '입장 인원',
  MANUAL_ADMIT_HELP: (max: number) => `0~${max}명 — 지금 입장한 인원`,
  MANUAL_INVITER: '초대 단원',
  MANUAL_INVITER_NONE: '선택 안 함',
  MANUAL_MEMO: '메모',
  MANUAL_MEMO_PH: '예: 초대 — 연출 지인',
  MANUAL_SUBMIT: '등록',
  MANUAL_DECREASE: (name: string) => `${name} 1매 빼기`,
  MANUAL_INCREASE: (name: string) => `${name} 1매 더하기`,
  MANUAL_QTY_ARIA: (name: string) => `${name} 매수`,
  /** 검증 — 자체 제안([MSG-D12-MANUAL-ERR — 확인 필요]) */
  ERR_SHOW: '회차를 골라주세요.',
  ERR_NAME: '이름을 입력해주세요.',
  ERR_NAME_LONG: '이름은 50자까지 쓸 수 있습니다.',
  ERR_PHONE: '연락처 형식을 확인해주세요.',
  ERR_QTY: '매수를 1~20매로 넣어주세요.',
  ERR_LABEL_LONG: '표시 이름은 30자까지 쓸 수 있습니다.',
  ERR_AMOUNT: '금액을 0원 이상으로 넣어주세요.',
  ERR_SEATS: (remaining: number) =>
    `남은 좌석(${remaining}석)보다 많이 등록할 수 없습니다.`,
  ERR_ADMIT: (max: number) => `입장 인원은 0~${max}명으로 넣어주세요.`,

  /** 상세 드로어(공용 — D12 · 헤더 빠른 검색) */
  DETAIL_TITLE: (code: string) => `예매 ${code}`,
  DETAIL_PERFORMANCE: '공연',
  DETAIL_SHOW: '회차',
  DETAIL_BOOKER: '예매자',
  DETAIL_TIERS: '등급별 매수',
  DETAIL_AMOUNT: '금액',
  DETAIL_DEPOSITOR: '입금자명',
  DETAIL_DUE: '입금 기한',
  DETAIL_ADMISSION: '입장',
  DETAIL_INVITER: '초대',
  DETAIL_MEMO: '메모',
  DETAIL_CONFIRMED_AT: '확정 시각',
  DETAIL_CANCELLED_AT: '취소 시각',
  DETAIL_CREATED_AT: '접수 시각',

  /** 집계 탭 — designer MSG-D12-SUM-* */
  SUM_SHOW_TITLE: '회차별 집계',
  SUM_SHOW_CAP: '입금 대기·확정은 매수, 취소는 빼고 셉니다',
  SUM_COL_SEATS: '좌석',
  SUM_COL_PENDING: '입금 대기',
  SUM_COL_CONFIRMED: '확정',
  SUM_COL_REMAINING: '남은',
  SUM_COL_ADMITTED: '입장',
  SUM_COL_AMOUNT: '확정 금액',
  SUM_TOTAL: '합계',
  SUM_TIER_TITLE: '등급별 집계',
  SUM_TIER_CAP: '회차 × 가격 등급 매수 (확정 · 입금 대기)',
  SUM_TIER_CELL: (confirmed: number, pending: number) =>
    `확정 ${confirmed} · 대기 ${pending}`,
  SUM_TIER_TOTAL: '공연 합계',
  /** 금액 조정 건이 있으면 등급별 금액 합 ≠ 상단 확정 금액 — 지휘자 전달(2026-11-20) 주석 */
  SUM_TIER_AMOUNT_NOTE: '금액 조정 포함 합계는 상단 기준',
  SUM_TIER_CUSTOM: '직접 입력',
  SUM_INV_TITLE: '단원별 초대',
  SUM_INV_CAP: "초대 링크나 예매 폼의 '초대한 단원' 기준",
  SUM_INV_COL: '단원',
  SUM_INV_NOTE: '직접 입력',
  SUM_INV_NONE: '초대 없음',
  SUM_EMPTY: '아직 회차가 없습니다',
  PERSON_UNIT: '명',

  /** 초대 링크 탭 — designer MSG-D12-INV-* · design §6 */
  INV_TITLE: '초대 링크',
  INV_CAP:
    '이 링크로 들어온 예매는 그 단원 초대로 집계됩니다. 코드는 단원마다 하나이고 모든 공연에 같이 쓰입니다.',
  INV_FORMAT_LABEL: '링크 형식',
  INV_FORMAT: '{홈페이지 주소}/works/{공연 id}/book?ref={코드}',
  INV_COL_NAME: '이름',
  INV_COL_TYPE: '유형',
  INV_COL_CODE: '코드',
  INV_COL_LINK: '링크',
  INV_NONE: '발급 전',
  INV_COPY: '링크 복사',
  INV_ISSUE: '발급',
  INV_REISSUE: '재발급',
  INV_REISSUE_CONFIRM:
    '이전 링크는 더 이상 쓸 수 없습니다. 재발급하시겠습니까?',
  INV_COPIED: '링크를 복사했습니다',
  INV_COPY_FAILED:
    '링크를 복사하지 못했습니다. 링크를 직접 선택해 복사해주세요.',
  INV_ISSUED: '초대 링크를 발급했습니다',
  /** CLIENT_PUBLIC_URL 없음 — [MSG-D12-INV-NO-URL — 확인 필요] 자체 제안 */
  INV_NO_URL:
    '홈페이지 주소(CLIENT_PUBLIC_URL)가 설정되지 않아 링크를 만들 수 없습니다.',
  INV_EMPTY: '등록된 단원이 없습니다',

  /** 상태 — design §6 SCR-D12(제안) */
  NO_PERF:
    '예매 설정이 된 공연이 없습니다. 공연 상세의 회차·예매 탭에서 설정해주세요.',
  NO_PERF_GO: '공연 관리로 이동',
  NO_RESULT: '조건에 맞는 예매가 없습니다',
  RESET_FILTER: '필터 초기화',
} as const;
