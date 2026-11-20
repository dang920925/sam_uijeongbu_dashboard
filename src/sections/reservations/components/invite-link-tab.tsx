'use client';

// ----------------------------------------------------------------------
// 초대 링크 탭(designer tab-invite) — 설명 + 링크 형식 상자 + 단원 목록(이름 · 유형 Label · 코드 · 링크 · 동작).
// 발급 전 = "발급"(contained) / 발급됨 = "링크 복사"(outlined) + "재발급"(text). 홈페이지 주소가 없으면 복사 비활성 + 이유.
// lg 표 / lg 미만 카드.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { TableSkeleton } from '@/src/components/table-skeleton';
import { Typo } from '@/src/components/typo';
import type {
  InviteLinkRow,
  InviteLinks,
} from '@/src/sections/reservations/view/use-invite-links';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D12 } from '@/src/shared/messages/d12';

interface InviteLinkTabProps {
  invite: InviteLinks;
}

const BUTTON_SX = { minHeight: { xs: 44, lg: 32 }, whiteSpace: 'nowrap' };

function RowActions({
  row,
  invite,
}: {
  row: InviteLinkRow;
  invite: InviteLinks;
}) {
  const isIssuing = invite.issuingId === row.memberId;
  if (!row.code)
    return (
      <Button
        variant='contained'
        size='small'
        disabled={isIssuing}
        startIcon={<Iconify icon='solar:link-linear' />}
        onClick={() => invite.onIssue(row.memberId)}
        aria-label={`${row.name} ${MSG_D12.INV_ISSUE}`}
        sx={BUTTON_SX}
      >
        {MSG_D12.INV_ISSUE}
      </Button>
    );
  return (
    <span className='inline-flex flex-wrap items-center gap-2'>
      <Button
        variant='outlined'
        color='inherit'
        size='small'
        disabled={!row.link}
        startIcon={<Iconify icon='solar:copy-linear' />}
        onClick={() => invite.onCopy(row.memberId)}
        aria-label={`${row.name} ${MSG_D12.INV_COPY}`}
        sx={BUTTON_SX}
      >
        {MSG_D12.INV_COPY}
      </Button>
      <Button
        variant='text'
        color='inherit'
        size='small'
        disabled={isIssuing}
        startIcon={<Iconify icon='solar:refresh-linear' />}
        onClick={() => invite.onRequestReissue(row.memberId)}
        aria-label={`${row.name} ${MSG_D12.INV_REISSUE}`}
        sx={BUTTON_SX}
      >
        {MSG_D12.INV_REISSUE}
      </Button>
    </span>
  );
}

function LinkText({ row }: { row: InviteLinkRow }) {
  return (
    <Typo.Caption.Regular
      color='text.secondary'
      sx={{ overflowWrap: 'anywhere' }}
    >
      {row.link ?? (row.code ? MSG_COMMON.EMPTY_VALUE : MSG_D12.INV_NONE)}
    </Typo.Caption.Regular>
  );
}

export function InviteLinkTab({ invite }: InviteLinkTabProps) {
  let body;
  if (invite.isLoading) body = <TableSkeleton cardBelow='lg' rows={3} />;
  else if (invite.isError)
    body = (
      <ErrorRetry message={invite.errorMessage} onRetry={invite.onRetry} />
    );
  else if (invite.rows.length === 0)
    body = (
      <EmptyContent message={MSG_D12.INV_EMPTY} icon='solar:link-linear' />
    );
  else
    body = (
      <>
        <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
          <Table aria-label={MSG_D12.INV_TITLE}>
            <TableHead>
              <TableRow>
                <TableCell>{MSG_D12.INV_COL_NAME}</TableCell>
                <TableCell>{MSG_D12.INV_COL_TYPE}</TableCell>
                <TableCell>{MSG_D12.INV_COL_CODE}</TableCell>
                <TableCell>{MSG_D12.INV_COL_LINK}</TableCell>
                <TableCell sx={{ width: '1%' }}>
                  <span className='sr-only'>{MSG_D12.COL_ACTIONS}</span>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invite.rows.map((row) => (
                <TableRow
                  key={row.memberId}
                  sx={{ '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell>
                    <Typo.Body.Semibold>{row.name}</Typo.Body.Semibold>
                  </TableCell>
                  <TableCell>
                    <Label tone={row.typeTone}>{row.typeLabel}</Label>
                  </TableCell>
                  <TableCell>
                    <Typo.Badge.Bold>
                      {row.code ?? MSG_COMMON.EMPTY_VALUE}
                    </Typo.Badge.Bold>
                  </TableCell>
                  <TableCell>
                    <LinkText row={row} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <RowActions row={row} invite={invite} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Box
          component='ul'
          aria-label={MSG_D12.INV_TITLE}
          sx={{
            display: { xs: 'flex', lg: 'none' },
            flexDirection: 'column',
            m: 0,
            p: 0,
            listStyle: 'none',
          }}
        >
          {invite.rows.map((row) => (
            <Box
              component='li'
              key={row.memberId}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: { xs: 4, md: 6 },
                borderBottom: 1,
                borderColor: 'divider',
                '&:last-of-type': { borderBottom: 0 },
              }}
            >
              <span className='flex flex-wrap items-center gap-2'>
                <Typo.Body.Semibold>{row.name}</Typo.Body.Semibold>
                <Label tone={row.typeTone}>{row.typeLabel}</Label>
                {row.code ? (
                  <Typo.Badge.Bold>{row.code}</Typo.Badge.Bold>
                ) : null}
              </span>
              <LinkText row={row} />
              <RowActions row={row} invite={invite} />
            </Box>
          ))}
        </Box>
      </>
    );

  return (
    <Card component='section' aria-label={MSG_D12.INV_TITLE}>
      <div className='flex flex-col gap-3 px-4 pt-4 pb-3 md:px-6 md:pt-6'>
        <div className='flex flex-col gap-1'>
          <Typo.Title.Bold component='h2'>{MSG_D12.INV_TITLE}</Typo.Title.Bold>
          <Typo.Caption.Regular color='text.secondary'>
            {MSG_D12.INV_CAP}
          </Typo.Caption.Regular>
        </div>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            px: 4,
            py: 3,
            borderRadius: 2,
            bgcolor: 'semantic.surface.hover',
          }}
        >
          <Typo.Caption.Semibold>
            {MSG_D12.INV_FORMAT_LABEL}
          </Typo.Caption.Semibold>
          <Typo.Caption.Regular
            color='text.secondary'
            sx={{ overflowWrap: 'anywhere' }}
          >
            {MSG_D12.INV_FORMAT}
          </Typo.Caption.Regular>
        </Box>
        {invite.canCopy ? null : (
          <Typo.Caption.Regular color='semantic.alert.errorFg' role='note'>
            {MSG_D12.INV_NO_URL}
          </Typo.Caption.Regular>
        )}
      </div>
      {body}
    </Card>
  );
}
