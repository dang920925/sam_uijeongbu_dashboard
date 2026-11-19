'use client';

// 연출진 쿼리 키와 훅(FN-16). 변경 시 staff 루트를 무효화한다.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ROOT_KEYS } from '@/src/api/root-keys';
import {
  createStaff,
  deleteStaff,
  fetchStaffList,
  saveStaff,
} from '@/src/api/staff';
import type { StaffFormInput } from '@/src/api/staff-mapper';

export const staffKeys = {
  all: ROOT_KEYS.staff,
  list: () => [...staffKeys.all, 'list'] as const,
};

export function useStaffList() {
  return useQuery({ queryKey: staffKeys.list(), queryFn: fetchStaffList });
}

function useInvalidateStaff() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: staffKeys.all });
}

export function useCreateStaff() {
  const invalidate = useInvalidateStaff();
  return useMutation({
    mutationFn: (input: StaffFormInput) => createStaff(input),
    onSuccess: invalidate,
  });
}

export function useSaveStaff() {
  const invalidate = useInvalidateStaff();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: StaffFormInput }) =>
      saveStaff(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteStaff() {
  const invalidate = useInvalidateStaff();
  return useMutation({
    mutationFn: (id: string) => deleteStaff(id),
    onSuccess: invalidate,
  });
}
