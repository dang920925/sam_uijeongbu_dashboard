// ----------------------------------------------------------------------
// 인쇄 명단 표시 모델 — 취소 제외(서버 명단이 이미 뺌), 확정·입금 대기 구역 분리, 이름 가나다순 또는 예매번호순.
// 연락처는 끝 4자리만(개인정보 최소 — 명세). 입장 체크 칸 수 = 매수.
// U35: 좌석 지정 공연이면 좌석 칸("B3·B4", 없으면 "좌석 미정").
// ----------------------------------------------------------------------
import type { AdmissionBoard, AdmissionItem } from '@/src/api/admission-mapper';
import { formatTierBreakdown } from '@/src/api/reservation-mapper';
import { toSeatText } from '@/src/api/seat-map-mapper';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_SEAT } from '@/src/shared/messages/seat';

export type RosterSort = 'name' | 'code';

export interface PrintRow {
  id: string;
  code: string;
  bookerName: string;
  phoneLast4: string;
  tierText: string;
  /** U35 — 좌석 지정 공연이 아니면 null */
  seatText: string | null;
  quantity: number;
  /** 이미 입장한 인원(체크 칸 앞쪽을 채워 표시) */
  admittedCount: number;
  memo: string;
}

export interface PrintRoster {
  confirmed: PrintRow[];
  pending: PrintRow[];
  confirmedQty: number;
  pendingCount: number;
  /** U35 — 좌석 칸을 둘지 */
  hasSeatColumn: boolean;
}

export function toRosterSort(value: string | null | undefined): RosterSort {
  return value === 'code' ? 'code' : 'name';
}

function compare(sort: RosterSort) {
  return (a: AdmissionItem, b: AdmissionItem) =>
    sort === 'code'
      ? a.code.localeCompare(b.code)
      : a.bookerName.localeCompare(b.bookerName, 'ko') ||
        a.code.localeCompare(b.code);
}

function toRow(item: AdmissionItem, seatSelection: boolean): PrintRow {
  const dash = MSG_COMMON.EMPTY_VALUE;
  return {
    seatText: toSeatText(item.seats, seatSelection, MSG_SEAT.UNASSIGNED),
    id: item.id,
    code: item.code,
    bookerName: item.bookerName,
    phoneLast4: item.phoneLast4 ?? dash,
    tierText: formatTierBreakdown(item.lines) || `${item.quantity}`,
    quantity: item.quantity,
    admittedCount: Math.min(item.admittedCount, item.quantity),
    memo: item.memo ?? '',
  };
}

export function buildPrintRoster(
  board: Pick<AdmissionBoard, 'items' | 'summary'>,
  sort: RosterSort,
  seatSelection = false
): PrintRoster {
  const sorted = [...board.items].sort(compare(sort));
  const row = (item: AdmissionItem) => toRow(item, seatSelection);
  return {
    hasSeatColumn: seatSelection,
    confirmed: sorted.filter((i) => i.status === 'CONFIRMED').map(row),
    pending: sorted.filter((i) => i.status === 'PENDING').map(row),
    confirmedQty: board.summary.confirmedQty,
    pendingCount: board.summary.pendingCount,
  };
}
