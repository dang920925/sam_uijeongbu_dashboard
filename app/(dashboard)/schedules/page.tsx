// SCR-D08 일정 관리 `/schedules` (FN-15 · U23 보강 · U29) — 조립만 한다.
// 오늘(KST)은 요청 시각으로 계산해 넘긴다(connection — 하이드레이션 일치). ?view=&date= 를 useSearchParams 로 읽어 Suspense 경계가 필요하다.
import { connection } from 'next/server';
import { Suspense } from 'react';

import { SchedulesContainer } from '@/src/sections/schedules/view/schedules-container';
import { todayKst } from '@/src/utils/kst-date-format';

export default async function Page() {
  await connection();
  const today = todayKst();
  return (
    <Suspense>
      <SchedulesContainer today={today} />
    </Suspense>
  );
}
