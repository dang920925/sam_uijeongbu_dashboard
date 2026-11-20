// D12 공연 선택(지휘자 결정 2026-11-20): 사용자가 고른 공연 > URL ?performanceId > 오늘 이후 첫 회차의 공연 > 첫 공연.
// 목록에 없는 id(삭제 등)는 건너뛴다.
export function pickPerformanceId(
  candidates: (string | null | undefined)[],
  performanceIds: string[]
): string | null {
  for (const id of candidates) if (id && performanceIds.includes(id)) return id;
  return performanceIds[0] ?? null;
}
