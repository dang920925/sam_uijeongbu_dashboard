// SCR-D13 입장 체크 `/admission` (FN-36) — Container 만 조립한다. ?showId= 를 useSearchParams 로 읽어 Suspense 경계가 필요하다.
import { Suspense } from 'react';

import { AdmissionContainer } from '@/src/sections/admission/view/admission-container';

export default function Page() {
  return (
    <Suspense>
      <AdmissionContainer />
    </Suspense>
  );
}
