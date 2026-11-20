// ----------------------------------------------------------------------
// 회차 표·카드 표시 모델(designer 시안 SCR-D11 표 lg / 카드 md·xs).
// - 날짜 '2026.12.12 (토)'(KST 달력 날짜 — 시간대 변환 없음), 시각 = 시작 시각.
// - 좌석 "예매/확정/남은": 예매 = 입금 대기 + 확정 매수(자체 결정 — 좌석을 잡은 전부), 남은 = 서버 remainingSeats.
// - 예매 상태 Label: BOOKING_SHOW_STATE_LABEL·TONE, 마감(CLOSED)은 outline(designer 시안 "마감" 흰 바탕 테두리).
// - 예매 중지 스위치: 켜짐 = bookingEnabled false.
// ----------------------------------------------------------------------
import type { Show } from '@/src/api/show-mapper';
import { toRowMissingText } from '@/src/sections/performance-shows/utils/booking-readiness';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D11 } from '@/src/shared/messages/d11';
import {
  BOOKING_SHOW_STATE_LABEL,
  DAY_LABEL,
  type DayCode,
} from '@/src/types/codes';
import type { LabelTone } from '@/src/theme/semantic';
import {
  formatCalendarDate,
  formatKstDateTime,
} from '@/src/utils/kst-date-format';
import { BOOKING_SHOW_STATE_TONE } from '@/src/utils/status-tone';

const WEEKDAYS: DayCode[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const dash = MSG_COMMON.EMPTY_VALUE;
const numText = (value: number | null) =>
  value === null ? dash : String(value);

export interface ShowRowDisplay {
  id: string;
  /** '2026.12.12 (토)' */
  dateText: string;
  timeText: string;
  /** '2026.12.12 (토) 14:00' — 카드 제목·aria·삭제 확인 */
  titleText: string;
  venueText: string;
  seatsCountsText: string;
  seatsTotalText: string;
  openText: string;
  /** 카드 둘째 줄 조각(장소 · 오픈) */
  cardMeta: string[];
  /** 카드 셋째 줄 조각(좌석 · 예매 · 확정 · 남은) */
  cardSeats: string[];
  stateLabel: string;
  stateTone: LabelTone;
  stateVariant: 'soft' | 'outline';
  /** '빈 칸: 가격, 오픈 시각' — 없으면 null */
  missingText: string | null;
  isStopped: boolean;
}

/** 'YYYY-MM-DD' → 'YYYY.MM.DD (요일)' */
export function formatShowDate(showDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(showDate);
  if (!m) return dash;
  const day = new Date(
    Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  ).getUTCDay();
  return `${formatCalendarDate(showDate)} (${DAY_LABEL[WEEKDAYS[day]]})`;
}

export function toShowRowDisplay(show: Show): ShowRowDisplay {
  const dateText = formatShowDate(show.showDate);
  const booked = String(show.pendingQty + show.confirmedQty);
  const confirmed = String(show.confirmedQty);
  const remaining = numText(show.remainingSeats);
  const total = numText(show.totalSeats);
  const openText = show.bookingOpenAt
    ? formatKstDateTime(show.bookingOpenAt)
    : dash;
  return {
    id: show.id,
    dateText,
    timeText: show.startTime,
    titleText: `${dateText} ${show.startTime}`,
    venueText: show.venue ?? dash,
    seatsCountsText: MSG_D11.SEATS_COUNTS(booked, confirmed, remaining),
    seatsTotalText: MSG_D11.SEATS_TOTAL(total),
    openText,
    cardMeta: [
      ...(show.venue ? [show.venue] : []),
      MSG_D11.CARD_OPEN(openText),
    ],
    cardSeats: [
      MSG_D11.CARD_SEATS(total),
      MSG_D11.CARD_BOOKED(booked),
      MSG_D11.CARD_CONFIRMED(confirmed),
      MSG_D11.CARD_REMAINING(remaining),
    ],
    stateLabel: BOOKING_SHOW_STATE_LABEL[show.state],
    stateTone: BOOKING_SHOW_STATE_TONE[show.state],
    stateVariant: show.state === 'CLOSED' ? 'outline' : 'soft',
    missingText:
      show.state === 'NOT_READY' ? toRowMissingText(show.missingFields) : null,
    isStopped: !show.bookingEnabled,
  };
}
