'use client';

// ----------------------------------------------------------------------
// '예매번호로 찾기' 결과 팝오버(designer `.hd-pop`) — 입력 바로 아래.
// md↑ 폭 384 오른쪽 맞춤 / xs 헤더 아래 전체 폭. 상태: 찾는 중 · 4자리 안내 · 0건 · 오류 · 여러 건 목록.
// 여러 건: 머리 "예매번호 {code} · {n}건" + listbox(option 행 ≥44 — 공연·회차 / 이름·등급 / 상태 Label).
// option 은 Enter·Space 로 고르고, ↑↓ 로 옮겨 다닌다.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import type { KeyboardEvent } from 'react';

import type { Reservation } from '@/src/api/reservation-mapper';
import { Iconify } from '@/src/components/iconify';
import { ReservationStatusLabel } from '@/src/components/reservation-status-label';
import { Typo } from '@/src/components/typo';
import {
  QUICK_SEARCH_IDS,
  resultPrimaryText,
  resultSecondaryText,
} from '@/src/layouts/admin/quick-search/quick-search-utils';
import type { QuickSearchPhase } from '@/src/layouts/admin/quick-search/use-quick-search-view-model';
import { MSG_QUICK_SEARCH } from '@/src/shared/messages/quick-search';
import { LAYOUT, RADIUS, SHADOW } from '@/src/theme/layout-tokens';

/** designer `.hd-pop` 폭 = sp-16 × 6 */
const POPUP_WIDTH = LAYOUT.quickSearchPopup;

interface QuickSearchPopupProps {
  phase: QuickSearchPhase;
  code: string;
  results: Reservation[];
  errorMessage: string;
  onSelect: (id: string) => void;
}

function moveFocus(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  const options = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')
  );
  const index = options.indexOf(document.activeElement as HTMLElement);
  const next = options[index + (event.key === 'ArrowDown' ? 1 : -1)];
  if (!next) return;
  event.preventDefault();
  next.focus();
}

function StatusLine({ icon, message }: { icon?: string; message: string }) {
  return (
    <Box
      role='status'
      sx={{
        px: 4,
        py: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        textAlign: 'center',
        color: 'text.secondary',
      }}
    >
      {icon ? <Iconify icon={icon} size='lg' /> : null}
      <Typo.Badge.Regular color='inherit'>{message}</Typo.Badge.Regular>
    </Box>
  );
}

export function QuickSearchPopup({
  phase,
  code,
  results,
  errorMessage,
  onSelect,
}: QuickSearchPopupProps) {
  if (phase === 'idle') return null;
  return (
    <Box
      id={QUICK_SEARCH_IDS.popup}
      sx={{
        position: 'absolute',
        top: { xs: '100%', md: 'calc(100% + 8px)' },
        right: 0,
        left: { xs: 0, md: 'auto' },
        width: { xs: 'auto', md: POPUP_WIDTH },
        zIndex: 20,
        py: 2,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: { xs: 0, md: `${RADIUS.md}px` },
        boxShadow: SHADOW.dialog,
      }}
    >
      {phase === 'loading' ? (
        <StatusLine message={MSG_QUICK_SEARCH.LOADING} />
      ) : phase === 'invalid' ? (
        <StatusLine message={MSG_QUICK_SEARCH.INVALID} />
      ) : phase === 'error' ? (
        <Box role='alert'>
          <StatusLine
            icon='solar:danger-circle-linear'
            message={errorMessage}
          />
        </Box>
      ) : results.length === 0 ? (
        <StatusLine
          icon='solar:ticket-sale-linear'
          message={MSG_QUICK_SEARCH.NONE}
        />
      ) : (
        <>
          <Typo.Caption.Regular
            component='p'
            color='text.secondary'
            sx={{ px: 4, py: 2 }}
          >
            {MSG_QUICK_SEARCH.resultsHead(code, results.length)}
          </Typo.Caption.Regular>
          <Box
            role='listbox'
            aria-label={MSG_QUICK_SEARCH.RESULTS}
            onKeyDown={moveFocus}
          >
            {results.map((reservation) => (
              <ButtonBase
                key={reservation.id}
                role='option'
                aria-selected={false}
                onClick={() => onSelect(reservation.id)}
                sx={{
                  width: '100%',
                  minHeight: 44,
                  px: 4,
                  py: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 3,
                  textAlign: 'left',
                  '&:hover, &.Mui-focusVisible': {
                    bgcolor: 'semantic.surface.hover',
                  },
                }}
              >
                <span className='flex min-w-0 flex-col'>
                  <Typo.Badge.Semibold noWrap>
                    {resultPrimaryText(reservation)}
                  </Typo.Badge.Semibold>
                  <Typo.Caption.Regular color='text.secondary' noWrap>
                    {resultSecondaryText(reservation)}
                  </Typo.Caption.Regular>
                </span>
                <ReservationStatusLabel
                  status={reservation.status}
                  deadlinePassed={reservation.deadlinePassed}
                  confirmedBy={reservation.confirmedBy}
                />
              </ButtonBase>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
