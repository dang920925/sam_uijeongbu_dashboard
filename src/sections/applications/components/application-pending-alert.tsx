// ----------------------------------------------------------------------
// "미처리 {n}건" 경고 상자(현행 Applications.tsx:125-128 앰버 박스 → semantic.alert.warning*, amber-700 글자).
// 대기 건수가 0 이면 호출 쪽이 그리지 않는다.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Typo } from '@/src/components/typo';
import { MSG_D06 } from '@/src/shared/messages/d06';

interface ApplicationPendingAlertProps {
  count: number;
}

export function ApplicationPendingAlert({
  count,
}: ApplicationPendingAlertProps) {
  return (
    <Box
      role='status'
      sx={{
        px: 4,
        py: 3,
        borderRadius: 2,
        border: 1,
        borderColor: 'semantic.alert.warningBorder',
        bgcolor: 'semantic.alert.warningBg',
        color: 'semantic.alert.warningFg',
      }}
    >
      <Typo.Badge.Medium color='inherit'>
        {MSG_D06.PENDING(count)}
      </Typo.Badge.Medium>
    </Box>
  );
}
