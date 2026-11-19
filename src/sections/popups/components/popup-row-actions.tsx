'use client';

// ----------------------------------------------------------------------
// 팝업 행 액션 — 수정(연필)·삭제(휴지통 빨강). aria-label·title = "팝업 수정"/"팝업 삭제"(designer §3.4 §0 규칙).
// ----------------------------------------------------------------------
import IconButton from '@mui/material/IconButton';

import { Iconify } from '@/src/components/iconify';
import { MSG_D10 } from '@/src/shared/messages/d10';

interface PopupRowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function PopupRowActions({ onEdit, onDelete }: PopupRowActionsProps) {
  return (
    <div className='flex items-center justify-end gap-1'>
      <IconButton
        aria-label={MSG_D10.EDIT_ARIA}
        title={MSG_D10.EDIT_ARIA}
        onClick={onEdit}
        sx={{ color: 'text.secondary' }}
      >
        <Iconify icon='solar:pen-linear' />
      </IconButton>
      <IconButton
        aria-label={MSG_D10.DELETE_ARIA}
        title={MSG_D10.DELETE_ARIA}
        onClick={onDelete}
        sx={{ color: 'error.main' }}
      >
        <Iconify icon='solar:trash-bin-trash-linear' />
      </IconButton>
    </div>
  );
}
