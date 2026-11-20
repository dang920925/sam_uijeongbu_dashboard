// ----------------------------------------------------------------------
// 준비 상태 알림(design §6 SCR-D11 콘텐츠 1) — 경고(amber, 빈 항목 나열) / info(파랑, 모두 채워짐).
// 색은 semantic.alert.* 토큰(designer 시안 alert--warning · alert--info).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';

interface ReadinessNoticeProps {
  tone: 'warning' | 'info';
  message: string;
}

export function ReadinessNotice({ tone, message }: ReadinessNoticeProps) {
  const isWarning = tone === 'warning';
  return (
    <Box
      role='status'
      data-tone={tone}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        px: 4,
        py: 3,
        borderRadius: 2,
        border: 1,
        borderColor: isWarning ? 'semantic.alert.warningBorder' : 'transparent',
        bgcolor: isWarning
          ? 'semantic.alert.warningBg'
          : 'semantic.alert.infoBg',
        color: isWarning ? 'semantic.alert.warningFg' : 'semantic.alert.infoFg',
      }}
    >
      <Iconify
        icon={
          isWarning
            ? 'solar:danger-triangle-linear'
            : 'solar:check-circle-linear'
        }
        sx={{ flexShrink: 0 }}
      />
      <Typo.Badge.Medium color='inherit'>{message}</Typo.Badge.Medium>
    </Box>
  );
}
