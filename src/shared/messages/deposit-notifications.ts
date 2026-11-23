// ----------------------------------------------------------------------
// SCR-D12 '입금 알림' 탭 문구(R2) — 근거: 사용자 결정 2026-11-23(판정표 문구 "입금 완료" · "일부 입금(확인 필요)" ·
// "확인 안 된 입금" · "알림 문구 시험") · develop §11.6. 나머지는 자체 문구(back-end.md §21 자체 결정).
// ----------------------------------------------------------------------
export const MSG_DEP = {
  TAB: '입금 알림',
  INTRO:
    '폰으로 받은 입금 알림을 예매와 맞춰 봅니다. 입금자명과 금액이 모두 맞으면 자동으로 입금 완료 처리합니다.',
  AUTO_OFF_NOTICE: '자동 확정이 꺼져 있습니다. 맞는 입금도 확인 필요로 둡니다.',
  FILTER_ARIA: '판정 결과로 거르기',
  FILTER_ALL: '전체',
  LIST_ARIA: '입금 알림 목록',
  EMPTY: '받은 입금 알림이 없습니다.',
  EMPTY_FILTERED: '이 조건의 입금 알림이 없습니다.',
  COL_RECEIVED: '받은 시각',
  COL_MESSAGE: '알림 원문',
  COL_APP: '출처 앱',
  COL_AMOUNT: '금액',
  COL_RESULT: '판정',
  COL_RESERVATION: '연결된 예매',
  COL_ACTIONS: '처리',
  AMOUNT_UNKNOWN: '금액 모름',
  NO_RESERVATION: '없음',
  RECEIVED_OF: (received: string, total: string) =>
    `받은 금액 ${received} / ${total}`,
  STATUS: {
    AUTO_CONFIRMED: '입금 완료',
    PARTIAL: '일부 입금',
    NEEDS_REVIEW: '확인 필요',
    UNMATCHED: '확인 안 된 입금',
    MANUALLY_MATCHED: '직접 연결',
    IGNORED: '무시함',
    IGNORED_SOURCE: '판정 안 함',
  },
  /** 불일치 단서(사용자 결정 2026-11-23 보강 — 입금자명 전체가 있어야 일치) */
  HINT: {
    CODE_ONLY: '입금자명 불일치(예매번호만 일치)',
    NAME_ONLY: '입금자명 불일치(이름만 일치)',
  },
  // 허용 밖 앱 · '입금' 없는 카카오톡·카카오뱅크(잔액만) · 제목 '출금'(실제 카카오뱅크 형식 반영 2026-11-23, 제안 문구)
  IGNORED_SOURCE_REASON: '판정하지 않는 알림(입금 아님·허용 밖 앱)',
  REASON: {
    MULTIPLE_MATCH: '맞는 예매가 여러 건',
    OVERPAID: '금액이 더 많음',
    AMOUNT_UNREADABLE: '금액을 읽지 못함',
    AUTO_CONFIRM_OFF: '자동 확정 꺼짐',
    NOT_PENDING: '처리 중 예매가 바뀜',
  },
  SOURCE: {
    KAKAOBANK: '카카오뱅크',
    KAKAOTALK: '알림톡',
    KAKAOPAY: '카카오페이',
  },
  BTN_MATCH: '예매에 연결',
  BTN_IGNORE: '무시',
  MATCH_TITLE: '예매에 연결하고 입금 확인',
  MATCH_DESCRIPTION:
    '예매번호 4자리로 찾아 고르면 그 예매를 입금 확인(확정)으로 바꿉니다.',
  MATCH_CODE_LABEL: '예매번호 4자리',
  MATCH_SEARCH: '찾기',
  MATCH_NONE: '입금 대기 중인 예매가 없습니다.',
  MATCH_CONFIRM: '연결하고 입금 확인',
  MATCH_OPTION: (code: string, name: string, amount: string, title: string) =>
    `${code} · ${name} · ${amount} · ${title}`,
  MATCHED: '예매에 연결하고 입금 확인했습니다.',
  IGNORED: '입금 알림을 무시했습니다.',
  PREVIEW_TITLE: '알림 문구 시험',
  PREVIEW_DESCRIPTION:
    '받은 알림 문구를 붙여 넣으면 저장하지 않고 판정 결과만 미리 보여 줍니다.',
  PREVIEW_LABEL: '알림 문구',
  PREVIEW_PLACEHOLDER: '예) 홍길동1234님이 15,000원을 보내셨습니다',
  PREVIEW_RUN: '판정 미리 보기',
  PREVIEW_AMOUNT: '읽은 금액',
  PREVIEW_CANDIDATES: '금액 후보',
  PREVIEW_MATCHED_BY: '찾은 방법',
  PREVIEW_MATCHED_BY_VALUE: {
    DEPOSITOR: '입금자명 일치',
    NONE: '못 찾음',
  },
  PREVIEW_RESULT: '판정',
  PREVIEW_REASON: '이유',
  PREVIEW_MATCHES: '맞는 예매',
  PREVIEW_NOT_SAVED: '시험 결과는 저장하지 않습니다.',
} as const;
