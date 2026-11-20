// ----------------------------------------------------------------------
// 집계(ReservationSummaryBoard) → KPI 4 · 회차 pill · 수동 등록 회차 선택지 · 집계 탭 표 3개(순수).
// - 남은 좌석 KPI = shows[].remainingSeats 합(하나라도 null 이면 '-', designer 근거 표).
// - 등급별 집계: 열 = 공연 합계 등급(tiers) ∪ 회차 등급(byTier) — 직접 입력 줄(tierId null)은 맨 끝 한 열.
// - 단원별 초대: 단원 → "직접 입력"(memberId null + name 있음) → "초대 없음"(둘 다 null) 순, 뒤 둘은 흐리게.
// ----------------------------------------------------------------------
import { formatShowSlot, formatWon } from '@/src/api/reservation-mapper';
import type { DashboardKpiTone } from '@/src/sections/dashboard/utils/build-dashboard-view';
import { MSG_BOOKING } from '@/src/shared/messages/booking';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D12 } from '@/src/shared/messages/d12';
import type {
  ReservationSummaryBoardResponse,
  ReservationSummaryTierQty,
} from '@/src/types/booking';

const dash = MSG_COMMON.EMPTY_VALUE;
const qty = (n: number) => `${n}${MSG_BOOKING.TICKET_UNIT}`;
const seats = (n: number | null) =>
  n === null ? dash : `${n}${MSG_BOOKING.SEAT_UNIT}`;
const sumOrNull = (values: (number | null)[]) =>
  values.length === 0 || values.some((v) => v === null)
    ? null
    : values.reduce<number>((sum, v) => sum + (v ?? 0), 0);

export interface ReservationKpi {
  key: string;
  title: string;
  value: string;
  description: string;
  icon: string;
  tone: DashboardKpiTone;
}

export function toReservationKpis(
  summary: ReservationSummaryBoardResponse
): ReservationKpi[] {
  const { totals, shows } = summary;
  const remaining = sumOrNull(shows.map((s) => s.remainingSeats));
  return [
    {
      key: 'pending',
      title: MSG_D12.KPI_PENDING,
      value: `${totals.pendingCount}${MSG_D12.COUNT_UNIT}`,
      description: MSG_D12.KPI_PENDING_CAP(
        totals.pendingQty,
        totals.overdueCount
      ),
      icon: 'solar:hourglass-linear',
      tone: 'amber',
    },
    {
      key: 'confirmed',
      title: MSG_D12.KPI_CONFIRMED,
      value: qty(totals.confirmedQty),
      description: MSG_D12.KPI_CONFIRMED_CAP,
      icon: 'solar:check-circle-linear',
      tone: 'emerald',
    },
    {
      key: 'remaining',
      title: MSG_D12.KPI_REMAINING,
      value: seats(remaining),
      description: MSG_D12.KPI_REMAINING_CAP(shows.length),
      icon: 'solar:armchair-linear',
      tone: 'blue',
    },
    {
      key: 'amount',
      title: MSG_D12.KPI_AMOUNT,
      value: formatWon(totals.confirmedAmount),
      description: MSG_D12.KPI_AMOUNT_CAP,
      icon: 'solar:wallet-money-linear',
      tone: 'purple',
    },
  ];
}

export interface ShowOption {
  id: string;
  /** pill "12.12 14:00" */
  label: string;
  /** Dialog "12.12 (토) 14:00" */
  longLabel: string;
  remainingSeats: number | null;
}

export function toShowOptions(
  summary: ReservationSummaryBoardResponse | undefined
): ShowOption[] {
  return (summary?.shows ?? []).map((s) => ({
    id: s.showId,
    label: formatShowSlot(s.showDate, s.startTime),
    longLabel: formatShowSlot(s.showDate, s.startTime, true),
    remainingSeats: s.remainingSeats,
  }));
}

export interface SummaryTableRow {
  key: string;
  cells: string[];
  /** 합계 줄(굵게·옅은 배경) */
  isTotal?: boolean;
  /** "직접 입력"·"초대 없음" 줄(흐리게) */
  isMuted?: boolean;
}

export interface SummaryTable {
  columns: string[];
  rows: SummaryTableRow[];
}

export function toShowSummaryTable(
  summary: ReservationSummaryBoardResponse
): SummaryTable {
  const { shows } = summary;
  const sum = (pick: (s: (typeof shows)[number]) => number) =>
    shows.reduce((total, s) => total + pick(s), 0);
  return {
    columns: [
      MSG_D12.FILTER_SHOW,
      MSG_D12.SUM_COL_SEATS,
      MSG_D12.SUM_COL_PENDING,
      MSG_D12.SUM_COL_CONFIRMED,
      MSG_D12.SUM_COL_REMAINING,
      MSG_D12.SUM_COL_ADMITTED,
      MSG_D12.SUM_COL_AMOUNT,
    ],
    rows: [
      ...shows.map((s) => ({
        key: s.showId,
        cells: [
          formatShowSlot(s.showDate, s.startTime, true),
          seats(s.totalSeats),
          qty(s.pendingQty),
          qty(s.confirmedQty),
          seats(s.remainingSeats),
          `${s.admittedCount}${MSG_D12.PERSON_UNIT}`,
          formatWon(s.confirmedAmount),
        ],
      })),
      {
        key: 'total',
        isTotal: true,
        cells: [
          MSG_D12.SUM_TOTAL,
          seats(sumOrNull(shows.map((s) => s.totalSeats))),
          qty(sum((s) => s.pendingQty)),
          qty(sum((s) => s.confirmedQty)),
          seats(sumOrNull(shows.map((s) => s.remainingSeats))),
          `${sum((s) => s.admittedCount)}${MSG_D12.PERSON_UNIT}`,
          formatWon(sum((s) => s.confirmedAmount)),
        ],
      },
    ],
  };
}

const CUSTOM_KEY = '__custom';
const tierKey = (t: { tierId: string | null }) => t.tierId ?? CUSTOM_KEY;

export function toTierSummaryTable(
  summary: ReservationSummaryBoardResponse
): SummaryTable {
  const columns = new Map<string, string>();
  const add = (t: ReservationSummaryTierQty) => {
    if (t.tierId && !columns.has(t.tierId)) columns.set(t.tierId, t.tierName);
  };
  summary.tiers.forEach(add);
  summary.shows.forEach((s) => s.byTier.forEach(add));
  const hasCustom =
    summary.tiers.some((t) => t.tierId === null) ||
    summary.shows.some((s) => s.byTier.some((t) => t.tierId === null));
  if (hasCustom) columns.set(CUSTOM_KEY, MSG_D12.SUM_TIER_CUSTOM);
  const keys = [...columns.keys()];
  const cellsOf = (list: ReservationSummaryTierQty[]) =>
    keys.map((key) => {
      const hit = list.find((t) => tierKey(t) === key);
      return hit
        ? MSG_D12.SUM_TIER_CELL(hit.confirmedQty, hit.pendingQty)
        : dash;
    });
  return {
    columns: [MSG_D12.FILTER_SHOW, ...columns.values()],
    rows: [
      ...summary.shows.map((s) => ({
        key: s.showId,
        cells: [
          formatShowSlot(s.showDate, s.startTime, true),
          ...cellsOf(s.byTier),
        ],
      })),
      {
        key: 'total',
        isTotal: true,
        cells: [MSG_D12.SUM_TIER_TOTAL, ...cellsOf(summary.tiers)],
      },
      {
        key: 'amount',
        isTotal: true,
        cells: [
          MSG_D12.SUM_COL_AMOUNT,
          ...keys.map((key) => {
            const hit = summary.tiers.find((t) => tierKey(t) === key);
            return hit ? formatWon(hit.confirmedAmount) : dash;
          }),
        ],
      },
    ],
  };
}

export function toInviterSummaryTable(
  summary: ReservationSummaryBoardResponse
): SummaryTable {
  const rank = (memberId: string | null, name: string | null) =>
    memberId ? 0 : name ? 1 : 2;
  const sorted = [...summary.inviters].sort(
    (a, b) => rank(a.memberId, a.name) - rank(b.memberId, b.name)
  );
  return {
    columns: [
      MSG_D12.SUM_INV_COL,
      MSG_D12.SUM_COL_PENDING,
      MSG_D12.SUM_COL_CONFIRMED,
    ],
    rows: sorted.map((row, index) => {
      const r = rank(row.memberId, row.name);
      const name =
        r === 0
          ? (row.name ?? dash)
          : r === 1
            ? MSG_D12.SUM_INV_NOTE
            : MSG_D12.SUM_INV_NONE;
      return {
        key: row.memberId ?? `group-${r}-${index}`,
        cells: [name, qty(row.pendingQty), qty(row.confirmedQty)],
        isMuted: r > 0,
      };
    }),
  };
}
