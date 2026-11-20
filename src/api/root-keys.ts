// ----------------------------------------------------------------------
// 도메인 쿼리 키 루트 — 여러 도메인이 서로의 캐시를 무효화하므로 루트 이름을 한 곳에 둔다.
// 각 <domain>-queries.ts 의 `<domain>Keys.all` 은 반드시 이 값을 쓴다.
//   예) 단원으로 등록(D06) → member·application·dashboard 무효화, 공연 변경 → dashboard 무효화.
// ----------------------------------------------------------------------
export const ROOT_KEYS = {
  dashboard: ['dashboard'] as const,
  performance: ['performance'] as const,
  member: ['member'] as const,
  application: ['application'] as const,
  schedule: ['schedule'] as const,
  gallery: ['gallery'] as const,
  staff: ['staff'] as const,
  popup: ['popup'] as const,
  /**
   * 예매 묶음(U24) — 회차·예매 설정·예매·집계·입장·초대 코드는 모두 예매 행에서 계산되므로
   * 같은 접두사 `booking` 아래 둔다. 예매를 바꾸면 `ROOT_KEYS.booking` 하나로 회차 좌석·집계·입장 명단을 함께 무효화한다.
   */
  booking: ['booking'] as const,
  show: ['booking', 'show'] as const,
  bookingPolicy: ['booking', 'policy'] as const,
  priceTier: ['booking', 'price-tier'] as const,
  reservation: ['booking', 'reservation'] as const,
  admission: ['booking', 'admission'] as const,
  inviteCode: ['booking', 'invite-code'] as const,
  account: ['account'] as const,
};
