// ----------------------------------------------------------------------
// 계정 화면 알림 — 폼 위 오류(`alert--error`, 잠금이면 자물쇠) / 다른 기기 안내(`alert--info`).
// 오류는 role=alert 로 바로 읽힌다.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { RADIUS } from '@/src/theme/layout-tokens';

interface AccountAlertProps {
  tone: 'error' | 'info';
  message: string;
  locked?: boolean;
}

export function AccountAlert({
  tone,
  message,
  locked = false,
}: AccountAlertProps) {
  const isError = tone === 'error';
  const icon = !isError
    ? 'solar:info-circle-linear'
    : locked
      ? 'solar:lock-keyhole-linear'
      : 'solar:danger-circle-linear';
  return (
    <Box
      role={isError ? 'alert' : undefined}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        px: 4,
        py: 3,
        borderRadius: `${RADIUS.sm}px`,
        border: isError ? 1 : 0,
        borderColor: 'semantic.alert.errorBorder',
        bgcolor: isError ? 'semantic.alert.errorBg' : 'semantic.alert.infoBg',
        color: isError ? 'semantic.alert.errorFg' : 'semantic.alert.infoFg',
      }}
    >
      <Iconify icon={icon} size='sm' sx={{ mt: 1, flexShrink: 0 }} />
      <Typo.Badge.Regular color='inherit'>{message}</Typo.Badge.Regular>
    </Box>
  );
}
