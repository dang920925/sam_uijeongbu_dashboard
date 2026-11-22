'use client';

// ----------------------------------------------------------------------
// 예매 목록 — lg 표(designer §13.7.3 2.1·보강2 11.2) / lg 미만 카드. 행 클릭·Enter = 상세 드로어.
// §6.1a 정확 일치 행: info 배경 + 왼쪽 선 + aria-current="true" + 보이는 쪽(표·카드)으로 스크롤.
// (공용 DataTable 은 강조·aria-current 가 없어 화면 전용 표로 그린다)
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useEffect, useRef, type KeyboardEvent } from 'react';

import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import {
  ReservationActionButtons,
  type ReservationRowHandlers,
} from '@/src/sections/reservations/components/reservation-action-buttons';
import { ReservationCard } from '@/src/sections/reservations/components/reservation-card';
import { ReservationIconActions } from '@/src/sections/reservations/components/reservation-icon-actions';
import { ReservationStatusCell } from '@/src/sections/reservations/components/reservation-status-cell';
import type { ReservationRow } from '@/src/sections/reservations/utils/reservation-row';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D12 } from '@/src/shared/messages/d12';
import { MSG_SEAT } from '@/src/shared/messages/seat';

interface ReservationTableProps {
  rows: ReservationRow[];
  matchId: string | null;
  busyId: string | null;
  handlers: ReservationRowHandlers;
  /** U35 — 좌석 지정 공연이면 "좌석" 열 */
  showSeatColumn?: boolean;
}

/** 정확 일치 강조 — info 옅은 배경 + 왼쪽 3px 선(designer exact-match) */
const MATCH_SX = {
  bgcolor: 'semantic.alert.infoBg',
  boxShadow: (theme: { palette: { info: { main: string } } }) =>
    `inset 3px 0 0 ${theme.palette.info.main}`,
};

const FOCUS_SX = {
  '&:focus-visible': {
    outline: 2,
    outlineColor: 'primary.main',
    outlineOffset: -2,
  },
};

function secondary(text: string) {
  return (
    <Typo.Caption.Regular color='text.secondary'>{text}</Typo.Caption.Regular>
  );
}

export function ReservationTable({
  rows,
  matchId,
  busyId,
  handlers,
  showSeatColumn = false,
}: ReservationTableProps) {
  const tableMatchRef = useRef<HTMLTableRowElement | null>(null);
  const cardMatchRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (!matchId) return;
    const target = [tableMatchRef.current, cardMatchRef.current].find(
      (el) => el && el.offsetParent !== null
    );
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    target?.scrollIntoView({
      block: 'nearest',
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [matchId]);

  const onKey = (event: KeyboardEvent, id: string) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlers.onOpenDetail(id);
    }
  };

  return (
    <>
      <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
        <Table aria-label={MSG_D12.TAB_LIST} sx={{ '& td, & th': { px: 3 } }}>
          <TableHead>
            <TableRow>
              <TableCell>{MSG_D12.COL_CODE}</TableCell>
              <TableCell>{MSG_D12.COL_BOOKER}</TableCell>
              <TableCell>{MSG_D12.COL_SHOW}</TableCell>
              {showSeatColumn ? <TableCell>{MSG_SEAT.COLUMN}</TableCell> : null}
              <TableCell>{MSG_D12.COL_TIERS}</TableCell>
              <TableCell>{MSG_D12.COL_AMOUNT}</TableCell>
              <TableCell>{MSG_D12.COL_STATUS}</TableCell>
              <TableCell>{MSG_D12.COL_ADMISSION}</TableCell>
              <TableCell>{MSG_D12.COL_INVITER}</TableCell>
              <TableCell sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                <span className='sr-only'>{MSG_D12.COL_ACTIONS}</span>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isMatch = row.id === matchId;
              return (
                <TableRow
                  key={row.id}
                  ref={isMatch ? tableMatchRef : undefined}
                  hover
                  tabIndex={0}
                  aria-current={isMatch ? 'true' : undefined}
                  aria-label={`${row.code} ${row.bookerName}`}
                  data-reservation-code={row.code}
                  onClick={() => handlers.onOpenDetail(row.id)}
                  onKeyDown={(event) => onKey(event, row.id)}
                  sx={{
                    cursor: 'pointer',
                    '&:last-child td': { borderBottom: 0 },
                    ...(isMatch ? MATCH_SX : {}),
                    ...FOCUS_SX,
                  }}
                >
                  <TableCell>
                    <Typo.Badge.Bold>{row.code}</Typo.Badge.Bold>
                  </TableCell>
                  <TableCell>
                    <span className='flex flex-col'>
                      <Typo.Body.Semibold>{row.bookerName}</Typo.Body.Semibold>
                      {secondary(row.phoneText)}
                    </span>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typo.Badge.Regular>{row.showText}</Typo.Badge.Regular>
                  </TableCell>
                  {showSeatColumn ? (
                    <TableCell data-testid='reservation-seat-cell'>
                      {row.seatText === MSG_SEAT.UNASSIGNED ? (
                        <Typo.Badge.Regular color='text.secondary'>
                          {row.seatText}
                        </Typo.Badge.Regular>
                      ) : (
                        <Typo.Badge.Bold>
                          {row.seatText ?? MSG_COMMON.EMPTY_VALUE}
                        </Typo.Badge.Bold>
                      )}
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <span className='flex flex-col'>
                      <Typo.Badge.Regular>{row.tierText}</Typo.Badge.Regular>
                      {row.hasDiscount ? (
                        <span>
                          <Label tone='info'>{MSG_D12.LINK_ONLY}</Label>
                        </span>
                      ) : null}
                      {secondary(row.totalQtyText)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className='flex flex-col'>
                      <Typo.Badge.Regular>{row.amountText}</Typo.Badge.Regular>
                      {row.isAmountOverridden
                        ? secondary(MSG_D12.OVERRIDDEN)
                        : null}
                      {secondary(row.depositorText)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ReservationStatusCell row={row} />
                  </TableCell>
                  <TableCell>
                    <Typo.Badge.Regular>{row.admissionText}</Typo.Badge.Regular>
                  </TableCell>
                  <TableCell>
                    <Typo.Badge.Regular color='text.secondary'>
                      {row.inviterText}
                    </Typo.Badge.Regular>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <span className='inline-flex items-center gap-2'>
                      <ReservationIconActions row={row} handlers={handlers} />
                      <ReservationActionButtons
                        row={row}
                        handlers={handlers}
                        isBusy={busyId === row.id}
                        withTooltip
                      />
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <Box
        component='ul'
        aria-label={MSG_D12.TAB_LIST}
        sx={{
          display: { xs: 'flex', lg: 'none' },
          flexDirection: 'column',
          m: 0,
          p: 0,
          listStyle: 'none',
        }}
      >
        {rows.map((row) => {
          const isMatch = row.id === matchId;
          return (
            <Box
              component='li'
              key={row.id}
              ref={isMatch ? cardMatchRef : undefined}
              tabIndex={0}
              aria-current={isMatch ? 'true' : undefined}
              aria-label={`${row.code} ${row.bookerName}`}
              data-reservation-code={row.code}
              onClick={() => handlers.onOpenDetail(row.id)}
              onKeyDown={(event) => onKey(event, row.id)}
              sx={{
                p: { xs: 4, md: 6 },
                borderBottom: 1,
                borderColor: 'divider',
                cursor: 'pointer',
                '&:last-of-type': { borderBottom: 0 },
                ...(isMatch ? MATCH_SX : {}),
                ...FOCUS_SX,
              }}
            >
              <ReservationCard
                row={row}
                handlers={handlers}
                isBusy={busyId === row.id}
              />
            </Box>
          );
        })}
      </Box>
    </>
  );
}
