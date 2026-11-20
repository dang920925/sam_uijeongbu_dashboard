'use client';

// ----------------------------------------------------------------------
// 단원 표(md↑: 사진 32·이름·구분·연락처·가입일·공개 동의일(U39)) / xs 카드(사진·이름·구분 / 연락처·"가입일 …"·"공개 동의일 …" / ›).
// 행 클릭 → 상세 패널. 선택 행은 muted 배경(DataTable selectedKey).
// ----------------------------------------------------------------------
import { DataTable, type DataTableColumn } from '@/src/components/data-table';
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { MembersAvatar } from '@/src/sections/members/components/members-avatar';
import type { MemberRowDisplay } from '@/src/sections/members/utils/member-display';
import { MSG_D05 } from '@/src/shared/messages/d05';

interface MembersTableProps {
  rows: MemberRowDisplay[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const secondary = (text: string) => (
  <Typo.Badge.Regular color='text.secondary'>{text}</Typo.Badge.Regular>
);

const COLUMNS: DataTableColumn<MemberRowDisplay>[] = [
  {
    key: 'avatar',
    header: '',
    isCompact: true,
    render: (row) => <MembersAvatar src={row.profileImageUrl} alt='' />,
  },
  {
    key: 'name',
    header: MSG_D05.COL_NAME,
    render: (row) => <Typo.Body.Semibold>{row.name}</Typo.Body.Semibold>,
  },
  {
    key: 'type',
    header: MSG_D05.COL_TYPE,
    render: (row) => <Label tone={row.typeTone}>{row.typeLabel}</Label>,
  },
  {
    key: 'phone',
    header: MSG_D05.COL_PHONE,
    render: (row) => secondary(row.phoneText),
  },
  {
    key: 'joined',
    header: MSG_D05.COL_JOINED,
    render: (row) => secondary(row.joinedText),
  },
  {
    key: 'consent',
    header: MSG_D05.COL_CONSENT,
    render: (row) => secondary(row.consentText),
  },
];

export function MembersTable({
  rows,
  selectedId,
  onSelect,
}: MembersTableProps) {
  return (
    <DataTable
      ariaLabel={MSG_D05.TABLE_ARIA}
      columns={COLUMNS}
      rows={rows}
      getRowKey={(row) => row.id}
      selectedKey={selectedId}
      onRowClick={(row) => onSelect(row.id)}
      renderCard={(row) => (
        <div className='flex items-center gap-3'>
          <div className='flex min-w-0 flex-1 flex-col gap-2'>
            <div className='flex items-center gap-3'>
              <MembersAvatar src={row.profileImageUrl} alt='' />
              <Typo.Body.Semibold noWrap>{row.name}</Typo.Body.Semibold>
              <Label tone={row.typeTone}>{row.typeLabel}</Label>
            </div>
            <div className='flex flex-wrap gap-x-3 gap-y-1'>
              {secondary(row.phoneText)}
              {secondary(`${MSG_D05.COL_JOINED} ${row.joinedText}`)}
              {secondary(`${MSG_D05.COL_CONSENT} ${row.consentText}`)}
            </div>
          </div>
          <Iconify
            icon='solar:alt-arrow-right-linear'
            sx={{ color: 'text.secondary' }}
          />
        </div>
      )}
    />
  );
}
