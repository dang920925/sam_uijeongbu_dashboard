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
};
