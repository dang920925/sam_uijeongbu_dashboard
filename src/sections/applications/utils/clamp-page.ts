// ----------------------------------------------------------------------
// 목록 페이지 보정(순수 함수, + spec) — 처리 뒤 마지막 쪽이 비면 앞 쪽으로 옮긴다.
// 서버 페이지 봉투(PaginatedResponseDto)는 0건이면 totalPages 0 을 준다 → page 는 1 아래로 내리지 않는다
// (page=0 요청은 서버 400 COMMON_001 "page 는 1 이상이어야 합니다." — 빈 목록이 오류 화면이 된다).
// ----------------------------------------------------------------------
export function clampPage(page: number, totalPages: number): number {
  return Math.min(page, Math.max(1, totalPages));
}
