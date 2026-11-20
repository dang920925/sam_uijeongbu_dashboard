// ----------------------------------------------------------------------
// 공연 없음(designer no-performance) — 안내 문구 + "공연 관리로 이동".
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Link from 'next/link';

import { EmptyContent } from '@/src/components/empty-content';
import { paths } from '@/app/paths';
import { MSG_D12 } from '@/src/shared/messages/d12';

export function NoPerformance() {
  return (
    <Card>
      <div className='flex flex-col items-center gap-3 pb-8'>
        <EmptyContent message={MSG_D12.NO_PERF} icon='solar:ticket-linear' />
        <Button
          component={Link}
          href={paths.performances.root}
          variant='outlined'
          color='inherit'
        >
          {MSG_D12.NO_PERF_GO}
        </Button>
      </div>
    </Card>
  );
}
