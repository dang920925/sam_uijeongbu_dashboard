// ----------------------------------------------------------------------
// 로그인 실패 박스 — 옅은 빨강 배경 + 오류 글자(designer `alert--error`, 현행 Login.tsx:72 bg-red-50).
// role=alert 로 스크린리더에 바로 읽힌다(새로고침 없이 문구가 보여야 함 — B7).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Typo } from '@/src/components/typo';
import { RADIUS } from '@/src/theme/layout-tokens';

interface LoginErrorBoxProps {
  message: string;
}

export function LoginErrorBox({ message }: LoginErrorBoxProps) {
  return (
    <Box
      role='alert'
      sx={{
        px: 4,
        py: 3,
        borderRadius: `${RADIUS.sm}px`,
        border: 1,
        borderColor: 'semantic.alert.errorBorder',
        bgcolor: 'semantic.alert.errorBg',
      }}
    >
      <Typo.Badge.Regular color='semantic.alert.errorFg'>
        {message}
      </Typo.Badge.Regular>
    </Box>
  );
}
