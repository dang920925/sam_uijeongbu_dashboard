'use client';

// ----------------------------------------------------------------------
// 팝업 표 — 이미지(4:3 64)·링크·노출 기간(행 주 항목 Body.Semibold)·활성·상태(+ 겹침 경고)·액션(design SCR-D10).
// 이미지·경고 줄 때문에 md 에서도 카드(cardBelow 'lg', designer §3.4 §0). 카드 = 썸네일 + 기간/링크/배지, 겹침 경고 줄.
// ----------------------------------------------------------------------
import { DataTable, type DataTableColumn } from '@/src/components/data-table';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { PopupOverlapBadge } from '@/src/sections/popups/components/popup-overlap-badge';
import { PopupRowActions } from '@/src/sections/popups/components/popup-row-actions';
import { PopupThumb } from '@/src/sections/popups/components/popup-thumb';
import type { PopupRowModel } from '@/src/sections/popups/utils/popup-row';
import { MSG_D10 } from '@/src/shared/messages/d10';

interface PopupTableProps {
  rows: PopupRowModel[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PopupTable({ rows, onEdit, onDelete }: PopupTableProps) {
  const columns: DataTableColumn<PopupRowModel>[] = [
    {
      key: 'image',
      header: MSG_D10.COL_IMAGE,
      render: (row) => <PopupThumb src={row.imageUrl} />,
    },
    {
      key: 'link',
      header: MSG_D10.COL_LINK,
      render: (row) => (
        <Typo.Badge.Regular
          color='text.secondary'
          noWrap
          title={row.link}
          sx={{ display: 'block', maxWidth: 200 }}
        >
          {row.link}
        </Typo.Badge.Regular>
      ),
    },
    {
      key: 'period',
      header: MSG_D10.COL_PERIOD,
      render: (row) => (
        <Typo.Body.Semibold sx={{ whiteSpace: 'nowrap' }}>
          {row.period}
        </Typo.Body.Semibold>
      ),
    },
    {
      key: 'active',
      header: MSG_D10.COL_ACTIVE,
      render: (row) => <Label tone={row.activeTone}>{row.activeLabel}</Label>,
    },
    {
      key: 'status',
      header: MSG_D10.COL_STATUS,
      render: (row) => (
        <div className='flex flex-col items-start gap-1'>
          <Label tone={row.statusTone}>{row.statusLabel}</Label>
          {row.overlapsActive ? <PopupOverlapBadge /> : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: MSG_D10.COL_ACTIONS,
      isCompact: true,
      render: (row) => (
        <PopupRowActions
          onEdit={() => onEdit(row.id)}
          onDelete={() => onDelete(row.id)}
        />
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel={MSG_D10.TITLE}
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      cardBelow='lg'
      renderCard={(row) => (
        <>
          <div className='flex items-start gap-3'>
            <PopupThumb src={row.imageUrl} />
            <div className='flex min-w-0 flex-1 flex-col gap-1'>
              <Typo.Body.Semibold>{row.period}</Typo.Body.Semibold>
              <Typo.Badge.Regular color='text.secondary' noWrap>
                {row.link}
              </Typo.Badge.Regular>
              <div className='flex flex-wrap gap-2'>
                <Label tone={row.activeTone}>{row.activeLabel}</Label>
                <Label tone={row.statusTone}>{row.statusLabel}</Label>
              </div>
            </div>
            <PopupRowActions
              onEdit={() => onEdit(row.id)}
              onDelete={() => onDelete(row.id)}
            />
          </div>
          {row.overlapsActive ? (
            <div>
              <PopupOverlapBadge />
            </div>
          ) : null}
        </>
      )}
    />
  );
}
