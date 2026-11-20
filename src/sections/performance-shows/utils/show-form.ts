// ----------------------------------------------------------------------
// 회차 다이얼로그 폼 검증(develop §11.4 ShowUpsert) — 날짜·시작 시각 필수, 좌석 0~10000,
// 예매 오픈 날짜·시각은 둘 다 넣거나 둘 다 비운다(가격은 공연 단위 가격 등급 — tier-form.ts).
// ----------------------------------------------------------------------
import type { ShowFormInput } from '@/src/api/show-mapper';
import { validateIntRange } from '@/src/sections/performance-shows/utils/form-number';
import { MSG_D11 } from '@/src/shared/messages/d11';

export const SHOW_SEATS_MAX = 10_000;
export const SHOW_VENUE_MAX = 200;

export interface ShowFormErrors {
  showDate: string | null;
  startTime: string | null;
  totalSeats: string | null;
  bookingOpenDate: string | null;
  bookingOpenTime: string | null;
}

export const NO_SHOW_FORM_ERRORS: ShowFormErrors = {
  showDate: null,
  startTime: null,
  totalSeats: null,
  bookingOpenDate: null,
  bookingOpenTime: null,
};

export function validateShowForm(input: ShowFormInput): ShowFormErrors {
  const hasOpenDate = input.bookingOpenDate !== '';
  const hasOpenTime = input.bookingOpenTime !== '';
  return {
    showDate: input.showDate === '' ? MSG_D11.DATE_REQUIRED : null,
    startTime: input.startTime === '' ? MSG_D11.START_REQUIRED : null,
    totalSeats: validateIntRange(input.totalSeats, 0, SHOW_SEATS_MAX),
    bookingOpenDate: hasOpenTime && !hasOpenDate ? MSG_D11.INVALID_INPUT : null,
    bookingOpenTime: hasOpenDate && !hasOpenTime ? MSG_D11.INVALID_INPUT : null,
  };
}

export function hasShowFormError(errors: ShowFormErrors): boolean {
  return Object.values(errors).some((message) => message !== null);
}
