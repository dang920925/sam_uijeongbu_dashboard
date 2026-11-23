'use client';

// ----------------------------------------------------------------------
// 가격 등급 쿼리 키와 훅(develop §11.10). 변경 뒤 ROOT_KEYS.booking 을 무효화한다
// — 가격이 바뀌면 회차의 missingFields(basePrice·samRelatedPrice)·state 와 예매 화면들이 함께 바뀐다.
// 단원 초대 코드 조회는 ROOT_KEYS.inviteCode 아래(발급하면 SCR-D12 초대 링크 탭도 갱신).
// ----------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchInviteMembers,
  issueInviteCode,
} from '@/src/api/invite-code-lookup';
import {
  createPriceTier,
  deletePriceTier,
  fetchInviterPrices,
  fetchPriceTiers,
  patchPriceTier,
  reissuePriceTierLink,
  saveInviterPrices,
  savePriceTier,
} from '@/src/api/price-tier';
import type { InviterPricesRequest } from '@/src/types/booking';
import type { PriceTierFormInput } from '@/src/api/price-tier-mapper';
import { ROOT_KEYS } from '@/src/api/root-keys';
import { isNotFoundError } from '@/src/utils/api-error-message';

export const priceTierKeys = {
  all: ROOT_KEYS.priceTier,
  list: (performanceId: string) =>
    [...priceTierKeys.all, 'list', performanceId] as const,
  inviteMembers: () => [...ROOT_KEYS.inviteCode, 'tier-link-members'] as const,
  inviterPrices: (performanceId: string) =>
    [...priceTierKeys.all, 'inviter-prices', performanceId] as const,
};

/** (U41) 초대 유형별 가격 */
export function useInviterPrices(performanceId: string) {
  return useQuery({
    queryKey: priceTierKeys.inviterPrices(performanceId),
    queryFn: () => fetchInviterPrices(performanceId),
  });
}

export function usePriceTiers(performanceId: string) {
  return useQuery({
    queryKey: priceTierKeys.list(performanceId),
    queryFn: () => fetchPriceTiers(performanceId),
  });
}

function useInvalidateBooking() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ROOT_KEYS.booking });
}

export function useCreatePriceTier(performanceId: string) {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: ({
      input,
      sortOrder,
    }: {
      input: PriceTierFormInput;
      sortOrder?: number;
    }) => createPriceTier(performanceId, input, sortOrder),
    onSuccess: invalidate,
  });
}

export function useSavePriceTier() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PriceTierFormInput }) =>
      savePriceTier(id, input),
    onSuccess: invalidate,
    onError: (error) => {
      if (isNotFoundError(error)) void invalidate();
    },
  });
}

/** 사용 스위치 — 실패해도 목록을 다시 불러와 서버 값으로 되돌린다 */
export function useSavePriceTierActive() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      patchPriceTier(id, { isActive }),
    onSettled: invalidate,
  });
}

/** 순서 바꾸기 — 바뀐 등급만 sortOrder PATCH(utils/tier-order 가 계산) */
export function useReorderPriceTiers() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (changes: { id: string; sortOrder: number }[]) =>
      Promise.all(
        changes.map((change) =>
          patchPriceTier(change.id, { sortOrder: change.sortOrder })
        )
      ),
    onSettled: invalidate,
  });
}

export function useDeletePriceTier() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (id: string) => deletePriceTier(id),
    onSuccess: invalidate,
    onError: (error) => {
      if (isNotFoundError(error)) void invalidate();
    },
  });
}

export function useReissuePriceTierLink() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (id: string) => reissuePriceTierLink(id),
    onSuccess: invalidate,
  });
}

export function useInviteMembers(enabled: boolean) {
  return useQuery({
    queryKey: priceTierKeys.inviteMembers(),
    queryFn: fetchInviteMembers,
    enabled,
  });
}

export function useIssueInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => issueInviteCode(memberId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.inviteCode }),
  });
}

/** (U41) 초대 유형별 가격 저장 — 회차 준비 상태(missingFields basePrice·samRelatedPrice)도 바뀌어 booking 전체를 무효화 */
export function useSaveInviterPrices(performanceId: string) {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (body: InviterPricesRequest) =>
      saveInviterPrices(performanceId, body),
    onSuccess: invalidate,
  });
}
