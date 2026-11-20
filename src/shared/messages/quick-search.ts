// ----------------------------------------------------------------------
// 헤더 '예매번호로 찾기'(design §6.1a · designer §13.11 리드 단락 · _shell-admin-r1) 문구 — 모두 제안.
// 0건 문구는 designer "일치하는 예매가 없습니다"(지휘자 원문 "찾는 예매가 없습니다" 와 다름 — designer 를 따름).
// ----------------------------------------------------------------------
export const MSG_QUICK_SEARCH = {
  /** role=search 영역 이름 · md↑ placeholder · xs 아이콘 버튼 aria-label */
  LABEL: '예매번호로 찾기',
  /** xs 펼친 입력 placeholder — 시안 _shell-admin-r1 */
  PLACEHOLDER_XS: '예매번호 4자리',
  /** xs ← 닫기 aria-label — 시안 */
  CLOSE: '찾기 닫기',
  /** 결과 listbox aria-label — 시안 */
  RESULTS: '예매번호 찾기 결과',
  /** 결과 머리 "예매번호 {code} · {n}건" — 시안 */
  resultsHead: (code: string, count: number) => `예매번호 ${code} · ${count}건`,
  /** 0건 — designer 제안 */
  NONE: '일치하는 예매가 없습니다',
  /** 4자리가 아닐 때 — 지휘자 브리프 제안 */
  INVALID: '예매번호 4자리를 입력해주세요',
  /** 조회 중(접근성 상태 문구, 자체 결정) */
  LOADING: '찾는 중',
  /** 드로어 링크 — designer find-one */
  VIEW_IN_RESERVATIONS: '예매 관리에서 보기',
} as const;
