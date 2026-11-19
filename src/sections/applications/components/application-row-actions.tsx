'use client';

// ----------------------------------------------------------------------
// 표(lg↑) 행 액션 — 아이콘 버튼 32 + aria-label·title(현행 title 문구 "상세 보기"·"승인"·"거절" 재사용).
// 대기 = 상세·승인(초록)·거절(빨강) / 승인+미등록 = 상세·단원으로 등록 / 그 외 = 상세(사용자 결정 2026-11-19 D6).
// ----------------------------------------------------------------------
import IconButton from '@mui/material/IconButton';

import { Iconify } from '@/src/components/iconify';
import type {
  ApplicationRow,
  ApplicationRowHandlers,
} from '@/src/sections/applications/utils/application-row';
import { MSG_D06 } from '@/src/shared/messages/d06';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface ApplicationRowActionsProps {
  row: ApplicationRow;
  handlers: ApplicationRowHandlers;
}

const BUTTON_SX = { width: LAYOUT.controlSm, height: LAYOUT.controlSm };

export function ApplicationRowActions({
  row,
  handlers,
}: ApplicationRowActionsProps) {
  return (
    <span className='inline-flex items-center gap-1'>
      <IconButton
        aria-label={MSG_D06.VIEW}
        title={MSG_D06.VIEW}
        onClick={() => handlers.onView(row.id)}
        sx={{ ...BUTTON_SX, color: 'text.secondary' }}
      >
        <Iconify icon='solar:eye-linear' />
      </IconButton>
      {row.action === 'review' ? (
        <>
          <IconButton
            aria-label={MSG_D06.APPROVE}
            title={MSG_D06.APPROVE}
            onClick={() => handlers.onRequestApprove(row.id)}
            sx={{ ...BUTTON_SX, color: 'success.main' }}
          >
            <Iconify icon='solar:check-circle-linear' />
          </IconButton>
          <IconButton
            aria-label={MSG_D06.REJECT}
            title={MSG_D06.REJECT}
            onClick={() => handlers.onRequestReject(row.id)}
            sx={{ ...BUTTON_SX, color: 'error.main' }}
          >
            <Iconify icon='solar:close-circle-linear' />
          </IconButton>
        </>
      ) : null}
      {row.action === 'register' ? (
        <IconButton
          aria-label={MSG_D06.REGISTER}
          title={MSG_D06.REGISTER}
          onClick={() => handlers.onRequestRegister(row.id)}
          sx={{ ...BUTTON_SX, color: 'text.secondary' }}
        >
          <Iconify icon='solar:user-plus-linear' />
        </IconButton>
      ) : null}
    </span>
  );
}
