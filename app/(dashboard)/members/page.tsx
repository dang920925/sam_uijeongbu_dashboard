// SCR-D05 단원 관리 — Container 만 조립한다. ?member=<id> 를 useSearchParams 로 읽어 Suspense 경계가 필요하다.
import { Suspense } from 'react';

import { MembersContainer } from '@/src/sections/members/view/members-container';

export default function Page() {
  return (
    <Suspense>
      <MembersContainer />
    </Suspense>
  );
}
