// ----------------------------------------------------------------------
// 인쇄 명단 표(구역 하나) — 예매번호 · 이름 · 연락처 끝 · 등급별 매수 · 상태 · 메모 · 입장 체크 칸.
// 흰 바탕·검은 글자·가는 테두리(A4 세로). 행이 페이지에서 잘리지 않게 break-inside: avoid.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Typo } from '@/src/components/typo';
import { PrintCheckBoxes } from '@/src/sections/admission-print/components/print-check-boxes';
import type { PrintRow } from '@/src/sections/admission-print/utils/build-print-roster';
import { MSG_PRINT } from '@/src/shared/messages/admission-print';

interface PrintRosterTableProps {
  title: string;
  statusText: string;
  rows: PrintRow[];
}

const cellSx = {
  border: 1,
  borderColor: 'common.black',
  px: 1,
  py: 1,
  textAlign: 'left',
  verticalAlign: 'top',
};

const COLUMNS = [
  MSG_PRINT.COL_CODE,
  MSG_PRINT.COL_NAME,
  MSG_PRINT.COL_PHONE,
  MSG_PRINT.COL_TIERS,
  MSG_PRINT.COL_STATUS,
  MSG_PRINT.COL_MEMO,
  MSG_PRINT.COL_CHECK,
];

export function PrintRosterTable({
  title,
  statusText,
  rows,
}: PrintRosterTableProps) {
  return (
    <section className='flex flex-col gap-2'>
      <Typo.Body.Bold component='h2' color='common.black'>
        {title}
      </Typo.Body.Bold>
      {rows.length === 0 ? (
        <Typo.Caption.Regular color='common.black'>
          {MSG_PRINT.EMPTY_SECTION}
        </Typo.Caption.Regular>
      ) : (
        <Box
          component='table'
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            color: 'common.black',
          }}
        >
          <thead>
            <tr>
              {COLUMNS.map((label) => (
                <Box component='th' key={label} sx={cellSx}>
                  <Typo.Caption.Bold color='inherit'>{label}</Typo.Caption.Bold>
                </Box>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Box
                component='tr'
                key={row.id}
                sx={{ breakInside: 'avoid' }}
                data-print-code={row.code}
              >
                <Box component='td' sx={cellSx}>
                  <Typo.Badge.Semibold color='inherit'>
                    {row.code}
                  </Typo.Badge.Semibold>
                </Box>
                <Box component='td' sx={cellSx}>
                  <Typo.Badge.Semibold color='inherit'>
                    {row.bookerName}
                  </Typo.Badge.Semibold>
                </Box>
                <Box component='td' sx={cellSx}>
                  <Typo.Badge.Regular color='inherit'>
                    {row.phoneLast4}
                  </Typo.Badge.Regular>
                </Box>
                <Box component='td' sx={cellSx}>
                  <Typo.Badge.Regular color='inherit'>
                    {row.tierText}
                  </Typo.Badge.Regular>
                </Box>
                <Box component='td' sx={cellSx}>
                  <Typo.Badge.Regular color='inherit'>
                    {statusText}
                  </Typo.Badge.Regular>
                </Box>
                <Box component='td' sx={{ ...cellSx, maxWidth: 160 }}>
                  <Typo.Caption.Regular color='inherit'>
                    {row.memo}
                  </Typo.Caption.Regular>
                </Box>
                <Box component='td' sx={cellSx}>
                  <PrintCheckBoxes
                    quantity={row.quantity}
                    admittedCount={row.admittedCount}
                  />
                </Box>
              </Box>
            ))}
          </tbody>
        </Box>
      )}
    </section>
  );
}
