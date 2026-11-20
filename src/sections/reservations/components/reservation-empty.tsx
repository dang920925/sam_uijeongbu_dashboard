// ----------------------------------------------------------------------
// 결과 0(designer no-result) — "조건에 맞는 예매가 없습니다" + (필터가 있으면) "필터 초기화".
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';

import { EmptyContent } from '@/src/components/empty-content';
import { MSG_D12 } from '@/src/shared/messages/d12';

interface ReservationEmptyProps {
  hasFilter: boolean;
  onReset: () => void;
}

export function ReservationEmpty({
  hasFilter,
  onReset,
}: ReservationEmptyProps) {
  return (
    <div className='flex flex-col items-center gap-3 pb-8'>
      <EmptyContent message={MSG_D12.NO_RESULT} icon='solar:ticket-linear' />
      {hasFilter ? (
        <Button variant='outlined' color='inherit' onClick={onReset}>
          {MSG_D12.RESET_FILTER}
        </Button>
      ) : null}
    </div>
  );
}
