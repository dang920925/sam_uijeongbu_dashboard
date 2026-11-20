// ----------------------------------------------------------------------
// SCR-D11 회차·예매 설정 문구(MSG-D11-*) — 화면은 식별자만 인용한다(가이드 §11.9).
// 근거: design §6 SCR-D11(새 문구는 모두 "제안" — 사용자 확인 대상) · designer 시안 design/screens/SCR-D11.html
// (라벨·도움말·placeholder) · develop §11.4(필드 범위). 표시하지 않고 서버 message 를 그대로 쓰는 오류:
// SHW_002 "같은 날짜·시각의 회차가 이미 있습니다." · SHW_003 "좌석 수를 이미 예매된 {n}석보다 적게 줄일 수 없습니다."
// · SHW_004 "예매가 있는 회차는 삭제할 수 없습니다."(develop §11.4 — toApiErrorMessage).
// 탭 라벨은 MSG_D04.TAB_*, 상태 Label 은 BOOKING_SHOW_STATE_LABEL(codes.ts), 단위는 MSG_BOOKING.
// ----------------------------------------------------------------------
import type { PriceTierVisibility, ShowStatus } from '@/src/types/booking';

export const MSG_D11 = {
  /** 준비 상태 알림 — design §6 SCR-D11 콘텐츠 1(제안) */
  NOTICE_MISSING: (items: string) =>
    `예매를 열려면 다음 항목을 채워주세요: ${items}`,
  NOTICE_READY:
    '예매 조건이 모두 채워졌습니다. 오픈 시각이 되면 예매가 열립니다.',
  /** 링크 전용 등급만 있음 — design §6.1b(제안) */
  NOTICE_LINK_ONLY: '링크로 들어온 사람만 예매할 수 있습니다.',
  /** 회차 필드 빈 칸 묶음 — designer 시안 not-ready "가격(회차 2개)" */
  NOTICE_SHOW_COUNT: (label: string, count: number) =>
    `${label}(회차 ${count}개)`,
  /** 항목 구분 — designer 시안 not-ready ", " */
  LIST_SEPARATOR: ', ',

  /** 예매 설정 카드 — design §6 SCR-D11 콘텐츠 2(제안) · designer 시안 */
  POLICY_TITLE: '예매 설정',
  POLICY_SUBTITLE: '이 공연의 모든 회차에 적용됩니다',
  DEPOSIT_BANK: '입금 은행',
  ACCOUNT_NUMBER: '계좌번호',
  /** designer 시안 not-ready placeholder(develop §11.4 `[0-9-]{6,30}`) */
  ACCOUNT_NUMBER_PH: '숫자와 - 만 입력',
  ACCOUNT_HOLDER: '예금주',
  MAX_TICKETS: '1인 최대 매수',
  MAX_TICKETS_HELP: '1~20매',
  DEADLINE_HOURS: '입금 기한 (시간)',
  DEADLINE_HOURS_PH: '1~168',
  DEADLINE_HOURS_HELP:
    '예매 후 이 시간 안에 입금해야 합니다. 공연 시작 시각을 넘지 않습니다.',
  HOUR_UNIT: '시간',
  /** 문의처(develop §11.10 inquiryContact — 지휘자 전달 문구, 제안) */
  INQUIRY: '문의처',
  INQUIRY_PH: '예: 010-0000-0000 (문자) 또는 오픈채팅 링크',
  INQUIRY_HELP: '입금자명을 잘못 입력한 관객이 연락할 곳입니다',
  REFUND: '취소·환불 규정',
  REFUND_PH: "취소·환불 규정을 입력하거나 '기본 문구 넣기'를 누르세요",
  REFUND_HELP: '예매 화면과 예매 확인에 그대로 보입니다 · 최대 2000자',
  REFUND_DEFAULT_BUTTON: '기본 문구 넣기',
  /**
   * 기본 환불 문구 — design §6 SCR-D11 "기본 환불 문구"(S-law-19 공연업 분쟁해결기준, 마지막 두 문장 제안).
   * 글자는 원문 그대로, " / "·문장 끝을 줄바꿈으로 넣는다(designer §13.5 충돌 3 — SCR-10 이 pre-line 으로 보인다).
   */
  REFUND_DEFAULT_TEXT: [
    '공연일 10일 전까지: 전액 환불',
    '7일 전까지: 10% 공제 후 환불',
    '3일 전까지: 20% 공제 후 환불',
    '1일 전까지: 30% 공제 후 환불',
    '공연 당일 시작 전까지: 90% 공제 후 환불',
    '공연 3일 전까지 예매 후 24시간 이내 취소: 전액 환불.',
    '환불은 예매자 계좌로 송금합니다.',
    '극단 사정으로 공연이 취소되면 전액 환불합니다.',
  ].join('\n'),

  /** 준비 상태 알림 항목명(계약 missingFields → 한국어) — designer 시안 not-ready 알림 */
  MISSING_LABEL: {
    depositBank: '입금 은행',
    depositAccountNumber: '계좌번호',
    depositAccountHolder: '예금주',
    maxTicketsPerBooking: '1인 최대 매수',
    depositDeadlineHours: '입금 기한',
    refundPolicyText: '취소·환불 규정',
    /** develop §11.10 publicTier(사용 중 PUBLIC 등급 없음) — design §6.1b(제안) */
    publicTier: '누구나 고를 수 있는 가격 등급',
    totalSeats: '좌석 수',
    bookingOpenAt: '예매 오픈 시각',
  } as Record<string, string>,
  /** 회차 행 빈 칸 — designer 시안 not-ready 표 "빈 칸: 오픈 시각" */
  ROW_MISSING_LABEL: {
    totalSeats: '좌석 수',
    bookingOpenAt: '오픈 시각',
  } as Record<string, string>,
  ROW_MISSING: (items: string) => `빈 칸: ${items}`,

  /** 회차 표 — design §6 SCR-D11 콘텐츠 3(제안) · designer 시안 표 머리 */
  SHOWS_TITLE: '회차 관리',
  SHOW_ADD: '회차 추가',
  /** 표·카드 목록 aria-label(접근성 전용, 자체 결정 — 카드 제목 재사용 패턴) */
  SHOWS_TABLE_ARIA: '회차 목록',
  COL_DATE: '날짜',
  COL_TIME: '시각',
  COL_VENUE: '장소',
  COL_SEATS: '좌석 예매/확정/남은',
  COL_OPEN: '오픈 시각',
  COL_STATE: '예매 상태',
  COL_STOP: '예매 중지',
  /** 액션 열 머리(화면에는 숨김) — designer 시안 표 머리 "관리" */
  COL_ACTIONS: '관리',
  SEATS_COUNTS: (booked: string, confirmed: string, remaining: string) =>
    `${booked} / ${confirmed} / ${remaining}`,
  SEATS_TOTAL: (total: string) => `총 ${total}석`,
  /** 카드(md·xs) — designer 시안 "좌석 [n]석 예매 [n] 확정 [n] 남은 [n]" */
  CARD_SEATS: (total: string) => `좌석 ${total}석`,
  CARD_BOOKED: (n: string) => `예매 ${n}`,
  CARD_CONFIRMED: (n: string) => `확정 ${n}`,
  CARD_REMAINING: (n: string) => `남은 ${n}`,
  /** 카드 — designer 시안 "오픈 [YYYY.MM.DD] [HH:MM]" */
  CARD_OPEN: (text: string) => `오픈 ${text}`,
  /** 빈 상태 — design §6 SCR-D11 "등록된 회차가 없습니다"(D03 빈 상태 패턴) */
  SHOWS_EMPTY: '등록된 회차가 없습니다',
  /** 안내 — design §6 SCR-D11 콘텐츠 4(제안, 기획 §15.7) */
  SHOWS_NOTE:
    '회차는 일정 관리에 자동으로 추가되지 않습니다. 홈페이지 일정에도 보이게 하려면 일정 관리에서 따로 추가해주세요.',
  /** 아이콘 버튼·스위치 aria-label — D04 "반 수정"/"반 삭제" 패턴(뒤에 회차 날짜·시각을 붙인다) */
  EDIT_ARIA: '회차 수정',
  DELETE_ARIA: '회차 삭제',

  /** 회차 다이얼로그 — design §6 SCR-D11 "회차 Dialog" · designer 시안 dialog-show */
  DIALOG_ADD: '회차 추가',
  DIALOG_EDIT: '회차 수정',
  DATE: '날짜',
  START: '시작 시각',
  END: '종료 시각',
  CLASS: '반',
  VENUE: '장소',
  SEATS: '좌석 수',
  OPEN_DATE: '예매 오픈 날짜',
  OPEN_TIME: '예매 오픈 시각',
  STATUS: '상태',
  STATUS_HELP:
    "공연이 끝나면 '종료'로 바꿉니다. 예매 상태는 설정 값으로 자동 계산됩니다.",
  STOP_BOOKING: '예매 중지',
  STOP_BOOKING_HELP: "켜면 이 회차는 '마감'으로 보이고 예매를 받지 않습니다",
  /** 회차 상태(shows.status) 선택지 — designer 시안 dialog-show "예정 · 예매 중 · 종료" */
  SHOW_STATUS_LABEL: {
    UPCOMING: '예정',
    BOOKING_OPEN: '예매 중',
    COMPLETED: '종료',
  } as Record<ShowStatus, string>,

  /** 검증 — 필수는 D08 "시작 시간을 입력해주세요" 패턴(자체 결정), 범위·형식은 develop §3.1 COMMON_001(D10 과 같음) */
  DATE_REQUIRED: '날짜를 입력해주세요',
  START_REQUIRED: '시작 시각을 입력해주세요',
  INVALID_INPUT: '입력값을 확인해주세요.',

  /** 삭제 확인 — designer 시안 confirm-delete(D04 "반을 삭제하시겠습니까?" 패턴) */
  DELETE_CONFIRM: '회차를 삭제하시겠습니까?',

  /** 가격 등급 카드 — design §6.1b SCR-D11(제안) · designer 시안(보강2) */
  TIERS_TITLE: '가격 등급',
  TIERS_SUBTITLE: '예매하는 사람 유형별 가격 · 모든 회차에 같이 적용됩니다',
  TIER_ADD: '가격 등급 추가',
  /** 수정 다이얼로그 제목 — "○○ 추가/수정" 패턴(자체 결정) */
  TIER_EDIT: '가격 등급 수정',
  TIERS_TABLE_ARIA: '가격 등급 목록',
  TIERS_EMPTY: '등록된 가격 등급이 없습니다',
  TIER_COL_ORDER: '순서',
  TIER_COL_NAME: '이름',
  TIER_COL_PRICE: '가격',
  TIER_COL_VISIBILITY: '노출',
  TIER_COL_ACTIVE: '사용',
  TIER_COL_USED: '예매 매수',
  TIER_COL_ACTIONS: '동작',
  TIER_USED: (n: number) => `${n}매`,
  TIER_CARD_USED: (n: number) => `예매 ${n}매`,
  VISIBILITY_LABEL: {
    PUBLIC: '누구나',
    LINK_ONLY: '링크 전용',
  } as Record<PriceTierVisibility, string>,
  /** 아이콘 버튼·스위치 aria-label — designer 시안 "수정 — 일반" 형식 */
  TIER_MOVE_UP: (name: string) => `위로 이동 — ${name}`,
  TIER_MOVE_DOWN: (name: string) => `아래로 이동 — ${name}`,
  TIER_ACTIVE_ARIA: (name: string) => `사용 — ${name}`,
  TIER_EDIT_ARIA: (name: string) => `수정 — ${name}`,
  TIER_DELETE_ARIA: (name: string) => `삭제 — ${name}`,
  TIER_REISSUE_ARIA: (name: string) => `링크 재발급 — ${name}`,
  /** 링크 복사 메뉴 — design §6.1b · designer tier-link-menu */
  LINK_COPY: '링크 복사',
  LINK_COPY_TIER: '등급 링크 복사',
  LINK_COPY_WITH_MEMBER: '등급 링크 + 단원 초대 링크',
  LINK_COPY_WITH_MEMBER_HELP: '단원을 고르면 두 링크를 합쳐 복사합니다',
  /** CLIENT_PUBLIC_URL 이 없을 때 복사 버튼 비활성 이유(자체 결정) */
  LINK_UNAVAILABLE: '홈페이지 주소가 설정되지 않아 링크를 만들 수 없습니다',
  /** 복사 결과 — design §6 SCR-10 "복사되었습니다"(제안) / 실패는 자체 결정 */
  COPIED: '복사되었습니다',
  COPY_FAILED: '복사하지 못했습니다. 다시 시도해주세요.',
  /** 재발급 확인 — design §6.1b(제안) · designer confirm-tier-reissue("{이름} 등급 링크") */
  REISSUE_CONFIRM: '이전 링크는 더 이상 쓸 수 없습니다. 재발급하시겠습니까?',
  REISSUE_TARGET: (name: string) => `${name} 등급 링크`,
  REISSUE: '재발급',
  /** 쓰인 등급 삭제 막음 툴팁 — design §6.1b(제안) */
  DELETE_BLOCKED_TIP: '예매에 쓰인 등급은 사용 중지로 바꿔주세요',
  /** 비활성 ▲▼ 이유(R1-003 qa-r1) — 자체 제안 */
  TIER_MOVE_UP_BLOCKED_TIP: '맨 위 등급입니다',
  TIER_MOVE_DOWN_BLOCKED_TIP: '맨 아래 등급입니다',
  /** 등급 삭제 확인 — 회차 삭제와 같은 패턴(자체 결정) */
  TIER_DELETE_CONFIRM: '가격 등급을 삭제하시겠습니까?',

  /** 등급 다이얼로그 — design §6.1b · designer dialog-tier */
  TIER_NAME: '이름',
  TIER_NAME_PH: '예: 일반, 스태프',
  TIER_NAME_HELP: '예매 화면에 그대로 보입니다 · 30자까지',
  TIER_PRICE: '가격',
  /** 1원 이상(사용자 결정) — design §6.1b·지휘자 전달 문구 */
  TIER_PRICE_HELP:
    "1원 이상. 무료 초대는 예매 관리의 '예매 등록'으로 넣어주세요.",
  TIER_VISIBILITY: '노출 방식',
  VIS_PUBLIC: '누구나',
  VIS_PUBLIC_HELP: '예매 화면에 항상 보입니다',
  VIS_LINK: '링크로 들어온 사람만',
  VIS_LINK_HELP:
    '등급 링크로 들어온 사람에게만 보입니다. 저장하면 링크가 만들어집니다',
  TIER_ACTIVE: '사용',
  TIER_ACTIVE_HELP: '끄면 예매 화면에서 이 등급을 고를 수 없습니다',
  /** 필수 — D09 "이름을 입력해주세요" · D08 패턴(자체 결정) */
  TIER_NAME_REQUIRED: '이름을 입력해주세요',
  TIER_PRICE_REQUIRED: '가격을 입력해주세요',

  /** 단원 고르기 다이얼로그 — designer 미작성(§13.11 5 "그리지 않음"), 자체 결정 문구 */
  MEMBER: '단원',
  MEMBER_PH: '이름으로 찾기',
  MEMBER_HELP: '초대 코드가 없는 단원은 복사할 때 새로 발급합니다',
  MEMBER_REQUIRED: '단원을 골라주세요',
  MEMBER_EMPTY: '단원이 없습니다',
  COPY: '복사',
} as const;
