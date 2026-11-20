// ----------------------------------------------------------------------
// 상세 요약 한 줄 — 왼쪽 caption 라벨 + 오른쪽 내용(designer §18.3 dr__kv).
// ----------------------------------------------------------------------
import type { ReactNode } from 'react';

import { Typo } from '@/src/components/typo';

interface ApplicationDetailKvProps {
  label: string;
  children: ReactNode;
}

export function ApplicationDetailKv({
  label,
  children,
}: ApplicationDetailKvProps) {
  return (
    <div className='grid grid-cols-3 items-start gap-3'>
      <Typo.Caption.Regular color='text.secondary' sx={{ pt: 1 }}>
        {label}
      </Typo.Caption.Regular>
      <div className='col-span-2 min-w-0'>{children}</div>
    </div>
  );
}
