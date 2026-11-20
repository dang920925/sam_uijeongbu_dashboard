// ----------------------------------------------------------------------
// 유형 Label — "참관"(가면) / "상담"(말풍선) 중립 톤(designer §18.3 유형 열·카드).
// ----------------------------------------------------------------------
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import type { ApplicationRow } from '@/src/sections/applications/utils/application-row';

interface ApplicationTypeLabelProps {
  row: ApplicationRow;
  hasIcon?: boolean;
}

export function ApplicationTypeLabel({
  row,
  hasIcon = false,
}: ApplicationTypeLabelProps) {
  return (
    <Label tone='neutral'>
      <span className='inline-flex items-center gap-1'>
        {hasIcon ? <Iconify icon={row.typeIcon} /> : null}
        {row.typeLabel}
      </span>
    </Label>
  );
}
