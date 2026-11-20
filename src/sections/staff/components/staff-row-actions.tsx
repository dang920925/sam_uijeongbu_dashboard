'use client';

// ----------------------------------------------------------------------
// 연출진 행 액션 — 수정(연필)·삭제(휴지통 빨강) 아이콘 버튼. aria-label·title = "연출진 수정"/"연출진 삭제"(designer §3.4 §0).
// ----------------------------------------------------------------------
import IconButton from '@mui/material/IconButton';

import { Iconify } from '@/src/components/iconify';
import { MSG_D09 } from '@/src/shared/messages/d09';

interface StaffRowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function StaffRowActions({ onEdit, onDelete }: StaffRowActionsProps) {
  return (
    <div className='flex items-center justify-end gap-1'>
      <IconButton
        aria-label={MSG_D09.EDIT_ARIA}
        title={MSG_D09.EDIT_ARIA}
        onClick={onEdit}
        sx={{ color: 'text.secondary' }}
      >
        <Iconify icon='solar:pen-linear' />
      </IconButton>
      <IconButton
        aria-label={MSG_D09.DELETE_ARIA}
        title={MSG_D09.DELETE_ARIA}
        onClick={onDelete}
        sx={{ color: 'error.main' }}
      >
        <Iconify icon='solar:trash-bin-trash-linear' />
      </IconButton>
    </div>
  );
}
