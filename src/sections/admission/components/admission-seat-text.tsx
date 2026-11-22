// ----------------------------------------------------------------------
// 입장 명단 좌석(U35 — design §14 SCR-D13 "이름 옆 좌석 번호 크게, 없으면 '좌석 미정'").
// 좌석 지정 공연이 아니면(seatText null) 그리지 않는다.
// ----------------------------------------------------------------------
import { Typo } from '@/src/components/typo';
import type { AdmissionRowModel } from '@/src/sections/admission/utils/admission-row';
import { MSG_SEAT } from '@/src/shared/messages/seat';

export function AdmissionSeatText({
  row,
}: {
  row: Pick<AdmissionRowModel, 'seatText' | 'isSeatUnassigned'>;
}) {
  if (!row.seatText) return null;
  return row.isSeatUnassigned ? (
    <Typo.Badge.Regular color='text.secondary' data-testid='admission-seat'>
      {row.seatText}
    </Typo.Badge.Regular>
  ) : (
    <Typo.Title.Bold
      component='span'
      color='primary.main'
      aria-label={`${MSG_SEAT.COLUMN} ${row.seatText}`}
      data-testid='admission-seat'
    >
      {row.seatText}
    </Typo.Title.Bold>
  );
}
