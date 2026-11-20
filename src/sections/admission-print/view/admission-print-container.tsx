'use client';

// ----------------------------------------------------------------------
// 회차 입장 명단 인쇄 `/admission/[showId]/print` 분기 — 로딩 / 오류(다시 시도) / 명단.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { Typo } from '@/src/components/typo';
import { AdmissionPrintView } from '@/src/sections/admission-print/view/admission-print-view';
import { useAdmissionPrintViewModel } from '@/src/sections/admission-print/view/use-admission-print-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_PRINT } from '@/src/shared/messages/admission-print';

interface AdmissionPrintContainerProps {
  showId: string;
}

export function AdmissionPrintContainer({
  showId,
}: AdmissionPrintContainerProps) {
  const vm = useAdmissionPrintViewModel(showId);
  if (vm.status !== 'ready' || !vm.roster || !vm.heading) {
    return (
      <Box
        sx={{ p: 8, bgcolor: 'common.white', minHeight: '100vh' }}
        role='status'
      >
        <Typo.Body.Regular color='common.black'>
          {vm.status === 'error' ? MSG_PRINT.ERROR : MSG_PRINT.LOADING}
        </Typo.Body.Regular>
        {vm.status === 'error' ? (
          <Button
            sx={{ mt: 4 }}
            variant='outlined'
            color='inherit'
            onClick={vm.onRetry}
          >
            {MSG_COMMON.RETRY}
          </Button>
        ) : null}
      </Box>
    );
  }
  return (
    <AdmissionPrintView
      roster={vm.roster}
      heading={vm.heading}
      sort={vm.sort}
      onSortChange={vm.onSortChange}
      onPrint={vm.onPrint}
    />
  );
}
