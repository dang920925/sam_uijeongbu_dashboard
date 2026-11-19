// ----------------------------------------------------------------------
// SCR-D04 상태 카드 — 404 "공연을 찾을 수 없습니다"(가면 아이콘, designer not-found) 와 조회 오류(다시 시도).
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';

import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { MSG_D04 } from '@/src/shared/messages/d04';

interface PerformanceDetailStateCardProps {
  /** 오류일 때만 — 없으면 404 */
  errorMessage?: string | null;
  onRetry?: () => void;
}

export function PerformanceDetailStateCard({
  errorMessage,
  onRetry,
}: PerformanceDetailStateCardProps) {
  return (
    <Card>
      {errorMessage && onRetry ? (
        <ErrorRetry message={errorMessage} onRetry={onRetry} />
      ) : (
        <EmptyContent message={MSG_D04.NOT_FOUND} icon='solar:masks-linear' />
      )}
    </Card>
  );
}
