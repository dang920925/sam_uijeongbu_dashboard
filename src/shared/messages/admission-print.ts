// ----------------------------------------------------------------------
// 회차 입장 명단 인쇄·PDF 저장(오프라인 대비 — 사용자 원문 "인터넷이 안 터질 것을 대비해서 pdf 파일로 다운받게",
// 지휘자 명세 2026-11-20). 새 문구는 모두 "제안"(사용자 확인 대상).
// ----------------------------------------------------------------------
export const MSG_PRINT = {
  /** D12·D13 버튼 — 지휘자 명세 "명단 PDF 저장" */
  BUTTON: '명단 PDF 저장',
  /** 회차를 안 골랐을 때(D12 '전체') — 제안 */
  NEED_SHOW: '회차를 먼저 골라주세요',
  TITLE: '입장 명단',
  PRINTED_AT: (text: string) => `출력 ${text}`,
  CONFIRMED_QTY: (n: number) => `확정 ${n}매`,
  PENDING_COUNT: (n: number) => `입금 대기 ${n}건`,
  SORT_LABEL: '정렬',
  SORT_NAME: '이름순',
  SORT_CODE: '예매번호순',
  PRINT_AGAIN: '인쇄 · PDF 저장',
  HINT: '인쇄 창에서 대상(프린터)을 "PDF로 저장"으로 고르면 파일로 받을 수 있습니다.',
  SECTION_CONFIRMED: (n: number) => `확정 (${n}건)`,
  SECTION_PENDING: (n: number) =>
    `입금 대기 (${n}건) — 현장에서 입금 확인 후 입장`,
  COL_CODE: '예매번호',
  COL_NAME: '이름',
  COL_PHONE: '연락처 끝',
  COL_TIERS: '등급별 매수',
  /** U41 */
  COL_INVITER: '초대한 사람',
  COL_STATUS: '상태',
  COL_MEMO: '메모',
  COL_CHECK: '입장',
  STATUS_CONFIRMED: '확정',
  STATUS_PENDING: '입금 대기',
  EMPTY_SECTION: '해당 예매가 없습니다',
  /** 바닥글 — 지휘자 명세 제안 문구 */
  FOOTER: '개인정보가 포함된 문서입니다. 공연 후 파기해 주세요.',
  LOADING: '명단을 불러오는 중입니다',
  ERROR: '명단을 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도해주세요.',
  /** 입장 체크 칸 aria — 화면 읽기 */
  CHECK_ARIA: (n: number) => `입장 체크 칸 ${n}개`,
} as const;
