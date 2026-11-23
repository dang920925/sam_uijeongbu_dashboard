'use client';

// ----------------------------------------------------------------------
// 입금 알림 기기 쿼리·뮤테이션(U43). 등록은 토큰이 캐시에 남지 않게 useMutation 을 쓰지 않는다(뷰모델이 직접 호출 후 무효화).
// ----------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchDepositDevices,
  revokeDepositDevice,
} from '@/src/api/deposit-device';
import { ROOT_KEYS } from '@/src/api/root-keys';

export const depositDeviceKeys = {
  all: ROOT_KEYS.depositDevice,
  list: () => [...ROOT_KEYS.depositDevice, 'list'] as const,
};

export function useDepositDevices() {
  return useQuery({
    queryKey: depositDeviceKeys.list(),
    queryFn: fetchDepositDevices,
  });
}

export function useInvalidateDepositDevices() {
  const queryClient = useQueryClient();
  return () =>
    void queryClient.invalidateQueries({ queryKey: depositDeviceKeys.all });
}

export function useRevokeDepositDevice() {
  const onSettled = useInvalidateDepositDevices();
  return useMutation({
    mutationFn: (id: string) => revokeDepositDevice(id),
    onSettled,
  });
}
