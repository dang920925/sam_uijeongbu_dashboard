// SCR-D14 배역·캐스팅(R3 U26 · U33) — Container 만 조립한다(Next 16: params 는 Promise).
import { PerformanceCastContainer } from '@/src/sections/performance-cast/view/performance-cast-container';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <PerformanceCastContainer key={id} performanceId={id} />;
}
