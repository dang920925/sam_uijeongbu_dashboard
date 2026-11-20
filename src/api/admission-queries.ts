'use client';

// ----------------------------------------------------------------------
// 입장 체크 쿼리 키와 훅(FN-36). 키는 ROOT_KEYS.admission(접두사 booking) 아래 —
// 예매를 바꾸는 다른 화면이 ROOT_KEYS.booking 을 무효화하면 입장 명단도 같이 새로 받는다.
// - 명단은 10초마다 다시 받는다(J-41, 화면이 보일 때만 — TanStack 기본 refetchIntervalInBackground false).
//   입장 처리 요청이 진행 중이면 폴링을 멈춰 낙관 표시가 옛 값으로 덮이지 않게 한다.
// - 입장 증감·입금 확인 + 입장은 onMutate 에서 즉시 숫자를 바꾸고(낙관 표시), 실패하면 그 행만 되돌린다.
//   성공하면 응답(item·summary)으로 맞춘다 — 같은 회차의 모든 명단 캐시(검색어별)에 적용.
// ----------------------------------------------------------------------
import {
  useIsMutating,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import {
  changeAdmission,
  confirmAndAdmit,
  fetchActivePriceTiers,
  fetchAdmissionBoard,
  fetchAdmissionShows,
} from '@/src/api/admission';
import {
  applyAdmissionDelta,
  applyAdmissionResult,
  applyConfirmAndAdmit,
  revertConfirmAndAdmit,
  type AdmissionBoard,
  type AdmissionItem,
  type AdmissionResult,
} from '@/src/api/admission-mapper';
import { createManualReservation } from '@/src/api/reservation';
import type { ManualReservationFormInput } from '@/src/api/reservation-mapper';
import { ROOT_KEYS } from '@/src/api/root-keys';

/** 명단 자동 갱신 간격(J-41) */
export const ADMISSION_POLL_MS = 10_000;

export const admissionKeys = {
  all: ROOT_KEYS.admission,
  shows: (from: string) => [...admissionKeys.all, 'shows', from] as const,
  boards: (showId: string) => [...admissionKeys.all, 'board', showId] as const,
  board: (showId: string, q: string) =>
    [...admissionKeys.boards(showId), q] as const,
  tiers: (performanceId: string) =>
    [...admissionKeys.all, 'tiers', performanceId] as const,
  /** 입장 처리 뮤테이션(행 잠금·폴링 멈춤 판단) */
  mutation: [...ROOT_KEYS.admission, 'mutation'] as const,
};

export interface AdmissionDeltaVariables {
  showId: string;
  item: AdmissionItem;
  delta: number;
}

export interface ConfirmAndAdmitVariables {
  showId: string;
  item: AdmissionItem;
  admit: number;
}

/** from(오늘 KST)이 정해진 뒤에만 부른다 */
export function useAdmissionShows(from: string | null) {
  return useQuery({
    queryKey: admissionKeys.shows(from ?? ''),
    queryFn: () => fetchAdmissionShows(from as string),
    enabled: Boolean(from),
  });
}

export function useAdmissionBoard(showId: string | null, q: string) {
  const isMutating = useIsMutating({ mutationKey: admissionKeys.mutation });
  return useQuery({
    queryKey: admissionKeys.board(showId ?? '', q),
    queryFn: () => fetchAdmissionBoard(showId as string, q),
    enabled: Boolean(showId),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: isMutating > 0 ? false : ADMISSION_POLL_MS,
    // 같은 회차에서 검색어만 바뀌면 이전 명단을 둔 채 거른다(입력 즉시 거름) — 회차가 바뀌면 비운다
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[3] === showId ? previous : undefined,
  });
}

/** 현장 예매 등록 Dialog 의 등급 선택지 — 공연 id 가 없으면 부르지 않는다(직접 입력만) */
export function useAdmissionPriceTiers(
  performanceId: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: admissionKeys.tiers(performanceId ?? ''),
    queryFn: () => fetchActivePriceTiers(performanceId as string),
    enabled: enabled && Boolean(performanceId),
  });
}

/** 진행 중인 입장 처리의 예매 id — 그 행 버튼을 잠근다 */
export function usePendingAdmissionIds(): string[] {
  return useMutationState({
    filters: { mutationKey: admissionKeys.mutation, status: 'pending' },
    select: (mutation) =>
      (mutation.state.variables as { item?: AdmissionItem } | undefined)?.item
        ?.id ?? '',
  }).filter(Boolean);
}

function updateBoards(
  queryClient: QueryClient,
  showId: string,
  update: (board: AdmissionBoard) => AdmissionBoard
) {
  queryClient.setQueriesData<AdmissionBoard>(
    { queryKey: admissionKeys.boards(showId) },
    (board) => (board ? update(board) : board)
  );
}

/** 다른 화면(예매 관리·회차 좌석)의 캐시도 낡았다고 표시한다 — 입장 명단은 응답으로 이미 맞췄다 */
function invalidateOtherBookingViews(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ROOT_KEYS.reservation }),
    queryClient.invalidateQueries({ queryKey: ROOT_KEYS.show }),
  ]);
}

export function useChangeAdmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: admissionKeys.mutation,
    mutationFn: ({ item, delta }: AdmissionDeltaVariables) =>
      changeAdmission(item.id, delta),
    onMutate: async ({ showId, item, delta }) => {
      await queryClient.cancelQueries({
        queryKey: admissionKeys.boards(showId),
      });
      updateBoards(queryClient, showId, (board) =>
        applyAdmissionDelta(board, item.id, delta)
      );
    },
    onError: (_error, { showId, item, delta }) =>
      updateBoards(queryClient, showId, (board) =>
        applyAdmissionDelta(board, item.id, -delta)
      ),
    onSuccess: (result: AdmissionResult, { showId }) => {
      updateBoards(queryClient, showId, (board) =>
        applyAdmissionResult(board, result)
      );
      return invalidateOtherBookingViews(queryClient);
    },
  });
}

export function useConfirmAndAdmit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: admissionKeys.mutation,
    mutationFn: ({ item, admit }: ConfirmAndAdmitVariables) =>
      confirmAndAdmit(item.id, { version: item.version, admit }),
    onMutate: async ({ showId, item, admit }) => {
      await queryClient.cancelQueries({
        queryKey: admissionKeys.boards(showId),
      });
      updateBoards(queryClient, showId, (board) =>
        applyConfirmAndAdmit(board, item.id, admit)
      );
    },
    onError: (_error, { showId, item, admit }) =>
      updateBoards(queryClient, showId, (board) =>
        revertConfirmAndAdmit(board, item, admit)
      ),
    onSuccess: (result: AdmissionResult, { showId }) => {
      updateBoards(queryClient, showId, (board) =>
        applyAdmissionResult(board, result)
      );
      return invalidateOtherBookingViews(queryClient);
    },
  });
}

/** 같은 회차 명단을 즉시 다시 받는다(충돌 뒤 · 다시 시도) */
export function useRefetchAdmissionBoards() {
  const queryClient = useQueryClient();
  return (showId: string) =>
    queryClient.invalidateQueries({ queryKey: admissionKeys.boards(showId) });
}

/** 현장 예매 등록 — 공용 수동 등록(createManualReservation)을 감싼다. 성공하면 예매 묶음 전체를 새로 받는다 */
export function useCreateOnsiteReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ManualReservationFormInput) =>
      createManualReservation(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.booking }),
  });
}
