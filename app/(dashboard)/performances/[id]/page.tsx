// SCR-D04 공연 상세·반 관리 — Container 만 조립한다(Next 16: params 는 Promise).
// (U48) 홈페이지 미리보기 주소용으로 서버 env CLIENT_PUBLIC_URL 을 읽어 넘긴다(없으면 null — 버튼 잠금).
import { PerformanceDetailContainer } from '@/src/sections/performance-detail/view/performance-detail-container';
import { readClientPublicUrl } from '@/src/server/server-config';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return (
    <PerformanceDetailContainer
      key={id}
      performanceId={id}
      clientPublicUrl={readClientPublicUrl()}
    />
  );
}
