// U34 공연 상세 '팀 계정' 탭 — Container 만 조립한다(Next 16: params 는 Promise).
import { PerformanceTeamsContainer } from '@/src/sections/performance-teams/view/performance-teams-container';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <PerformanceTeamsContainer key={id} performanceId={id} />;
}
