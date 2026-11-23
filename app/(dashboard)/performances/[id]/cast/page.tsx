// SCR-D14 배역·캐스팅(R3 U26 · U33) — Container 만 조립한다(Next 16: params 는 Promise).
// (U48) 홈페이지 미리보기·'홈페이지에서 보기' 주소용으로 서버 env CLIENT_PUBLIC_URL 을 넘긴다.
import { PerformanceCastContainer } from '@/src/sections/performance-cast/view/performance-cast-container';
import { readClientPublicUrl } from '@/src/server/server-config';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return (
    <PerformanceCastContainer
      key={id}
      performanceId={id}
      clientPublicUrl={readClientPublicUrl()}
    />
  );
}
