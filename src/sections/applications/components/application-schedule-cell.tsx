// ----------------------------------------------------------------------
// 희망 일정 칸 — 참관 날짜 / 상담 "방법 · 시간". U29: 참관을 막은 취소 일정이면
// "일정 취소됨"(warning + 달력 아이콘 — "대기"와 아이콘으로 구분) + 아래 "사유: {사유}"(designer §14.3 SCR-D06-U29).
// ----------------------------------------------------------------------
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import type { ApplicationRow } from '@/src/sections/applications/utils/application-row';
import { MSG_D06 } from '@/src/shared/messages/d06';

interface ApplicationScheduleCellProps {
  row: ApplicationRow;
  /** 카드·드로어 앞 글자(예 "희망 날짜") */
  prefix?: string;
  /** 목록 — 날짜와 "일정 취소됨"을 한 줄에(사유만 아래 줄) */
  isNoWrap?: boolean;
}

export function ApplicationScheduleCell({
  row,
  prefix,
  isNoWrap = false,
}: ApplicationScheduleCellProps) {
  return (
    <span className='flex min-w-0 flex-col gap-1'>
      <span
        className={
          isNoWrap
            ? 'flex min-w-0 items-center gap-2'
            : 'flex min-w-0 flex-wrap items-center gap-2'
        }
      >
        {prefix ? (
          <Typo.Caption.Regular color='text.secondary'>
            {prefix}
          </Typo.Caption.Regular>
        ) : null}
        <Typo.Badge.Regular
          noWrap
          title={row.scheduleText}
          sx={{ minWidth: 0 }}
        >
          {row.scheduleText}
        </Typo.Badge.Regular>
        {row.scheduleCancelReason ? (
          <Label tone='warning'>
            <span className='inline-flex items-center gap-1'>
              <Iconify icon='solar:calendar-mark-linear' />
              {MSG_D06.SCHEDULE_CANCELLED}
            </span>
          </Label>
        ) : null}
      </span>
      {row.scheduleCancelReason ? (
        <Typo.Caption.Regular color='text.secondary'>
          {row.scheduleCancelReason}
        </Typo.Caption.Regular>
      ) : null}
    </span>
  );
}
