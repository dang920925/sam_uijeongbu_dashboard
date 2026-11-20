'use client';

// ----------------------------------------------------------------------
// 헤더 '예매번호로 찾기'(design §6.1a) — 모든 관리 화면 공용 헤더(AdminLayout)에 들어간다.
// 조회 상태는 팝오버 안에서 그리므로 컨테이너는 ViewModel 을 View 에 넘기기만 한다.
// ----------------------------------------------------------------------
import { QuickSearchView } from '@/src/layouts/admin/quick-search/quick-search-view';
import { useQuickSearchViewModel } from '@/src/layouts/admin/quick-search/use-quick-search-view-model';

export function QuickSearch() {
  const vm = useQuickSearchViewModel();
  return <QuickSearchView {...vm} />;
}
