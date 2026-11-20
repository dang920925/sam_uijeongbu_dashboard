'use client';

// ----------------------------------------------------------------------
// 다른 회차 예매 안내(design §6.1a · designer other-show): "다른 회차 예매입니다" + "이 회차(…) 명단에는 없습니다." →
// 줄마다 이름(title) · 상태 Label · "예매 1234 · 작품 · 12/13 17:00 · 2매 · 확정" · [그 회차로 이동](48 전폭, 첫 줄 주 버튼). 최대 5줄.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';

import { Iconify } from '@/src/components/iconify';
import { ReservationStatusLabel } from '@/src/components/reservation-status-label';
import { Typo } from '@/src/components/typo';
import { ADMISSION_SX } from '@/src/sections/admission/components/admission-field-sx';
import { MSG_D13 } from '@/src/shared/messages/d13';
import type { ReservationStatus } from '@/src/types/booking';

export interface AdmissionOtherShowMatchModel {
  id: string;
  bookerName: string;
  status: ReservationStatus;
  meta: string;
  showId: string;
  canMove: boolean;
}

interface AdmissionOtherShowsProps {
  subtitle: string;
  matches: AdmissionOtherShowMatchModel[];
  onMove: (showId: string) => void;
}

export function AdmissionOtherShows({
  subtitle,
  matches,
  onMove,
}: AdmissionOtherShowsProps) {
  return (
    <Card
      component='section'
      aria-labelledby='admission-other-title'
      sx={{ p: { xs: 4, md: 6 } }}
    >
      <div className='flex flex-col gap-3'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <Iconify
              icon='solar:info-circle-linear'
              size='lg'
              sx={{ color: 'info.main' }}
            />
            <Typo.Title.Bold component='h2' id='admission-other-title'>
              {MSG_D13.OTHER_TITLE}
            </Typo.Title.Bold>
          </div>
          <Typo.Badge.Regular color='text.secondary'>
            {subtitle}
          </Typo.Badge.Regular>
        </div>
        {matches.map((match, index) => (
          <div key={match.id} className='flex flex-col gap-3'>
            <Divider />
            <div className='flex items-center justify-between gap-2'>
              <Typo.Title.Bold component='h3'>
                {match.bookerName}
              </Typo.Title.Bold>
              <ReservationStatusLabel status={match.status} />
            </div>
            <Typo.Badge.Regular color='text.secondary'>
              {match.meta}
            </Typo.Badge.Regular>
            {match.canMove ? (
              <Button
                variant={index === 0 ? 'contained' : 'outlined'}
                color={index === 0 ? 'primary' : 'inherit'}
                fullWidth
                onClick={() => onMove(match.showId)}
                startIcon={
                  <Iconify icon='solar:arrow-right-linear' size='md' />
                }
                sx={
                  index === 0
                    ? ADMISSION_SX.containedButton
                    : ADMISSION_SX.outlinedButton
                }
              >
                <Typo.Body.Medium color='inherit'>
                  {MSG_D13.OTHER_MOVE}
                </Typo.Body.Medium>
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
