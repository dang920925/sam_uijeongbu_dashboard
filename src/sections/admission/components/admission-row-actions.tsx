'use client';

// ----------------------------------------------------------------------
// 행 동작(design SCR-D13 ⑤⑥ · designer §13.7.4 1.3): 확정 = [−1] 48×48 보조 · [전원 입장] 보조 · [+1 입장] 주(남은 폭 전부, 엄지 쪽).
// 입장 0 이면 [−1] 비활성(자리 유지 — 손가락 아래 버튼이 움직이지 않게). 다 들어온 행 = "입장 완료" + [−1].
// 입금 대기 = [입금 확인 + 입장] 하나(주). 요청 중에는 그 행 버튼 전부 잠금 + aria-busy.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { ADMISSION_SX } from '@/src/sections/admission/components/admission-field-sx';
import type { AdmissionRowModel } from '@/src/sections/admission/utils/admission-row';
import { MSG_D13 } from '@/src/shared/messages/d13';

export interface AdmissionRowHandlers {
  onPlus: (id: string) => void;
  onAll: (id: string) => void;
  onMinus: (id: string) => void;
  onPay: (id: string) => void;
}

interface AdmissionRowActionsProps {
  row: AdmissionRowModel;
  handlers: AdmissionRowHandlers;
  /** 카드(xs·md)는 "입장 완료"를 동작 줄 왼쪽에 둔다 */
  showDone?: boolean;
  /** lg 표 — 버튼 폭을 내용만큼 */
  compact?: boolean;
}

export function AdmissionRowActions({
  row,
  handlers,
  showDone = false,
  compact = false,
}: AdmissionRowActionsProps) {
  const minus = (
    <Button
      variant='outlined'
      color='inherit'
      aria-label={row.minusAria}
      disabled={row.isBusy || row.isMinusDisabled}
      onClick={() => handlers.onMinus(row.id)}
      sx={{ ...ADMISSION_SX.outlinedButton, minWidth: 48, px: 0 }}
    >
      <Typo.Body.Semibold color='inherit'>{MSG_D13.MINUS}</Typo.Body.Semibold>
    </Button>
  );

  if (row.kind === 'pending')
    return (
      <div className='flex' aria-busy={row.isBusy}>
        <Button
          variant='contained'
          disabled={row.isBusy}
          onClick={() => handlers.onPay(row.id)}
          startIcon={<Iconify icon='solar:wallet-money-linear' size='md' />}
          sx={{ ...ADMISSION_SX.containedButton, flex: compact ? 'none' : 1 }}
        >
          <Typo.Body.Semibold color='inherit'>{MSG_D13.PAY}</Typo.Body.Semibold>
        </Button>
      </div>
    );

  if (row.kind === 'done')
    return (
      <div
        className='flex items-center justify-between gap-2'
        aria-busy={row.isBusy}
      >
        {showDone ? (
          <span className='inline-flex items-center gap-1'>
            <Iconify
              icon='solar:check-circle-linear'
              size='md'
              sx={{ color: 'success.main' }}
            />
            <Typo.Body.Semibold color='success.main'>
              {MSG_D13.DONE}
            </Typo.Body.Semibold>
          </span>
        ) : (
          <span />
        )}
        {minus}
      </div>
    );

  return (
    <div className='flex items-center gap-2' aria-busy={row.isBusy}>
      {minus}
      {row.showAll ? (
        <Button
          variant='outlined'
          color='inherit'
          aria-label={row.allAria}
          disabled={row.isBusy}
          onClick={() => handlers.onAll(row.id)}
          sx={ADMISSION_SX.outlinedButton}
        >
          <Typo.Body.Medium color='inherit'>{MSG_D13.ALL}</Typo.Body.Medium>
        </Button>
      ) : null}
      <Button
        variant='contained'
        aria-label={row.plusAria}
        disabled={row.isBusy}
        onClick={() => handlers.onPlus(row.id)}
        sx={{ ...ADMISSION_SX.containedButton, flex: compact ? 'none' : 1 }}
      >
        <Typo.Body.Semibold color='inherit'>{MSG_D13.PLUS}</Typo.Body.Semibold>
      </Button>
    </div>
  );
}
