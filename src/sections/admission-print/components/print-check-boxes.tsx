// ----------------------------------------------------------------------
// 입장 체크 칸 □ × 매수 — 이미 입장한 인원은 앞쪽 칸을 ■ 로(인쇄 시점 기준).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { MSG_PRINT } from '@/src/shared/messages/admission-print';

interface PrintCheckBoxesProps {
  quantity: number;
  admittedCount: number;
}

export function PrintCheckBoxes({
  quantity,
  admittedCount,
}: PrintCheckBoxesProps) {
  return (
    <span
      className='inline-flex flex-wrap gap-1'
      role='img'
      aria-label={MSG_PRINT.CHECK_ARIA(quantity)}
    >
      {Array.from({ length: quantity }, (_, i) => (
        <Box
          key={i}
          component='span'
          sx={{
            display: 'inline-block',
            width: 16,
            height: 16,
            border: 1,
            borderColor: 'common.black',
            bgcolor: i < admittedCount ? 'common.black' : 'common.white',
          }}
        />
      ))}
    </span>
  );
}
