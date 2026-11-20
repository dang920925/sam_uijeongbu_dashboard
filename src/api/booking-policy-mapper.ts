// ----------------------------------------------------------------------
// 예매 설정 매퍼(FN-29) — develop §11.4 BookingPolicy·BookingPolicyUpsert ↔ 화면 모델·카드 폼 값. 순수 함수(+ spec).
// 폼의 빈 문자열은 계약의 null 로(develop §3.1), 숫자 칸(1인 최대·입금 기한)은 정수로.
// ----------------------------------------------------------------------
import { toIntOrNull } from '@/src/api/show-mapper';
import type {
  BookingPolicyResponse,
  BookingPolicyUpsertRequest,
} from '@/src/types/booking';

export interface BookingPolicy extends BookingPolicyUpsertRequest {
  performanceId: string;
  /** 비어 있는 필드 이름(계약 필드명 그대로) */
  missingFields: string[];
}

/** 예매 설정 카드 폼 값 — 입력칸 문자열 그대로 */
export interface BookingPolicyFormInput {
  /** 문의처(develop §11.10 — 선택, missingFields 아님) */
  inquiryContact: string;
  depositBank: string;
  depositAccountNumber: string;
  depositAccountHolder: string;
  maxTicketsPerBooking: string;
  depositDeadlineHours: string;
  refundPolicyText: string;
}

const blankToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export function fromBookingPolicyResponse(
  res: BookingPolicyResponse
): BookingPolicy {
  return {
    performanceId: res.performanceId,
    inquiryContact: res.inquiryContact ?? null,
    depositBank: res.depositBank ?? null,
    depositAccountNumber: res.depositAccountNumber ?? null,
    depositAccountHolder: res.depositAccountHolder ?? null,
    maxTicketsPerBooking: res.maxTicketsPerBooking ?? null,
    depositDeadlineHours: res.depositDeadlineHours ?? null,
    refundPolicyText: res.refundPolicyText ?? null,
    missingFields: res.missingFields ?? [],
  };
}

export function toBookingPolicyUpsertRequest(
  input: BookingPolicyFormInput
): BookingPolicyUpsertRequest {
  return {
    inquiryContact: blankToNull(input.inquiryContact),
    depositBank: blankToNull(input.depositBank),
    depositAccountNumber: blankToNull(input.depositAccountNumber),
    depositAccountHolder: blankToNull(input.depositAccountHolder),
    maxTicketsPerBooking: toIntOrNull(input.maxTicketsPerBooking),
    depositDeadlineHours: toIntOrNull(input.depositDeadlineHours),
    // 환불 규정은 줄바꿈을 살리고 앞뒤 공백만 지운다
    refundPolicyText: blankToNull(input.refundPolicyText),
  };
}

export function toBookingPolicyFormInput(
  policy: BookingPolicy
): BookingPolicyFormInput {
  const num = (value: number | null) => (value === null ? '' : String(value));
  return {
    inquiryContact: policy.inquiryContact ?? '',
    depositBank: policy.depositBank ?? '',
    depositAccountNumber: policy.depositAccountNumber ?? '',
    depositAccountHolder: policy.depositAccountHolder ?? '',
    maxTicketsPerBooking: num(policy.maxTicketsPerBooking),
    depositDeadlineHours: num(policy.depositDeadlineHours),
    refundPolicyText: policy.refundPolicyText ?? '',
  };
}
