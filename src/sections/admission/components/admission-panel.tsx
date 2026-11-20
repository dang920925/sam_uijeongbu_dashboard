'use client';

// ----------------------------------------------------------------------
// lg 오른쪽 현황 패널 360(designer `--layout-admission-panel` · `.adm-panel`): 회차 → 입장/확정 큰 숫자 + 진행 막대(success) →
// 미입장 · 입금 대기 2칸 → "방금 갱신 · 10초마다 새로고침" + 새로고침.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import type {
  AdmissionFreshness,
  AdmissionSummaryModel,
} from '@/src/sections/admission/components/admission-stats';
import { MSG_BOOKING } from '@/src/shared/messages/booking';
import { MSG_D13 } from '@/src/shared/messages/d13';

interface AdmissionPanelProps {
  showLabel: string;
  summary: AdmissionSummaryModel | null;
  freshness: AdmissionFreshness;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const DASH = '–';

export function AdmissionPanel({
  showLabel,
  summary,
  freshness,
  isRefreshing,
  onRefresh,
}: AdmissionPanelProps) {
  return (
    <Card component='section' aria-label={MSG_D13.STAT_ARIA} sx={{ p: 6 }}>
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col gap-1'>
          <Typo.Badge.Regular color='text.secondary'>
            {MSG_D13.PANEL_SHOW}
          </Typo.Badge.Regular>
          <Typo.Body.Semibold>{showLabel}</Typo.Body.Semibold>
        </div>
        <div className='flex flex-col gap-2'>
          <Typo.Badge.Regular color='text.secondary'>
            {MSG_D13.STAT_ADMITTED}
          </Typo.Badge.Regular>
          <span className='flex items-baseline gap-1'>
            <Typo.Head.Bold className='tabular-nums'>
              <span data-testid='stat-admitted'>
                {summary ? summary.admitted : DASH}
              </span>
            </Typo.Head.Bold>
            <Typo.Title.Semibold
              color='text.secondary'
              className='tabular-nums'
            >
              <span data-testid='stat-confirmed'>
                {summary
                  ? `/ ${summary.confirmed}${MSG_BOOKING.TICKET_UNIT}`
                  : ''}
              </span>
            </Typo.Title.Semibold>
          </span>
          <LinearProgress
            variant='determinate'
            value={summary?.progress ?? 0}
            color='success'
            aria-hidden
            sx={{
              height: 8,
              borderRadius: 9999,
              bgcolor: 'semantic.surface.muted',
            }}
          />
        </div>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderTop: 1,
            borderColor: 'divider',
            pt: 4,
            '& > div + div': { borderLeft: 1, borderColor: 'divider', pl: 4 },
          }}
        >
          <div className='flex flex-col'>
            <Typo.Badge.Regular color='text.secondary'>
              {MSG_D13.STAT_NOT_ADMITTED}
            </Typo.Badge.Regular>
            <Typo.Head.Bold className='tabular-nums'>
              <span data-testid='stat-not-admitted'>
                {summary ? summary.notAdmitted : DASH}
              </span>
            </Typo.Head.Bold>
          </div>
          <div className='flex flex-col'>
            <Typo.Badge.Regular color='text.secondary'>
              {MSG_D13.STAT_PENDING}
            </Typo.Badge.Regular>
            <span className='flex items-baseline gap-1'>
              <Typo.Head.Bold
                color='semantic.label.warning.fg'
                className='tabular-nums'
              >
                <span data-testid='stat-pending'>
                  {summary ? summary.pendingCount : DASH}
                </span>
              </Typo.Head.Bold>
              <Typo.Title.Semibold color='semantic.label.warning.fg'>
                {summary ? MSG_D13.COUNT_UNIT : ''}
              </Typo.Title.Semibold>
            </span>
          </div>
        </Box>
        <div className='flex items-center justify-between gap-2'>
          <Typo.Badge.Regular
            color={
              freshness.isStale ? 'semantic.alert.errorFg' : 'text.secondary'
            }
          >
            {freshness.isStale ? freshness.text : MSG_D13.PANEL_FRESH}
          </Typo.Badge.Regular>
          <IconButton
            aria-label={MSG_D13.REFRESH}
            onClick={onRefresh}
            disabled={isRefreshing}
            sx={{ width: 48, height: 48, color: 'text.primary' }}
          >
            <Iconify icon='solar:refresh-linear' size='lg' />
          </IconButton>
        </div>
      </div>
    </Card>
  );
}
