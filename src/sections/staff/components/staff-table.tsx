'use client';

// ----------------------------------------------------------------------
// 연출진 표 — 사진 48 원형·이름(Body.Semibold)·역할·소개(1줄 말줄임)·노출 순서·노출·액션(design SCR-D09).
// md 도 표 유지(cardBelow 'md'), xs 카드 = 사진 + 이름/역할 + 액션 / "노출 순서 [n]" + 노출 배지(designer 프레임 xs).
// ----------------------------------------------------------------------
import { DataTable, type DataTableColumn } from '@/src/components/data-table';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { StaffAvatar } from '@/src/sections/staff/components/staff-avatar';
import { StaffRowActions } from '@/src/sections/staff/components/staff-row-actions';
import type { StaffRowModel } from '@/src/sections/staff/utils/staff-row';
import { MSG_D09 } from '@/src/shared/messages/d09';

interface StaffTableProps {
  rows: StaffRowModel[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function StaffTable({ rows, onEdit, onDelete }: StaffTableProps) {
  const columns: DataTableColumn<StaffRowModel>[] = [
    {
      key: 'photo',
      header: MSG_D09.COL_PHOTO,
      render: (row) => <StaffAvatar src={row.photoUrl} alt={row.name} />,
    },
    {
      key: 'name',
      header: MSG_D09.COL_NAME,
      render: (row) => <Typo.Body.Semibold>{row.name}</Typo.Body.Semibold>,
    },
    {
      key: 'role',
      header: MSG_D09.COL_ROLE,
      render: (row) => (
        <Typo.Badge.Regular color='text.secondary'>
          {row.role}
        </Typo.Badge.Regular>
      ),
    },
    {
      key: 'bio',
      header: MSG_D09.COL_BIO,
      render: (row) => (
        <Typo.Badge.Regular
          color='text.secondary'
          noWrap
          title={row.bio}
          sx={{ display: 'block', maxWidth: 240 }}
        >
          {row.bio}
        </Typo.Badge.Regular>
      ),
    },
    {
      key: 'history',
      header: MSG_D09.COL_HISTORY,
      render: (row) => (
        <Typo.Badge.Regular color='text.secondary'>
          {row.historyLabel}
        </Typo.Badge.Regular>
      ),
    },
    {
      key: 'order',
      header: MSG_D09.COL_ORDER,
      render: (row) => (
        <Typo.Badge.Regular color='text.secondary'>
          {row.displayOrder}
        </Typo.Badge.Regular>
      ),
    },
    {
      key: 'visible',
      header: MSG_D09.COL_VISIBLE,
      render: (row) => <Label tone={row.visibleTone}>{row.visibleLabel}</Label>,
    },
    {
      key: 'actions',
      header: MSG_D09.COL_ACTIONS,
      isCompact: true,
      render: (row) => (
        <StaffRowActions
          onEdit={() => onEdit(row.id)}
          onDelete={() => onDelete(row.id)}
        />
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel={MSG_D09.TITLE}
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      renderCard={(row) => (
        <>
          <div className='flex items-center gap-3'>
            <StaffAvatar src={row.photoUrl} alt={row.name} />
            <div className='flex min-w-0 flex-1 flex-col'>
              <Typo.Body.Semibold noWrap>{row.name}</Typo.Body.Semibold>
              <Typo.Badge.Regular color='text.secondary' noWrap>
                {row.role}
              </Typo.Badge.Regular>
            </div>
            <StaffRowActions
              onEdit={() => onEdit(row.id)}
              onDelete={() => onDelete(row.id)}
            />
          </div>
          <div className='flex flex-wrap items-center gap-3'>
            <Typo.Badge.Regular color='text.secondary'>
              {`${MSG_D09.COL_ORDER} ${row.displayOrder}`}
            </Typo.Badge.Regular>
            <Label tone={row.visibleTone}>{row.visibleLabel}</Label>
          </div>
        </>
      )}
    />
  );
}
