'use client';

// ----------------------------------------------------------------------
// "명단 PDF 저장" — 회차 입장 명단 인쇄 화면을 새 탭으로 연다(오프라인 대비, D12·D13 공용 — 지휘자 추가 2026-11-20).
// 회차를 고르지 않았으면 비활성 + 이유 툴팁(터치에서도).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';

import { paths } from '@/app/paths';
import { Iconify } from '@/src/components/iconify';
import { MSG_PRINT } from '@/src/shared/messages/admission-print';

interface RosterPrintButtonProps {
  showId: string | null;
}

export function RosterPrintButton({ showId }: RosterPrintButtonProps) {
  const icon = <Iconify icon='solar:printer-linear' />;
  if (!showId)
    return (
      <Tooltip title={MSG_PRINT.NEED_SHOW} enterTouchDelay={0}>
        <span className='inline-flex'>
          <Button variant='outlined' color='inherit' startIcon={icon} disabled>
            {MSG_PRINT.BUTTON}
          </Button>
        </span>
      </Tooltip>
    );
  return (
    <Button
      variant='outlined'
      color='inherit'
      startIcon={icon}
      component={Link}
      href={paths.admissionPrint(showId)}
      target='_blank'
      rel='noopener'
    >
      {MSG_PRINT.BUTTON}
    </Button>
  );
}
