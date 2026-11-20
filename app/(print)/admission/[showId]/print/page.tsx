// 회차 입장 명단 인쇄·PDF 저장(오프라인 대비 — 지휘자 추가 2026-11-20) — 관리 레이아웃(사이드바) 없이 A4 한 장 모양.
// useSearchParams(?sort=) 때문에 Suspense 경계가 필요하다. Next 16: params 는 Promise.
import { Suspense } from 'react';

import { AdmissionPrintContainer } from '@/src/sections/admission-print/view/admission-print-container';

interface PageProps {
  params: Promise<{ showId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { showId } = await params;
  return (
    <Suspense>
      <AdmissionPrintContainer showId={showId} />
    </Suspense>
  );
}
