// ----------------------------------------------------------------------
// "단원 등록됨" 배지(neutral + 아이콘, D6·designer §18.3). 등록 안 됐으면 그리지 않는다.
// (U39 사용자 결정 2026-11-20) 승인·거절을 진행 단계로 합쳐 처리 상태 배지(대기·승인·거절)는 없앴다.
// ----------------------------------------------------------------------
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import type { ApplicationRow } from '@/src/sections/applications/utils/application-row';
import { MSG_D06 } from '@/src/shared/messages/d06';

interface ApplicationMemberLabelProps {
  row: ApplicationRow;
  /** 목록 한 줄 — md 는 아이콘만(글자는 스크린리더에 남긴다) */
  isIconOnlyMd?: boolean;
}

export function ApplicationMemberLabel({
  row,
  isIconOnlyMd = false,
}: ApplicationMemberLabelProps) {
  if (!row.member) return null;
  return (
    <Label tone='neutral'>
      <span className='inline-flex items-center gap-1'>
        <Iconify icon='solar:user-check-rounded-linear' />
        <span className={isIconOnlyMd ? 'sr-only lg:not-sr-only' : undefined}>
          {MSG_D06.REGISTERED}
        </span>
      </span>
    </Label>
  );
}
