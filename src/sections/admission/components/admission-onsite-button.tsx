'use client';

// ----------------------------------------------------------------------
// "현장 예매 등록"(design SCR-D13 ⑦) — 보조 버튼 48, 테두리 3:1. xs 는 아래 고정 바 전폭, md↑ 는 머리 오른쪽.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { ADMISSION_SX } from '@/src/sections/admission/components/admission-field-sx';
import { MSG_D13 } from '@/src/shared/messages/d13';

interface AdmissionOnsiteButtonProps {
  onClick: () => void;
  fullWidth?: boolean;
}

export function AdmissionOnsiteButton({
  onClick,
  fullWidth = false,
}: AdmissionOnsiteButtonProps) {
  return (
    <Button
      variant='outlined'
      color='inherit'
      fullWidth={fullWidth}
      onClick={onClick}
      startIcon={<Iconify icon='solar:add-circle-linear' size='md' />}
      sx={ADMISSION_SX.outlinedButton}
    >
      <Typo.Body.Medium color='inherit'>{MSG_D13.ONSITE}</Typo.Body.Medium>
    </Button>
  );
}
