'use client';

// ----------------------------------------------------------------------
// 오프라인·오류 배너(design SCR-D13 상태 · designer offline) — 고정 영역 맨 위 alert--error + [다시 시도](48 전폭).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { ADMISSION_SX } from '@/src/sections/admission/components/admission-field-sx';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D13 } from '@/src/shared/messages/d13';
import { RADIUS } from '@/src/theme/layout-tokens';

interface AdmissionOfflineBannerProps {
  onRetry: () => void;
}

export function AdmissionOfflineBanner({
  onRetry,
}: AdmissionOfflineBannerProps) {
  return (
    <Box
      role='alert'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        p: 4,
        borderRadius: `${RADIUS.md}px`,
        border: 1,
        borderColor: 'semantic.alert.errorBorder',
        bgcolor: 'semantic.alert.errorBg',
        color: 'semantic.alert.errorFg',
      }}
    >
      <div className='flex items-start gap-2'>
        <Iconify icon='solar:cloud-cross-linear' size='md' />
        <Typo.Badge.Medium color='inherit'>{MSG_D13.OFFLINE}</Typo.Badge.Medium>
      </div>
      <Button
        variant='outlined'
        color='inherit'
        onClick={onRetry}
        startIcon={<Iconify icon='solar:refresh-linear' size='md' />}
        sx={{
          ...ADMISSION_SX.outlinedButton,
          borderColor: 'semantic.alert.errorBorder',
          color: 'semantic.alert.errorFg',
        }}
      >
        <Typo.Body.Medium color='inherit'>{MSG_COMMON.RETRY}</Typo.Body.Medium>
      </Button>
    </Box>
  );
}
