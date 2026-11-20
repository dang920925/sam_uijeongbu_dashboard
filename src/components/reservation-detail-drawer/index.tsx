'use client';

// ----------------------------------------------------------------------
// ReservationDetailDrawer — 예매 상세 드로어(지휘자 추가 요청 2026-11-20 "예매번호로 찾기").
// 헤더 빠른 검색(1건이면 바로 열림)과 예매 관리(D12 — 예매번호 정확히 일치·행 선택)가 같이 쓴다.
// 내용: 예매번호 · 공연명(있으면) · 회차 · 예매자(이름·연락처) · 매수·금액 · 입금자명 · 입금 기한 ·
//       상태 Label(ReservationStatusLabel) · 입장 {a}/{q} · 초대 · 메모 · 처리 이력(확정·취소 시각).
// lg·md 오른쪽 드로어(폭 LAYOUT.panel 이상), xs 전체 폭. 처리 버튼은 화면이 actions 로 넣는다.
// role=dialog·aria-modal·Esc·포커스 가둠은 MUI Drawer(Modal) 기본. 표시 값은 reservation-detail-fields.ts(+spec).
// props 계약은 리드가 고정(W4 헤더 빠른 검색이 같은 props 로 쓴다).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { useId, type ReactNode } from 'react';

import type { Reservation } from '@/src/api/reservation-mapper';
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import {
  isFreeReservation,
  toReservationDetailFields,
} from '@/src/components/reservation-detail-drawer/reservation-detail-fields';
import { ReservationStatusLabel } from '@/src/components/reservation-status-label';
import { Typo } from '@/src/components/typo';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D12 } from '@/src/shared/messages/d12';
import { LAYOUT } from '@/src/theme/layout-tokens';

export interface ReservationDetailDrawerProps {
  open: boolean;
  /** null 이면 닫힌 상태로 본다 */
  reservation: Reservation | null;
  /** 공연명(Reservation.performanceTitle 이 없을 때 화면이 아는 값) */
  performanceTitle?: string | null;
  /** 아래 처리 버튼 자리(D12: 입금 확인·취소·메모 / 빠른 검색: "예매 관리에서 보기" 링크) */
  actions?: ReactNode;
  onClose: () => void;
}

/** lg·md 오른쪽 360(designer §13.11 "lg 오른쪽 360") — 패널 토큰 320 + 40 */
const DRAWER_WIDTH = LAYOUT.panel + LAYOUT.control;

export function ReservationDetailDrawer({
  open,
  reservation,
  performanceTitle = null,
  actions,
  onClose,
}: ReservationDetailDrawerProps) {
  const titleId = useId();
  const fields = reservation
    ? toReservationDetailFields(reservation, performanceTitle)
    : [];
  return (
    <Drawer
      anchor='right'
      open={open && reservation !== null}
      onClose={onClose}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-modal': true,
          'aria-labelledby': titleId,
          sx: { width: { xs: '100%', md: DRAWER_WIDTH } },
        } as object,
      }}
    >
      {reservation ? (
        <div className='flex h-full flex-col'>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3,
              px: { xs: 4, md: 6 },
              py: 4,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typo.Title.Bold component='h2' id={titleId}>
              {MSG_D12.DETAIL_TITLE(reservation.code)}
            </Typo.Title.Bold>
            <IconButton
              aria-label={MSG_COMMON.CLOSE}
              onClick={onClose}
              sx={{ width: LAYOUT.touch, height: LAYOUT.touch, mr: -2 }}
            >
              <Iconify icon='solar:close-circle-linear' size='md' />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 4, md: 6 }, py: 4 }}>
            <div className='flex flex-col gap-4'>
              <span className='flex flex-wrap items-center gap-1'>
                <ReservationStatusLabel
                  status={reservation.status}
                  deadlinePassed={reservation.deadlinePassed}
                  confirmedBy={reservation.confirmedBy}
                />
                {isFreeReservation(reservation) ? (
                  <Label tone='info'>{MSG_D12.FREE_LABEL}</Label>
                ) : null}
                {reservation.source === 'ADMIN' ? (
                  <Label tone='neutral'>{MSG_D12.ADMIN_LABEL}</Label>
                ) : null}
              </span>
              <dl className='m-0 flex flex-col gap-3'>
                {fields.map((field) => (
                  <div key={field.key} className='grid grid-cols-3 gap-3'>
                    <dt>
                      <Typo.Badge.Regular color='text.secondary'>
                        {field.label}
                      </Typo.Badge.Regular>
                    </dt>
                    <dd className='col-span-2 m-0 flex min-w-0 flex-col gap-1'>
                      <Typo.Badge.Medium sx={{ overflowWrap: 'anywhere' }}>
                        {field.value}
                      </Typo.Badge.Medium>
                      {field.sub ? (
                        <Typo.Caption.Regular color='text.secondary'>
                          {field.sub}
                        </Typo.Caption.Regular>
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Box>
          {actions ? (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                px: { xs: 4, md: 6 },
                py: 4,
                borderTop: 1,
                borderColor: 'divider',
                '& > .MuiButton-root': { flex: 1 },
              }}
            >
              {actions}
            </Box>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
