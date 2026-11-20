// ----------------------------------------------------------------------
// lg 표(designer default lg): 예매자(이름 → 등급 줄 title → 예매번호·연락처 끝) · 입장 a/q · 상태 · 처리(머리 sr-only).
// 다 들어온 행은 성공 옅은 배경 + 상태 칸 "입장 완료" + [−1]만.
// ----------------------------------------------------------------------
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { Typo } from '@/src/components/typo';
import {
  AdmissionRowActions,
  type AdmissionRowHandlers,
} from '@/src/sections/admission/components/admission-row-actions';
import { AdmissionRowStatus } from '@/src/sections/admission/components/admission-row-status';
import { AdmissionTierLines } from '@/src/sections/admission/components/admission-tier-lines';
import type { AdmissionRowModel } from '@/src/sections/admission/utils/admission-row';
import { MSG_D13 } from '@/src/shared/messages/d13';

interface AdmissionTableProps {
  rows: AdmissionRowModel[];
  handlers: AdmissionRowHandlers;
}

export function AdmissionTable({ rows, handlers }: AdmissionTableProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell scope='col' sx={{ width: '36%' }}>
            {MSG_D13.COL_BOOKER}
          </TableCell>
          <TableCell scope='col'>{MSG_D13.COL_ADMISSION}</TableCell>
          <TableCell scope='col'>{MSG_D13.COL_STATUS}</TableCell>
          <TableCell scope='col'>
            <span className='sr-only'>{MSG_D13.COL_ACTIONS}</span>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => {
          const isDone = row.kind === 'done';
          const metaColor = isDone ? 'semantic.text.onMuted' : 'text.secondary';
          return (
            <TableRow
              key={row.id}
              data-row-kind={row.kind}
              sx={{
                bgcolor: isDone ? 'semantic.successSoft.bg' : undefined,
                outline: row.isFlash ? 2 : 0,
                outlineColor: 'success.main',
                outlineOffset: -2,
              }}
            >
              <TableCell>
                <div className='flex flex-col gap-1'>
                  <Typo.Body.Semibold>{row.bookerName}</Typo.Body.Semibold>
                  <AdmissionTierLines
                    lines={row.lines}
                    ariaText={row.tiersAria}
                  />
                  <Typo.Badge.Regular color={metaColor}>
                    {row.codeText}
                  </Typo.Badge.Regular>
                  {row.phoneText ? (
                    <Typo.Badge.Regular color={metaColor}>
                      {row.phoneText}
                    </Typo.Badge.Regular>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <Typo.Title.Bold className='tabular-nums'>
                  {row.countText}
                </Typo.Title.Bold>
              </TableCell>
              <TableCell>
                <AdmissionRowStatus row={row} showDone />
              </TableCell>
              <TableCell align='right'>
                <div className='flex justify-end'>
                  <AdmissionRowActions row={row} handlers={handlers} compact />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
