'use client';

// 팝업 쿼리 키와 훅(FN-17). 변경 시 popup 루트를 무효화한다(겹침 여부 overlapsActive 가 다른 행에도 걸리므로 목록 전체).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createPopup,
  deletePopup,
  fetchPopups,
  savePopup,
} from '@/src/api/popup';
import type { PopupFormInput } from '@/src/api/popup-mapper';
import { ROOT_KEYS } from '@/src/api/root-keys';

export const popupKeys = {
  all: ROOT_KEYS.popup,
  list: () => [...popupKeys.all, 'list'] as const,
};

export function usePopups() {
  return useQuery({ queryKey: popupKeys.list(), queryFn: fetchPopups });
}

function useInvalidatePopups() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: popupKeys.all });
}

export function useCreatePopup() {
  const invalidate = useInvalidatePopups();
  return useMutation({
    mutationFn: (input: PopupFormInput) => createPopup(input),
    onSuccess: invalidate,
  });
}

export function useSavePopup() {
  const invalidate = useInvalidatePopups();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PopupFormInput }) =>
      savePopup(id, input),
    onSuccess: invalidate,
  });
}

export function useDeletePopup() {
  const invalidate = useInvalidatePopups();
  return useMutation({
    mutationFn: (id: string) => deletePopup(id),
    onSuccess: invalidate,
  });
}
