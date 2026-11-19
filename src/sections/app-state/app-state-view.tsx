'use client';

// ----------------------------------------------------------------------
// 404·오류 상태 화면 View — 문구 + 동작 버튼 1개(라벨 = 동작, §11.9).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Link from 'next/link';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';

interface AppStateViewProps {
  message: string;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
}

export function AppStateView({
  message,
  actionLabel,
  actionHref,
  onAction,
}: AppStateViewProps) {
  return (
    <main className='flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center'>
      <Iconify
        icon='solar:danger-circle-linear'
        size='lg'
        sx={{ color: 'text.secondary' }}
      />
      <Typo.Title.Bold component='h1'>{message}</Typo.Title.Bold>
      {actionHref ? (
        <Button variant='contained' component={Link} href={actionHref}>
          {actionLabel}
        </Button>
      ) : (
        <Button variant='contained' onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </main>
  );
}
