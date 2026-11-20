'use client';

// ----------------------------------------------------------------------
// 회차 입장 명단 인쇄 ViewModel — 명단을 한 번 받고, 그려진 뒤 자동으로 window.print()(한 번만).
// 정렬은 `?sort=code` 면 예매번호순, 아니면 이름 가나다순. 화면의 정렬 바꾸기는 주소만 바꾼다(다시 인쇄 안 함).
// ----------------------------------------------------------------------
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAdmissionPrintBoard } from '@/src/api/admission-queries';
import { useAdminSeatMap } from '@/src/api/seat-map-queries';
import {
  buildPrintRoster,
  toRosterSort,
  type RosterSort,
} from '@/src/sections/admission-print/utils/build-print-roster';
import { MSG_PRINT } from '@/src/shared/messages/admission-print';
import {
  formatCalendarDate,
  formatKstDateTime,
} from '@/src/utils/kst-date-format';

export function useAdmissionPrintViewModel(showId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const sort = toRosterSort(useSearchParams().get('sort'));
  const query = useAdmissionPrintBoard(showId);
  // U35 — 좌석 지정 여부는 회차 좌석 지도(배치 없음·꺼짐 = 좌석 칸 없음). 받은 뒤에 그리고 인쇄한다
  const seatQuery = useAdminSeatMap(showId);
  const seatSelection = seatQuery.data?.seatSelectionEnabled ?? false;
  const board = seatQuery.isPending ? null : (query.data ?? null);
  const [printedAt] = useState(() => new Date().toISOString());
  const hasPrinted = useRef(false);

  const roster = useMemo(
    () => (board ? buildPrintRoster(board, sort, seatSelection) : null),
    [board, sort, seatSelection]
  );

  // 그려진 다음 프레임에 인쇄 창을 연다 — 브라우저의 "PDF로 저장"으로 파일을 받는다
  useEffect(() => {
    if (!roster || hasPrinted.current) return;
    hasPrinted.current = true;
    const frame = requestAnimationFrame(() => window.print());
    return () => cancelAnimationFrame(frame);
  }, [roster]);

  const status: 'loading' | 'error' | 'ready' = board
    ? 'ready'
    : query.isError
      ? 'error'
      : 'loading';

  return {
    status,
    roster,
    sort,
    heading: board
      ? {
          title: board.show.performanceTitle,
          when: `${formatCalendarDate(board.show.showDate)} ${board.show.startTime.slice(0, 5)}`,
          venue: board.show.venue,
          printedAt: MSG_PRINT.PRINTED_AT(formatKstDateTime(printedAt)),
        }
      : null,
    onSortChange: (next: RosterSort) =>
      router.replace(next === 'code' ? `${pathname}?sort=code` : pathname, {
        scroll: false,
      }),
    onPrint: () => window.print(),
    onRetry: () => void query.refetch(),
  };
}

export type AdmissionPrintViewModel = ReturnType<
  typeof useAdmissionPrintViewModel
>;
