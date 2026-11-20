// SCR-D11 회차·예매 설정 — Container 만 조립한다(Next 16: params 는 Promise).
// 등급 링크 앞부분 CLIENT_PUBLIC_URL 은 서버 env 라 여기(서버 컴포넌트)서 읽어 넘긴다 —
// connection() 으로 요청 때 읽게 해 빌드 시점 값이 굳지 않게 한다(리드 지시 2026-11-20).
import { connection } from 'next/server';

import { PerformanceShowsContainer } from '@/src/sections/performance-shows/view/performance-shows-container';
import { readClientPublicUrl } from '@/src/server/server-config';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  await connection();
  const { id } = await params;
  return (
    <PerformanceShowsContainer
      key={id}
      performanceId={id}
      clientPublicUrl={readClientPublicUrl()}
    />
  );
}
