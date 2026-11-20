'use client';

// ----------------------------------------------------------------------
// 새 예매 푸시 쿼리·뮤테이션(U37). 공개키·내 기기 목록을 읽고, 등록·해지 뒤 기기 목록을 무효화한다.
// ----------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deletePushDevice,
  fetchPushDevices,
  fetchPushPublicKey,
  registerPushDevice,
  sendTestPush,
} from '@/src/api/push';
import { ROOT_KEYS } from '@/src/api/root-keys';
import type { PushSubscribeRequest } from '@/src/types/push';

export const pushKeys = {
  all: ROOT_KEYS.push,
  publicKey: () => [...ROOT_KEYS.push, 'public-key'] as const,
  devices: () => [...ROOT_KEYS.push, 'devices'] as const,
};

export function usePushPublicKey() {
  return useQuery({
    queryKey: pushKeys.publicKey(),
    queryFn: fetchPushPublicKey,
    staleTime: Infinity,
  });
}

export function usePushDevices() {
  return useQuery({ queryKey: pushKeys.devices(), queryFn: fetchPushDevices });
}

function useInvalidateDevices() {
  const queryClient = useQueryClient();
  return () =>
    void queryClient.invalidateQueries({ queryKey: pushKeys.devices() });
}

export function useRegisterPushDevice() {
  const onSettled = useInvalidateDevices();
  return useMutation({
    mutationFn: (body: PushSubscribeRequest) => registerPushDevice(body),
    onSettled,
  });
}

export function useDeletePushDevice() {
  const onSettled = useInvalidateDevices();
  return useMutation({
    mutationFn: (endpoint: string) => deletePushDevice({ endpoint }),
    onSettled,
  });
}

export function useSendTestPush() {
  const onSettled = useInvalidateDevices();
  return useMutation({ mutationFn: sendTestPush, onSettled });
}
