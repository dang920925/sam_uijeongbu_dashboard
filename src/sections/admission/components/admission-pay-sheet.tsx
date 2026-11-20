'use client';

// ----------------------------------------------------------------------
// 입금 확인 + 입장 시트(design SCR-D13 ⑥ · designer sheet-pending): xs 바텀 시트 / md↑ 가운데 확인창(같은 내용).
// "{금액}원 입금을 확인했나요?" → 등급 줄 → 예매자·입금자명 → 입장 인원 스테퍼(1~매수, 기본 = 매수, 48) → [취소] [입금 확인 + 입장].
// 포커스 가둠·Esc·스크림 닫기는 MUI Dialog 기본.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';

import type { AdmissionLine } from '@/src/api/admission-mapper';
import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { ADMISSION_SX } from '@/src/sections/admission/components/admission-field-sx';
import { AdmissionTierLines } from '@/src/sections/admission/components/admission-tier-lines';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D13 } from '@/src/shared/messages/d13';
import { LAYOUT, RADIUS } from '@/src/theme/layout-tokens';

export interface AdmissionSheetModel {
  title: string;
  lines: AdmissionLine[];
  tiersAria: string;
  bookerText: string;
  depositorText: string | null;
  admit: number;
  rangeText: string;
  canDecrease: boolean;
  canIncrease: boolean;
}

interface AdmissionPaySheetProps {
  sheet: AdmissionSheetModel | null;
  onDecrease: () => void;
  onIncrease: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

const STEP_SX = {
  width: 48,
  height: 48,
  border: 1,
  borderColor: ADMISSION_SX.strongBorder,
  borderRadius: 9999,
  color: 'text.primary',
  '&.Mui-disabled': { borderColor: 'divider' },
};

export function AdmissionPaySheet({
  sheet,
  onDecrease,
  onIncrease,
  onConfirm,
  onClose,
}: AdmissionPaySheetProps) {
  return (
    <Dialog
      open={sheet !== null}
      onClose={onClose}
      aria-labelledby='admission-sheet-title'
      sx={{
        '& .MuiDialog-container': {
          alignItems: { xs: 'flex-end', md: 'center' },
        },
      }}
      slotProps={{
        paper: {
          sx: {
            m: { xs: 0, md: 8 },
            width: { xs: '100%', md: LAYOUT.dialog },
            maxWidth: { xs: '100%', md: LAYOUT.dialog },
            borderRadius: {
              xs: `${RADIUS.lg}px ${RADIUS.lg}px 0 0`,
              md: `${RADIUS.md}px`,
            },
          },
        },
      }}
    >
      {sheet ? (
        <div className='flex flex-col gap-4 p-4 md:p-6'>
          <Box
            aria-hidden
            sx={{
              display: { md: 'none' },
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 9999,
              bgcolor: 'divider',
            }}
          />
          <Typo.Title.Bold component='h2' id='admission-sheet-title'>
            {sheet.title}
          </Typo.Title.Bold>
          <AdmissionTierLines lines={sheet.lines} ariaText={sheet.tiersAria} />
          <Box
            component='dl'
            sx={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 2,
              m: 0,
              p: 4,
              borderRadius: `${RADIUS.md}px`,
              bgcolor: 'semantic.surface.hover',
              '& dd': { m: 0, textAlign: 'right' },
            }}
          >
            <Typo.Badge.Regular component='dt' color='text.secondary'>
              {MSG_D13.SHEET_BOOKER}
            </Typo.Badge.Regular>
            <Typo.Badge.Semibold component='dd'>
              {sheet.bookerText}
            </Typo.Badge.Semibold>
            {sheet.depositorText ? (
              <>
                <Typo.Badge.Regular component='dt' color='text.secondary'>
                  {MSG_D13.SHEET_DEPOSITOR}
                </Typo.Badge.Regular>
                <Typo.Badge.Semibold component='dd'>
                  {sheet.depositorText}
                </Typo.Badge.Semibold>
              </>
            ) : null}
          </Box>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex flex-col'>
              <Typo.Body.Semibold id='admission-sheet-admit'>
                {MSG_D13.SHEET_ADMIT}
              </Typo.Body.Semibold>
              <Typo.Badge.Regular color='text.secondary'>
                {sheet.rangeText}
              </Typo.Badge.Regular>
            </div>
            <div
              className='flex items-center gap-3'
              role='group'
              aria-labelledby='admission-sheet-admit'
            >
              <IconButton
                aria-label={MSG_D13.SHEET_DECREASE}
                disabled={!sheet.canDecrease}
                onClick={onDecrease}
                sx={STEP_SX}
              >
                <Typo.Title.Semibold color='inherit'>−</Typo.Title.Semibold>
              </IconButton>
              <Typo.Title.Bold
                className='min-w-8 text-center tabular-nums'
                aria-live='polite'
              >
                {sheet.admit}
              </Typo.Title.Bold>
              <IconButton
                aria-label={MSG_D13.SHEET_INCREASE}
                disabled={!sheet.canIncrease}
                onClick={onIncrease}
                sx={STEP_SX}
              >
                <Typo.Title.Semibold color='inherit'>+</Typo.Title.Semibold>
              </IconButton>
            </div>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outlined'
              color='inherit'
              onClick={onClose}
              sx={ADMISSION_SX.outlinedButton}
            >
              <Typo.Body.Medium color='inherit'>
                {MSG_COMMON.CANCEL}
              </Typo.Body.Medium>
            </Button>
            <Button
              variant='contained'
              onClick={onConfirm}
              startIcon={<Iconify icon='solar:wallet-money-linear' size='md' />}
              sx={{ ...ADMISSION_SX.containedButton, flex: 1 }}
            >
              <Typo.Body.Semibold color='inherit'>
                {MSG_D13.PAY}
              </Typo.Body.Semibold>
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
