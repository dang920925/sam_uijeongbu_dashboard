'use client';

// ----------------------------------------------------------------------
// 회차 입장 명단 인쇄 화면(오프라인 대비 PDF) — A4 세로·흰 바탕·검은 글자. 화면 위 도구 줄(정렬·다시 인쇄·안내)은
// 인쇄에서 숨긴다(print:hidden). 머리말: 공연명·회차 일시·출력 시각·확정 매수·입금 대기 건수 / 바닥글: 개인정보 파기 안내.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { PrintRosterTable } from '@/src/sections/admission-print/components/print-roster-table';
import type { PrintRoster } from '@/src/sections/admission-print/utils/build-print-roster';
import type { AdmissionPrintViewModel } from '@/src/sections/admission-print/view/use-admission-print-view-model';
import { MSG_PRINT } from '@/src/shared/messages/admission-print';

interface AdmissionPrintViewProps {
  roster: PrintRoster;
  heading: NonNullable<AdmissionPrintViewModel['heading']>;
  sort: AdmissionPrintViewModel['sort'];
  onSortChange: AdmissionPrintViewModel['onSortChange'];
  onPrint: () => void;
}

export function AdmissionPrintView({
  roster,
  heading,
  sort,
  onSortChange,
  onPrint,
}: AdmissionPrintViewProps) {
  return (
    <Box
      sx={{
        bgcolor: 'common.white',
        color: 'common.black',
        minHeight: '100vh',
        maxWidth: 794,
        mx: 'auto',
        p: { xs: 4, md: 8 },
        '@media print': { p: 0, maxWidth: 'none' },
      }}
    >
      <div className='mb-6 flex flex-wrap items-center gap-3 print:hidden'>
        <Typo.Caption.Regular color='common.black'>
          {MSG_PRINT.SORT_LABEL}
        </Typo.Caption.Regular>
        <ToggleButtonGroup
          exclusive
          size='small'
          value={sort}
          onChange={(_, next) => next && onSortChange(next)}
          aria-label={MSG_PRINT.SORT_LABEL}
        >
          <ToggleButton value='name'>{MSG_PRINT.SORT_NAME}</ToggleButton>
          <ToggleButton value='code'>{MSG_PRINT.SORT_CODE}</ToggleButton>
        </ToggleButtonGroup>
        <Button
          variant='contained'
          startIcon={<Iconify icon='solar:printer-linear' />}
          onClick={onPrint}
        >
          {MSG_PRINT.PRINT_AGAIN}
        </Button>
        <Typo.Caption.Regular color='common.black'>
          {MSG_PRINT.HINT}
        </Typo.Caption.Regular>
      </div>
      <header className='mb-4 flex flex-col gap-1'>
        <Typo.Title.Bold component='h1' color='common.black'>
          {`${heading.title} · ${MSG_PRINT.TITLE}`}
        </Typo.Title.Bold>
        <Typo.Badge.Regular color='common.black'>
          {[heading.when, heading.venue].filter(Boolean).join(' · ')}
        </Typo.Badge.Regular>
        <Typo.Badge.Regular color='common.black'>
          {[
            MSG_PRINT.CONFIRMED_QTY(roster.confirmedQty),
            MSG_PRINT.PENDING_COUNT(roster.pendingCount),
            heading.printedAt,
          ].join(' · ')}
        </Typo.Badge.Regular>
      </header>
      <div className='flex flex-col gap-6'>
        <PrintRosterTable
          title={MSG_PRINT.SECTION_CONFIRMED(roster.confirmed.length)}
          statusText={MSG_PRINT.STATUS_CONFIRMED}
          rows={roster.confirmed}
          hasSeatColumn={roster.hasSeatColumn}
        />
        <PrintRosterTable
          title={MSG_PRINT.SECTION_PENDING(roster.pending.length)}
          statusText={MSG_PRINT.STATUS_PENDING}
          rows={roster.pending}
          hasSeatColumn={roster.hasSeatColumn}
        />
      </div>
      <Box
        component='footer'
        sx={{ mt: 6, pt: 2, borderTop: 1, borderColor: 'common.black' }}
      >
        <Typo.Caption.Regular color='common.black'>
          {MSG_PRINT.FOOTER}
        </Typo.Caption.Regular>
      </Box>
    </Box>
  );
}
