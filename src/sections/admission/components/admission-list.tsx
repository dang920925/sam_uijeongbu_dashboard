// ----------------------------------------------------------------------
// 명단 — xs 1열 카드 · md 2열 카드 · lg 표(design SCR-D13 레이아웃). 화면 폭에 맞지 않는 쪽은 display:none 이라
// 화면 읽기·키보드 순서에 섞이지 않는다.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';

import { Typo } from '@/src/components/typo';
import type { AdmissionRowHandlers } from '@/src/sections/admission/components/admission-row-actions';
import { AdmissionRowCard } from '@/src/sections/admission/components/admission-row-card';
import { AdmissionTable } from '@/src/sections/admission/components/admission-table';
import type { AdmissionRowModel } from '@/src/sections/admission/utils/admission-row';

interface AdmissionListProps {
  rows: AdmissionRowModel[];
  resultText: string | null;
  handlers: AdmissionRowHandlers;
}

export function AdmissionList({
  rows,
  resultText,
  handlers,
}: AdmissionListProps) {
  return (
    <div className='flex flex-col gap-3'>
      {resultText ? (
        <Typo.Badge.Medium color='text.secondary'>
          {resultText}
        </Typo.Badge.Medium>
      ) : null}
      <Box
        data-testid='admission-cards'
        sx={{
          display: { xs: 'grid', lg: 'none' },
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 4,
        }}
      >
        {rows.map((row) => (
          <AdmissionRowCard key={row.id} row={row} handlers={handlers} />
        ))}
      </Box>
      <Card sx={{ display: { xs: 'none', lg: 'block' } }}>
        <AdmissionTable rows={rows} handlers={handlers} />
      </Card>
    </div>
  );
}
