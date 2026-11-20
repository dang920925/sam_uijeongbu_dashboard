// ----------------------------------------------------------------------
// 입장 체크 요청 함수(FN-36, develop §11.4) — 회차 선택 목록 · 명단 · 증감 · 입금 확인 + 입장 ·
// 현장 등록용 가격 등급(develop §11.10 — 사용 중 등급만).
// ----------------------------------------------------------------------
import {
  fromAdmissionBoardResponse,
  fromAdmissionResultResponse,
  fromAdmissionShowResponse,
  type AdmissionBoard,
  type AdmissionResult,
  type AdmissionShow,
} from '@/src/api/admission-mapper';
import { endpoints } from '@/src/api/endpoints';
import type { ManualReservationTierOption } from '@/src/components/manual-reservation-dialog';
import { apiFetch, apiPost, withQuery } from '@/src/lib/api-client';
import type {
  AdminPriceTierResponse,
  AdminShowWithTitleResponse,
  AdmissionBoardResponse,
  AdmissionDeltaRequest,
  AdmissionResultResponse,
  ConfirmAndAdmitRequest,
} from '@/src/types/booking';
import { todayKst } from '@/src/utils/kst-date-format';

/** 오늘(KST) 이후 회차 — `GET /admin/shows?from=` */
export async function fetchAdmissionShows(
  from: string = todayKst()
): Promise<AdmissionShow[]> {
  const res = await apiFetch<{ items: AdminShowWithTitleResponse[] }>(
    withQuery(endpoints.shows.list, { from })
  );
  return res.items.map(fromAdmissionShowResponse);
}

/** 명단 — q 는 이름 포함 · 4자리면 예매번호 또는 연락처 끝 4자리 일치 */
export async function fetchAdmissionBoard(
  showId: string,
  q: string
): Promise<AdmissionBoard> {
  return fromAdmissionBoardResponse(
    await apiFetch<AdmissionBoardResponse>(
      withQuery(endpoints.shows.admission(showId), { q })
    )
  );
}

/** 입장 증감 `{ delta }` — 조건부 한 문장 UPDATE, 넘으면 409 RSV_010 */
export async function changeAdmission(
  reservationId: string,
  delta: number
): Promise<AdmissionResult> {
  const body: AdmissionDeltaRequest = { delta };
  return fromAdmissionResultResponse(
    await apiPost<AdmissionResultResponse>(
      endpoints.reservations.admission(reservationId),
      body
    )
  );
}

/** 입금 확인 + 입장 `{ version, admit }` — 409 RSV_007/RSV_008 */
export async function confirmAndAdmit(
  reservationId: string,
  body: ConfirmAndAdmitRequest
): Promise<AdmissionResult> {
  return fromAdmissionResultResponse(
    await apiPost<AdmissionResultResponse>(
      endpoints.reservations.confirmAndAdmit(reservationId),
      body
    )
  );
}

/**
 * 현장 예매 등록 Dialog 의 등급 선택지 — `GET /admin/performances/{id}/price-tiers` 의 사용 중 등급(sortOrder 순).
 * (endpoints.performances.priceTiers 가 아직 없어 공연 경로 뒤에 붙인다 — 생기면 바꾼다.)
 */
export async function fetchActivePriceTiers(
  performanceId: string
): Promise<ManualReservationTierOption[]> {
  const res = await apiFetch<{ items: AdminPriceTierResponse[] }>(
    endpoints.performances.priceTiers(performanceId)
  );
  return [...res.items]
    .filter((tier) => tier.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((tier) => ({
      id: tier.id,
      name: tier.name,
      price: tier.price,
      visibility: tier.visibility,
    }));
}
