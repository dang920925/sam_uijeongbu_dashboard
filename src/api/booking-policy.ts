// ----------------------------------------------------------------------
// 예매 설정 요청 함수(FN-29) — develop §11.4 `GET·PUT /admin/performances/{id}/booking-policy`.
// ----------------------------------------------------------------------
import {
  fromBookingPolicyResponse,
  toBookingPolicyUpsertRequest,
  type BookingPolicy,
  type BookingPolicyFormInput,
} from '@/src/api/booking-policy-mapper';
import { endpoints } from '@/src/api/endpoints';
import { apiFetch, apiPut } from '@/src/lib/api-client';
import type { BookingPolicyResponse } from '@/src/types/booking';

export async function fetchBookingPolicy(
  performanceId: string
): Promise<BookingPolicy> {
  return fromBookingPolicyResponse(
    await apiFetch<BookingPolicyResponse>(
      endpoints.performances.bookingPolicy(performanceId)
    )
  );
}

export async function saveBookingPolicy(
  performanceId: string,
  input: BookingPolicyFormInput
): Promise<BookingPolicy> {
  return fromBookingPolicyResponse(
    await apiPut<BookingPolicyResponse>(
      endpoints.performances.bookingPolicy(performanceId),
      toBookingPolicyUpsertRequest(input)
    )
  );
}
