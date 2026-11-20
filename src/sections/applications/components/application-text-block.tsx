// ----------------------------------------------------------------------
// 상세 긴 글(신청 동기·문의사항) — 라벨 + 옅은 회색 상자, 줄바꿈 유지(현행 TextBlock, Applications.tsx:52-60).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Typo } from '@/src/components/typo';

interface ApplicationTextBlockProps {
  label: string;
  value: string;
}

export function ApplicationTextBlock({
  label,
  value,
}: ApplicationTextBlockProps) {
  return (
    <div className='flex flex-col gap-1'>
      <Typo.Caption.Regular color='text.secondary'>
        {label}
      </Typo.Caption.Regular>
      <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 3 }}>
        <Typo.Badge.Regular component='p' sx={{ whiteSpace: 'pre-wrap' }}>
          {value}
        </Typo.Badge.Regular>
      </Box>
    </div>
  );
}
