// SCR-D11 회차·예매 설정 — Container 만 조립한다(Next 16: params 는 Promise).
// (U41) 등급 링크 카드가 없어져 CLIENT_PUBLIC_URL 을 넘기지 않는다.

import { PerformanceShowsContainer } from '@/src/sections/performance-shows/view/performance-shows-container';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <PerformanceShowsContainer key={id} performanceId={id} />;
}
