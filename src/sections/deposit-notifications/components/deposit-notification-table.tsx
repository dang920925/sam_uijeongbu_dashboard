'use client';

// ----------------------------------------------------------------------
// '입금 알림' 목록 — 받은 시각 · 출처 앱 · 알림 원문 · 금액 · 판정(라벨 + 이유) · 연결된 예매(+ 일부 입금 받은 금액) · 처리.
// 처리(예매에 연결 · 무시)는 일부 입금 · 확인 필요 · 확인 안 된 입금만. lg 표 / lg 미만 카드.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';

import type { DepositRow } from '@/src/api/deposit-notification-mapper';
import { DataTable, type DataTableColumn } from '@/src/components/data-table';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { MSG_DEP } from '@/src/shared/messages/deposit-notifications';

interface DepositNotificationTableProps {
  rows: DepositRow[];
  busyId: string | null;
  onMatch: (row: DepositRow) => void;
  onIgnore: (row: DepositRow) => void;
}

const BUTTON_SX = { minHeight: { xs: 44, lg: 32 }, whiteSpace: 'nowrap' };

function StatusCell({ row }: { row: DepositRow }) {
  return (
    <span className='flex flex-col items-start gap-1'>
      <Label tone={row.statusTone}>{row.statusLabel}</Label>
      {row.reasonText ? (
        <Typo.Caption.Regular color='text.secondary'>
          {row.reasonText}
        </Typo.Caption.Regular>
      ) : null}
    </span>
  );
}

function ReservationCell({ row }: { row: DepositRow }) {
  if (!row.reservation)
    return (
      <Typo.Caption.Regular color='text.secondary'>
        {MSG_DEP.NO_RESERVATION}
      </Typo.Caption.Regular>
    );
  return (
    <span className='flex flex-col items-start gap-1'>
      <Typo.Body.Regular>{row.reservation.text}</Typo.Body.Regular>
      {row.reservation.partialText ? (
        <span className='inline-flex flex-wrap items-center gap-1'>
          <Label tone='warning'>{MSG_DEP.STATUS.PARTIAL}</Label>
          <Typo.Caption.Regular color='text.secondary'>
            {row.reservation.partialText}
          </Typo.Caption.Regular>
        </span>
      ) : null}
    </span>
  );
}

function MessageCell({ row }: { row: DepositRow }) {
  return (
    <span className='flex flex-col items-start gap-1'>
      <Typo.Body.Regular
        sx={{ whiteSpace: 'pre-line', wordBreak: 'break-all' }}
      >
        {row.messageText}
      </Typo.Body.Regular>
    </span>
  );
}

export function DepositNotificationTable({
  rows,
  busyId,
  onMatch,
  onIgnore,
}: DepositNotificationTableProps) {
  const actions = (row: DepositRow) =>
    row.canMatch || row.canIgnore ? (
      <span className='inline-flex flex-wrap items-center gap-2'>
        {row.canMatch ? (
          <Button
            variant='contained'
            size='small'
            onClick={() => onMatch(row)}
            aria-label={`${row.amountText} · ${row.receivedText} ${MSG_DEP.BTN_MATCH}`}
            sx={BUTTON_SX}
          >
            {MSG_DEP.BTN_MATCH}
          </Button>
        ) : null}
        <Button
          variant='text'
          color='inherit'
          size='small'
          disabled={busyId === row.id}
          onClick={() => onIgnore(row)}
          aria-label={`${row.amountText} · ${row.receivedText} ${MSG_DEP.BTN_IGNORE}`}
          sx={BUTTON_SX}
        >
          {MSG_DEP.BTN_IGNORE}
        </Button>
      </span>
    ) : null;
  const columns: DataTableColumn<DepositRow>[] = [
    {
      key: 'received',
      header: MSG_DEP.COL_RECEIVED,
      render: (r) => <Typo.Body.Regular>{r.receivedText}</Typo.Body.Regular>,
    },
    {
      key: 'app',
      header: MSG_DEP.COL_APP,
      render: (r) => (
        <Typo.Body.Regular>
          {r.appText ?? MSG_DEP.NO_RESERVATION}
        </Typo.Body.Regular>
      ),
    },
    {
      key: 'message',
      header: MSG_DEP.COL_MESSAGE,
      render: (r) => <MessageCell row={r} />,
    },
    {
      key: 'amount',
      header: MSG_DEP.COL_AMOUNT,
      align: 'right',
      render: (r) => <Typo.Body.Semibold>{r.amountText}</Typo.Body.Semibold>,
    },
    {
      key: 'result',
      header: MSG_DEP.COL_RESULT,
      render: (r) => <StatusCell row={r} />,
    },
    {
      key: 'reservation',
      header: MSG_DEP.COL_RESERVATION,
      render: (r) => <ReservationCell row={r} />,
    },
    {
      key: 'actions',
      header: <span className='sr-only'>{MSG_DEP.COL_ACTIONS}</span>,
      isCompact: true,
      render: actions,
    },
  ];
  return (
    <DataTable
      ariaLabel={MSG_DEP.LIST_ARIA}
      columns={columns}
      rows={rows}
      getRowKey={(r) => r.id}
      cardBelow='lg'
      renderCard={(r) => (
        <div className='flex flex-col gap-2'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <Typo.Caption.Regular color='text.secondary'>
              {r.appText ? `${r.receivedText} · ${r.appText}` : r.receivedText}
            </Typo.Caption.Regular>
            <StatusCell row={r} />
          </div>
          <Typo.Body.Semibold>{r.amountText}</Typo.Body.Semibold>
          <MessageCell row={r} />
          <ReservationCell row={r} />
          {actions(r)}
        </div>
      )}
    />
  );
}
