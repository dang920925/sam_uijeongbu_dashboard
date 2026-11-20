// ----------------------------------------------------------------------
// 요약 오류 카드 — 오류 문구(MSG-D02-ERROR — 사용자 확정 2026-11-19 "제안 문구 그대로") + "다시 시도"(라벨 = 재요청, §11.9).
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';

import { ErrorRetry } from '@/src/components/error-retry';
import { MSG_D02 } from '@/src/shared/messages/d02';

interface DashboardErrorCardProps {
  onRetry: () => void;
}

export function DashboardErrorCard({ onRetry }: DashboardErrorCardProps) {
  return (
    <Card>
      <ErrorRetry message={MSG_D02.ERROR} onRetry={onRetry} />
    </Card>
  );
}
