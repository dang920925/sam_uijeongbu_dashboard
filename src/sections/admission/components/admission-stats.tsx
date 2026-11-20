'use client';

// ----------------------------------------------------------------------
// 현황(design SCR-D13 ② · designer `.adm-status` LiveCounter, xs·md): 회차 이름 + "방금 갱신"(또는 "HH:MM 기준") + 새로고침(48) →
// 3칸(입장/확정 · 미입장 · 입금 대기, 1.5 : 1 : 1). 숫자는 폴링으로 바뀌므로 live 영역이 아니다(사용자 처리 결과는 따로 알림).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { MSG_BOOKING } from '@/src/shared/messages/booking';
import { MSG_D13 } from '@/src/shared/messages/d13';

export interface AdmissionSummaryModel {
  admitted: number;
  confirmed: number;
  notAdmitted: number;
  pendingCount: number;
  progress: number;
}

export interface AdmissionFreshness {
  text: string;
  isStale: boolean;
}

interface AdmissionStatsProps {
  showLabel: string;
  summary: AdmissionSummaryModel | null;
  freshness: AdmissionFreshness;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const DASH = '–';

export function AdmissionStats({
  showLabel,
  summary,
  freshness,
  isRefreshing,
  onRefresh,
}: AdmissionStatsProps) {
  return (
    <section aria-label={MSG_D13.STAT_ARIA} className='flex flex-col gap-2'>
      <div className='flex items-center justify-between gap-2'>
        <Typo.Badge.Semibold>{showLabel}</Typo.Badge.Semibold>
        <div className='flex items-center gap-1'>
          <Typo.Badge.Regular
            color={
              freshness.isStale ? 'semantic.alert.errorFg' : 'text.secondary'
            }
          >
            {freshness.text}
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
      <Box
        data-testid='admission-stats'
        sx={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr',
          '& > div + div': { borderLeft: 1, borderColor: 'divider', pl: 3 },
        }}
      >
        <div className='flex flex-col'>
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
        </div>
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
    </section>
  );
}
