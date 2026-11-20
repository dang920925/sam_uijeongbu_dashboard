'use client';

// ----------------------------------------------------------------------
// 헤더 '예매번호로 찾기' View(design §6.1a · designer §13.11 · _shell-admin-r1 `.hd-find`) — props 만으로 그린다.
// - md↑: 헤더 오른쪽 입력 상시(폭 256, 돋보기 + placeholder "예매번호로 찾기").
// - xs: 돋보기 아이콘 버튼 44 → 헤더 전체 폭 입력으로 펼침 + ← 닫기 44.
// - 입력 하나를 반응형으로 같이 쓴다(inputmode numeric · maxlength 4 · role=combobox + aria-expanded/controls).
// - 1건 → ReservationDetailDrawer(actions: 입금 대기면 "입금 확인" + "예매 관리에서 보기").
// - 바깥 클릭·Esc 로 결과를 닫는다(Esc 를 xs 펼침 중 두 번 누르면 펼침도 닫힘).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Link from 'next/link';
import type { FormEvent, KeyboardEvent } from 'react';

import { Iconify } from '@/src/components/iconify';
import { ReservationDetailDrawer } from '@/src/components/reservation-detail-drawer';
import { QuickSearchPopup } from '@/src/layouts/admin/quick-search/quick-search-popup';
import {
  CODE_LENGTH,
  QUICK_SEARCH_IDS,
  reservationFocusHref,
} from '@/src/layouts/admin/quick-search/quick-search-utils';
import type { QuickSearchViewModel } from '@/src/layouts/admin/quick-search/use-quick-search-view-model';
import { MSG_D12 } from '@/src/shared/messages/d12';
import { MSG_QUICK_SEARCH } from '@/src/shared/messages/quick-search';
import { LAYOUT } from '@/src/theme/layout-tokens';

/** designer `.hd-find__box` 폭 = sp-16 × 4 */
const INPUT_WIDTH = LAYOUT.quickSearchInput;

const iconButtonSx = {
  width: LAYOUT.touch,
  height: LAYOUT.touch,
  color: 'text.primary',
  flexShrink: 0,
};

export function QuickSearchView({
  input,
  phase,
  code,
  results,
  errorMessage,
  selected,
  isXsOpen,
  isConfirming,
  onInputChange,
  onSubmit,
  onSelect,
  onClosePopup,
  onCloseDrawer,
  onNavigate,
  onConfirm,
  onOpenXs,
  onCloseXs,
}: QuickSearchViewModel) {
  const isPopupOpen = phase !== 'idle';
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Escape') return;
    if (isPopupOpen) onClosePopup();
    else if (isXsOpen) onCloseXs();
  };
  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowDown' || phase !== 'results') return;
    const first = document.querySelector<HTMLElement>(
      `#${QUICK_SEARCH_IDS.popup} [role="option"]`
    );
    if (!first) return;
    event.preventDefault();
    first.focus();
  };

  return (
    <>
      <IconButton
        id={QUICK_SEARCH_IDS.openButton}
        aria-label={MSG_QUICK_SEARCH.LABEL}
        onClick={onOpenXs}
        sx={{
          ...iconButtonSx,
          display: { xs: isXsOpen ? 'none' : 'inline-flex', md: 'none' },
          ml: 'auto',
          mr: -2,
        }}
      >
        <Iconify icon='solar:magnifier-linear' size='lg' />
      </IconButton>

      <ClickAwayListener onClickAway={onClosePopup}>
        <Box
          component='form'
          role='search'
          aria-label={MSG_QUICK_SEARCH.LABEL}
          noValidate
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          sx={{
            display: { xs: isXsOpen ? 'flex' : 'none', md: 'flex' },
            alignItems: 'center',
            gap: 2,
            ml: { md: 'auto' },
            position: { xs: 'absolute', md: 'relative' },
            inset: { xs: 0, md: 'auto' },
            zIndex: { xs: 1, md: 'auto' },
            pl: { xs: 2, md: 0 },
            pr: { xs: 4, md: 0 },
            bgcolor: 'background.paper',
          }}
        >
          <IconButton
            aria-label={MSG_QUICK_SEARCH.CLOSE}
            onClick={onCloseXs}
            sx={{ ...iconButtonSx, display: { md: 'none' } }}
          >
            <Iconify icon='solar:alt-arrow-left-linear' size='lg' />
          </IconButton>
          <OutlinedInput
            id={QUICK_SEARCH_IDS.input}
            value={input}
            placeholder={MSG_QUICK_SEARCH.LABEL}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            startAdornment={
              <InputAdornment position='start'>
                <Iconify
                  icon='solar:magnifier-linear'
                  size='sm'
                  sx={{ color: 'text.secondary' }}
                />
              </InputAdornment>
            }
            inputProps={{
              inputMode: 'numeric',
              maxLength: CODE_LENGTH,
              autoComplete: 'off',
              role: 'combobox',
              'aria-label': MSG_QUICK_SEARCH.LABEL,
              'aria-autocomplete': 'none',
              'aria-expanded': isPopupOpen,
              'aria-controls': QUICK_SEARCH_IDS.popup,
            }}
            sx={{
              flex: { xs: 1, md: 'none' },
              width: { md: INPUT_WIDTH },
              bgcolor: 'background.paper',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          <QuickSearchPopup
            phase={phase}
            code={code}
            results={results}
            errorMessage={errorMessage}
            onSelect={onSelect}
          />
        </Box>
      </ClickAwayListener>

      <ReservationDetailDrawer
        open={selected !== null}
        reservation={selected}
        onClose={onCloseDrawer}
        actions={
          selected ? (
            <>
              {selected.status === 'PENDING' ? (
                <Button
                  variant='contained'
                  fullWidth
                  loading={isConfirming}
                  loadingPosition='start'
                  startIcon={<Iconify icon='solar:check-circle-linear' />}
                  onClick={onConfirm}
                >
                  {MSG_D12.ACT_CONFIRM}
                </Button>
              ) : null}
              <Button
                component={Link}
                href={reservationFocusHref(selected)}
                variant='outlined'
                color='inherit'
                fullWidth
                onClick={onNavigate}
              >
                {MSG_QUICK_SEARCH.VIEW_IN_RESERVATIONS}
              </Button>
            </>
          ) : null
        }
      />
    </>
  );
}
