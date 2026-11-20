'use client';

// ----------------------------------------------------------------------
// SCR-D15 '예매 알림' ViewModel(U37 — develop §21, design §16). JSX 없음.
// - 브라우저 상태(지원·권한·지금 구독 endpoint)는 마운트 뒤에 읽는다(서버 렌더와 어긋나지 않게).
// - 토글 = 내 기기 목록에 이 브라우저 endpoint 가 있는가. 켜기: 권한 요청 → 구독 → 서버 등록. 끄기: 구독 해지 → 서버 삭제(PU-7).
// - 기기 삭제: 이 기기면 토글 끄기와 같고, 다른 기기면 서버에서만 지운다(그 기기는 다음 발송부터 받지 않음).
// - 시험 알림: 이 계정 기기 전체 → "n대" 또는 "기기 없음".
// ----------------------------------------------------------------------
import { useEffect, useMemo, useState } from 'react';

import {
  toPushDevice,
  toPushSubscribeRequest,
  type PushDevice,
} from '@/src/api/push-mapper';
import {
  useDeletePushDevice,
  usePushDevices,
  usePushPublicKey,
  useRegisterPushDevice,
  useSendTestPush,
} from '@/src/api/push-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { ApiError } from '@/src/lib/api-client';
import {
  PushPermissionError,
  readCurrentPushEndpoint,
  readPushPermission,
  subscribeThisBrowser,
  unsubscribeThisBrowser,
  type PushPermission,
} from '@/src/lib/web-push-browser';
import { toPushCardStatus } from '@/src/sections/account/utils/push-card-status';
import { MSG_D15_PUSH } from '@/src/shared/messages/d15-push';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export function usePushSettingsViewModel() {
  const publicKeyQuery = usePushPublicKey();
  const devicesQuery = usePushDevices();
  const register = useRegisterPushDevice();
  const remove = useDeletePushDevice();
  const test = useSendTestPush();
  const snackbar = useAppSnackbar();
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    let alive = true;
    const current = readPushPermission();
    const endpoint =
      current === 'unsupported'
        ? Promise.resolve(null)
        : readCurrentPushEndpoint().catch(() => null);
    void endpoint.then((value) => {
      if (!alive) return;
      setPermission(current);
      setCurrentEndpoint(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  const publicKey = publicKeyQuery.data?.publicKey ?? null;
  const devices: PushDevice[] = useMemo(
    () =>
      (devicesQuery.data?.items ?? []).map((item) =>
        toPushDevice(item, currentEndpoint)
      ),
    [devicesQuery.data, currentEndpoint]
  );
  const status = toPushCardStatus({
    isLoading: publicKeyQuery.isPending || devicesQuery.isPending,
    isError: publicKeyQuery.isError || devicesQuery.isError,
    publicKey,
    permission,
  });
  const isBusy =
    isWorking || register.isPending || remove.isPending || test.isPending;

  const showError = (error: unknown) => {
    if (error instanceof PushPermissionError) {
      setPermission(readPushPermission());
      snackbar.error(MSG_D15_PUSH.PERMISSION_DENIED);
      return;
    }
    snackbar.error(
      error instanceof ApiError
        ? toApiErrorMessage(error)
        : MSG_D15_PUSH.SUBSCRIBE_FAILED
    );
  };

  const turnOn = async () => {
    if (!publicKey) return;
    const subscription = await subscribeThisBrowser(publicKey);
    setPermission(readPushPermission());
    const body = toPushSubscribeRequest(subscription, navigator.userAgent);
    if (!body) throw new Error('push-subscription-without-keys');
    await register.mutateAsync(body);
    setCurrentEndpoint(body.endpoint);
    snackbar.success(MSG_D15_PUSH.ENABLED);
  };

  const turnOff = async () => {
    const endpoint = (await unsubscribeThisBrowser()) ?? currentEndpoint;
    if (endpoint) await remove.mutateAsync(endpoint);
    setCurrentEndpoint(null);
    snackbar.success(MSG_D15_PUSH.DISABLED);
  };

  const run = async (task: () => Promise<void>) => {
    setIsWorking(true);
    try {
      await task();
    } catch (error: unknown) {
      showError(error);
    } finally {
      setIsWorking(false);
    }
  };

  const onToggle = (checked: boolean) => void run(checked ? turnOn : turnOff);

  const onDeleteDevice = (device: PushDevice) =>
    void run(async () => {
      if (device.isCurrent) return turnOff();
      await remove.mutateAsync(device.endpoint);
      snackbar.success(MSG_D15_PUSH.DEVICE_DELETED);
    });

  const onSendTest = () =>
    void run(async () => {
      const result = await test.mutateAsync();
      if (result.sent > 0)
        snackbar.success(MSG_D15_PUSH.TEST_SENT(result.sent));
      else snackbar.error(MSG_D15_PUSH.TEST_NONE);
    });

  const onRetry = () => {
    void publicKeyQuery.refetch();
    void devicesQuery.refetch();
  };

  return {
    status,
    enabled: devices.some((device) => device.isCurrent),
    devices,
    isBusy,
    loadErrorMessage: toApiErrorMessage(
      publicKeyQuery.error ?? devicesQuery.error
    ),
    onToggle,
    onDeleteDevice,
    onSendTest,
    onRetry,
  };
}

export type PushSettingsViewModel = ReturnType<typeof usePushSettingsViewModel>;
