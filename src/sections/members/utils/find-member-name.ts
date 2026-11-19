// ----------------------------------------------------------------------
// 캐시된 단원 목록에서 이름 찾기 — 패널 상세 조회가 실패해도 머리에 이름을 보이게(designer panel-error 프레임).
// 목록을 아직 안 받았거나 다른 쪽에 있으면 null.
// ----------------------------------------------------------------------
import type { QueryClient } from '@tanstack/react-query';

import { memberKeys } from '@/src/api/member-queries';
import type { Paginated } from '@/src/types/common';
import type { Member } from '@/src/types/member';

export function findMemberNameInLists(
  queryClient: QueryClient,
  memberId: string
): string | null {
  const lists = queryClient.getQueriesData<Paginated<Member>>({
    queryKey: [...memberKeys.all, 'list'],
  });
  for (const [, data] of lists) {
    const found = data?.items.find((m) => m.id === memberId);
    if (found) return found.name;
  }
  return null;
}
