// ----------------------------------------------------------------------
// 요약 로딩 스켈레톤(신설 — design SCR-D02) — KPI 4장 + 목록 카드 2장(제목은 실제 문구, 행 3줄).
// 레이아웃은 기본 상태와 같은 그리드(KPI xs1→md2→lg4 gap16, 카드 xs1→lg2 gap24).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';

import { Typo } from '@/src/components/typo';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D02 } from '@/src/shared/messages/d02';
import { LAYOUT } from '@/src/theme/layout-tokens';

const KPI_KEYS = ['k1', 'k2', 'k3', 'k4'];
const ROW_KEYS = ['r1', 'r2', 'r3'];
const LIST_TITLES = [MSG_D02.RECENT_PERFORMANCES, MSG_D02.PENDING_APPLICATIONS];

export function DashboardSkeleton() {
  return (
    <div
      className='flex flex-col gap-6'
      aria-busy='true'
      aria-label={MSG_COMMON.LOADING_ARIA}
    >
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {KPI_KEYS.map((key) => (
          <Card key={key} sx={{ p: { xs: 4, md: 6 } }}>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex flex-1 flex-col gap-2'>
                <Skeleton variant='text' width='60%' />
                <Skeleton variant='text' width='30%' />
                <Skeleton variant='text' width='80%' />
              </div>
              <Skeleton
                variant='rounded'
                width={LAYOUT.control}
                height={LAYOUT.control}
              />
            </div>
          </Card>
        ))}
      </div>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {LIST_TITLES.map((title) => (
          <Card key={title}>
            <Box
              sx={{
                px: { xs: 4, md: 6 },
                pt: { xs: 4, md: 6 },
                pb: { xs: 3, md: 4 },
              }}
            >
              <Typo.Title.Bold component='h2'>{title}</Typo.Title.Bold>
            </Box>
            <Box sx={{ px: { xs: 4, md: 6 }, pb: { xs: 4, md: 6 } }}>
              <div className='flex flex-col gap-4'>
                {ROW_KEYS.map((key) => (
                  <div
                    key={key}
                    className='flex items-center justify-between gap-3'
                  >
                    <div className='flex flex-1 flex-col gap-1'>
                      <Skeleton variant='text' width='50%' />
                      <Skeleton variant='text' width='25%' />
                    </div>
                    <Skeleton
                      variant='rounded'
                      width={LAYOUT.thumb}
                      height={LAYOUT.iconLg}
                    />
                  </div>
                ))}
              </div>
            </Box>
          </Card>
        ))}
      </div>
    </div>
  );
}
