// ----------------------------------------------------------------------
// 예매 설정 카드 폼 검증(develop §11.4 BookingPolicyUpsert) — 모든 칸은 비워 둘 수 있다(비면 예매 준비 중).
// 계좌번호 `[0-9-]{6,30}` · 1인 최대 1~20 · 입금 기한 1~168 · 문의처 링크는 https 만(develop §11.10).
// 문의처는 서버 규칙(back-end §14.4 #3 — INQUIRY_CONTACT_SAFE_PATTERN, DB CHECK 같은 식)과 같게: http: · javascript: · data: ·
// vbscript: · file: · ftp: 가 어디 있든 막는다(계약 "http 로 시작하면"보다 넓음 — 화면에서 먼저 칸 아래 문구로).
// 글자 수 상한은 입력칸 maxLength 로 막는다.
// ----------------------------------------------------------------------
import type { BookingPolicyFormInput } from '@/src/api/booking-policy-mapper';
import { validateIntRange } from '@/src/sections/performance-shows/utils/form-number';
import { MSG_D11 } from '@/src/shared/messages/d11';

export const POLICY_TEXT_MAX = 30;
export const POLICY_REFUND_MAX = 2000;
export const POLICY_INQUIRY_MAX = 200;

export interface BookingPolicyFormErrors {
  inquiryContact: string | null;
  depositAccountNumber: string | null;
  maxTicketsPerBooking: string | null;
  depositDeadlineHours: string | null;
}

export const NO_POLICY_FORM_ERRORS: BookingPolicyFormErrors = {
  inquiryContact: null,
  depositAccountNumber: null,
  maxTicketsPerBooking: null,
  depositDeadlineHours: null,
};

/** 서버 INQUIRY_CONTACT_SAFE_PATTERN 의 반대 — 위험한 스킴이 어디든 있으면 true */
const UNSAFE_INQUIRY_SCHEME = /(http|javascript|data|vbscript|file|ftp)\s*:/i;

export function validateBookingPolicyForm(
  input: BookingPolicyFormInput
): BookingPolicyFormErrors {
  const account = input.depositAccountNumber.trim();
  const inquiry = input.inquiryContact.trim();
  return {
    inquiryContact: UNSAFE_INQUIRY_SCHEME.test(inquiry)
      ? MSG_D11.INVALID_INPUT
      : null,
    depositAccountNumber:
      account === '' || /^[0-9-]{6,30}$/.test(account)
        ? null
        : MSG_D11.INVALID_INPUT,
    maxTicketsPerBooking: validateIntRange(input.maxTicketsPerBooking, 1, 20),
    depositDeadlineHours: validateIntRange(input.depositDeadlineHours, 1, 168),
  };
}

export function hasBookingPolicyFormError(
  errors: BookingPolicyFormErrors
): boolean {
  return Object.values(errors).some((message) => message !== null);
}
