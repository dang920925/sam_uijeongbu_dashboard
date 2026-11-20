// SCR-D04 공연 상세·반 관리 — Container 만 조립한다(Next 16: params 는 Promise).
import { PerformanceDetailContainer } from '@/src/sections/performance-detail/view/performance-detail-container';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <PerformanceDetailContainer key={id} performanceId={id} />;
}
