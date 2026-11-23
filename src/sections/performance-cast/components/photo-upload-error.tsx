// ----------------------------------------------------------------------
// (U48) 올리기 실패 줄 — 경고 아이콘 + 문구(role=alert) + "다시 시도"(같은 파일로) + 닫기. props 만으로 렌더.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { MSG_D14 } from '@/src/shared/messages/d14';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface PhotoUploadErrorProps {
  message: string;
  canRetry: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}

export function PhotoUploadError({
  message,
  canRetry,
  onRetry,
  onDismiss,
}: PhotoUploadErrorProps) {
  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-start gap-1'>
        <Iconify
          icon='solar:danger-circle-linear'
          sx={{ color: 'semantic.alert.errorFg', flexShrink: 0 }}
        />
        <Typo.Caption.Regular color='semantic.alert.errorFg' role='alert'>
          {message}
        </Typo.Caption.Regular>
      </div>
      <div className='flex items-center gap-1'>
        {canRetry ? (
          <Button
            size='small'
            variant='outlined'
            color='inherit'
            onClick={onRetry}
            startIcon={<Iconify icon='solar:refresh-linear' />}
          >
            {MSG_D14.PHOTO_RETRY}
          </Button>
        ) : null}
        <IconButton
          aria-label={MSG_D14.PHOTO_DISMISS}
          onClick={onDismiss}
          sx={{ width: LAYOUT.touch, height: LAYOUT.touch }}
        >
          <Iconify icon='solar:close-circle-linear' />
        </IconButton>
      </div>
    </div>
  );
}
