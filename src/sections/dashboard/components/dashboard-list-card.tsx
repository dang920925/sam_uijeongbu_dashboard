// ----------------------------------------------------------------------
// 요약 목록 카드("최근 공연"·"대기 중인 신청서") — 섹션 제목 h2(Title bold) + 행 목록 또는 빈 문구.
// 카드 머리 24/24/16 · 본문 0/24/24, xs 16/16/12 · 0/16/16(designer `.ad-card__head/__body`).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useId } from 'react';

import { Typo } from '@/src/components/typo';
import { DashboardListRow } from '@/src/sections/dashboard/components/dashboard-list-row';
import type { DashboardListRow as DashboardListRowModel } from '@/src/sections/dashboard/utils/build-dashboard-view';

interface DashboardListCardProps {
  title: string;
  rows: DashboardListRowModel[];
  emptyMessage: string;
}

export function DashboardListCard({
  title,
  rows,
  emptyMessage,
}: DashboardListCardProps) {
  const headingId = useId();
  return (
    <Card component='section' aria-labelledby={headingId}>
      <Box
        sx={{
          px: { xs: 4, md: 6 },
          pt: { xs: 4, md: 6 },
          pb: { xs: 3, md: 4 },
        }}
      >
        <Typo.Title.Bold component='h2' id={headingId}>
          {title}
        </Typo.Title.Bold>
      </Box>
      <Box sx={{ px: { xs: 4, md: 6 }, pb: { xs: 4, md: 6 } }}>
        {rows.length === 0 ? (
          <div className='py-4 text-center'>
            <Typo.Badge.Regular color='text.secondary'>
              {emptyMessage}
            </Typo.Badge.Regular>
          </div>
        ) : (
          <ul className='m-0 list-none p-0'>
            {rows.map((row) => (
              <DashboardListRow
                key={row.id}
                primary={row.primary}
                secondary={row.secondary}
                labelText={row.labelText}
                labelTone={row.labelTone}
              />
            ))}
          </ul>
        )}
      </Box>
    </Card>
  );
}
