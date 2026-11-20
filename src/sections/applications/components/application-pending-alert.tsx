// ----------------------------------------------------------------------
// "미처리 {n}건 · 연락 전 {n}건" 경고 상자(현행 앰버 박스 → semantic.alert.warning* · U31 보강 designer §18.3).
// 미처리 = 대기 건수(현행), 연락 전 = 요약 uncontactedPendingCount(D02 설명 줄과 같은 값). 대기 0 이면 호출 쪽이 그리지 않는다.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Typo } from '@/src/components/typo';
import { MSG_D06 } from '@/src/shared/messages/d06';

interface ApplicationPendingAlertProps {
  count: number;
  uncontactedCount: number;
}

export function ApplicationPendingAlert({
  count,
  uncontactedCount,
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
        {MSG_D06.PENDING_UNCONTACTED(count, uncontactedCount)}
      </Typo.Badge.Medium>
    </Box>
  );
}
