// SCR-D12 예매 관리 `/reservations` (FN-33·34·35). ?performanceId=&q= 를 useSearchParams 로 읽어 Suspense 경계가 필요하다.
// 초대 링크 주소(CLIENT_PUBLIC_URL)는 서버 환경변수라 요청 시점에 읽어(connection) prop 으로 넘긴다.
import { connection } from 'next/server';
import { Suspense } from 'react';

import { ReservationsContainer } from '@/src/sections/reservations/view/reservations-container';
import { readClientPublicUrl } from '@/src/server/server-config';

export default async function Page() {
  await connection();
  const clientPublicUrl = readClientPublicUrl();
  return (
    <Suspense>
      <ReservationsContainer clientPublicUrl={clientPublicUrl} />
    </Suspense>
  );
}
