'use client';

// ----------------------------------------------------------------------
// 공연·반 쿼리 키와 훅. mutation 성공 시 performanceKeys.all 무효화(요약·목록·상세·일정 연결 선택이 함께 갱신).
// ----------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createClass,
  createPerformance,
  deleteClass,
  deletePerformance,
  fetchAllClasses,
  fetchPerformance,
  fetchPerformanceClasses,
  fetchPerformances,
  saveClass,
  savePerformance,
} from '@/src/api/performance';
import type { ClassStatus } from '@/src/types/codes';
import type { ClassFormInput } from '@/src/types/performance-class';
import type {
  PerformanceFormInput,
  PerformanceListQuery,
} from '@/src/types/performance';
import { ROOT_KEYS } from '@/src/api/root-keys';

export const performanceKeys = {
  all: ROOT_KEYS.performance,
  list: (query: PerformanceListQuery) =>
    [...performanceKeys.all, 'list', query] as const,
  detail: (id: string) => [...performanceKeys.all, 'detail', id] as const,
  classes: (id: string) => [...performanceKeys.all, 'classes', id] as const,
  allClasses: (status?: ClassStatus) =>
    [...performanceKeys.all, 'all-classes', status] as const,
};

export function usePerformances(query: PerformanceListQuery) {
  return useQuery({
    queryKey: performanceKeys.list(query),
    queryFn: () => fetchPerformances(query),
    placeholderData: (previous) => previous,
  });
}

export function usePerformance(id: string) {
  return useQuery({
    queryKey: performanceKeys.detail(id),
    queryFn: () => fetchPerformance(id),
  });
}

export function usePerformanceClasses(performanceId: string | null) {
  return useQuery({
    queryKey: performanceKeys.classes(performanceId ?? ''),
    queryFn: () => fetchPerformanceClasses(performanceId as string),
    enabled: Boolean(performanceId),
  });
}

export function useAllClasses(status?: ClassStatus) {
  return useQuery({
    queryKey: performanceKeys.allClasses(status),
    queryFn: () => fetchAllClasses(status),
  });
}

function useInvalidatePerformances() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: performanceKeys.all }),
      queryClient.invalidateQueries({ queryKey: ROOT_KEYS.dashboard }),
    ]);
}

export function useCreatePerformance() {
  const invalidate = useInvalidatePerformances();
  return useMutation({
    mutationFn: (input: PerformanceFormInput) => createPerformance(input),
    onSuccess: invalidate,
  });
}

export function useSavePerformance(id: string) {
  const invalidate = useInvalidatePerformances();
  return useMutation({
    mutationFn: (input: PerformanceFormInput) => savePerformance(id, input),
    onSuccess: invalidate,
  });
}

export function useDeletePerformance() {
  const invalidate = useInvalidatePerformances();
  return useMutation({
    mutationFn: (id: string) => deletePerformance(id),
    onSuccess: invalidate,
  });
}

export function useCreateClass(performanceId: string) {
  const invalidate = useInvalidatePerformances();
  return useMutation({
    mutationFn: (input: ClassFormInput) => createClass(performanceId, input),
    onSuccess: invalidate,
  });
}

export function useSaveClass() {
  const invalidate = useInvalidatePerformances();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ClassFormInput }) =>
      saveClass(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteClass() {
  const invalidate = useInvalidatePerformances();
  return useMutation({
    mutationFn: (id: string) => deleteClass(id),
    onSuccess: invalidate,
  });
}
