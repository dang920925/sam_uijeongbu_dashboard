'use client';

// ----------------------------------------------------------------------
// ErrorRetry — 오류 문구 + "다시 시도"(라벨 = 재요청 동작, §11.9 상태 정직성).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { MSG_COMMON } from '@/src/shared/messages/common';

interface ErrorRetryProps {
  message: string;
  onRetry: () => void;
}

export function ErrorRetry({ message, onRetry }: ErrorRetryProps) {
  return (
    <div
      role='alert'
      className='flex flex-col items-center justify-center gap-3 px-4 py-12 text-center'
    >
      <Iconify
        icon='solar:danger-circle-linear'
        size='lg'
        sx={{ color: 'text.secondary' }}
      />
      <Typo.Badge.Regular color='text.secondary'>{message}</Typo.Badge.Regular>
      <Button
        variant='outlined'
        color='inherit'
        size='small'
        onClick={onRetry}
        startIcon={<Iconify icon='solar:refresh-linear' />}
      >
        {MSG_COMMON.RETRY}
      </Button>
    </div>
  );
}
