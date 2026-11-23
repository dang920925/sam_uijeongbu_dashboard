'use client';

// ----------------------------------------------------------------------
// SCR-D15 '입금 알림 기기' ViewModel(U43 — 지휘자 설계, 사용자 결정 2026-11-23). JSX 없음.
// - 앱 판별(User-Agent 끝 SAMAdmin/<버전>)은 마운트 뒤에 읽는다(서버 렌더와 어긋나지 않게).
// - 등록: 이름 확인(기본 "관리자 폰") → POST(토큰 한 번) → samadmin://pair?token&name 으로 이동 → 토큰 변수를 버린다.
//   토큰은 상태·쿼리 캐시·화면·로그에 두지 않는다(useMutation 을 쓰지 않고 지역 변수로만 다룬다).
// - 해제: 확인 대화상자 → DELETE → 목록 무효화.
// ----------------------------------------------------------------------
import { useEffect, useMemo, useState } from 'react';

import { createDepositDevice } from '@/src/api/deposit-device';
import {
  buildPairingLink,
  DEFAULT_DEPOSIT_DEVICE_NAME,
  isAdminAppUserAgent,
  toDepositDeviceRow,
  validateDepositDeviceName,
  type DepositDeviceRow,
} from '@/src/api/deposit-device-mapper';
import {
  useDepositDevices,
  useInvalidateDepositDevices,
  useRevokeDepositDevice,
} from '@/src/api/deposit-device-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { openAppLink } from '@/src/lib/app-link';
import { MSG_D15_DEPOSIT } from '@/src/shared/messages/d15-deposit-devices';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export function useDepositDevicesViewModel() {
  const devicesQuery = useDepositDevices();
  const revoke = useRevokeDepositDevice();
  const invalidate = useInvalidateDepositDevices();
  const snackbar = useAppSnackbar();
  const [isAdminApp, setIsAdminApp] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState(DEFAULT_DEPOSIT_DEVICE_NAME);
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<DepositDeviceRow | null>(
    null
  );

  useEffect(() => {
    const id = window.setTimeout(() =>
      setIsAdminApp(isAdminAppUserAgent(navigator.userAgent))
    );
    return () => window.clearTimeout(id);
  }, []);

  const devices = useMemo(
    () => (devicesQuery.data?.items ?? []).map(toDepositDeviceRow),
    [devicesQuery.data]
  );
  const limit = devicesQuery.data?.limit ?? 0;
  const isFull = limit > 0 && devices.length >= limit;

  const onOpenPair = () => {
    setName(DEFAULT_DEPOSIT_DEVICE_NAME);
    setNameError(null);
    setSubmitError(null);
    setDialogOpen(true);
  };

  const onClosePair = () => {
    if (!isPairing) setDialogOpen(false);
  };

  const onNameChange = (value: string) => {
    setName(value);
    setNameError(null);
  };

  const onSubmitPair = async () => {
    const error = validateDepositDeviceName(name);
    if (error) {
      setNameError(error);
      return;
    }
    setIsPairing(true);
    setSubmitError(null);
    try {
      const trimmed = name.trim();
      // 응답(토큰)은 이 블록의 지역 값으로만 쓰고 넘긴 뒤 참조를 남기지 않는다(상태·캐시·로그 없음)
      openAppLink(
        buildPairingLink(
          (await createDepositDevice({ name: trimmed })).token,
          trimmed
        )
      );
      setDialogOpen(false);
    } catch (error: unknown) {
      setSubmitError(toApiErrorMessage(error));
    } finally {
      setIsPairing(false);
      invalidate();
    }
  };

  const onConfirmRevoke = () => {
    if (!revokeTarget) return;
    revoke.mutate(revokeTarget.id, {
      onSuccess: () => snackbar.success(MSG_D15_DEPOSIT.REVOKED),
      onError: (error) => snackbar.error(toApiErrorMessage(error)),
      onSettled: () => setRevokeTarget(null),
    });
  };

  return {
    status: devicesQuery.isPending
      ? ('loading' as const)
      : devicesQuery.isError
        ? ('error' as const)
        : ('ready' as const),
    loadErrorMessage: toApiErrorMessage(devicesQuery.error),
    onRetry: () => void devicesQuery.refetch(),
    devices,
    limit,
    isFull,
    isAdminApp,
    dialog: {
      isOpen: dialogOpen,
      name,
      nameError,
      submitError,
      isPairing,
      onNameChange,
      onClose: onClosePair,
      onSubmit: () => void onSubmitPair(),
    },
    onOpenPair,
    revokeTarget,
    isRevoking: revoke.isPending,
    onAskRevoke: setRevokeTarget,
    onCancelRevoke: () => setRevokeTarget(null),
    onConfirmRevoke,
  };
}

export type DepositDevicesViewModel = ReturnType<
  typeof useDepositDevicesViewModel
>;
