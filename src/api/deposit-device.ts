// ----------------------------------------------------------------------
// 입금 알림 기기 요청 함수(U43). 브라우저 → BFF `/api/backend/v1/admin/deposit-devices` → 서버.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import { apiDelete, apiFetch, apiPost } from '@/src/lib/api-client';
import type {
  CreateDepositDeviceRequest,
  DepositDeviceCreatedResponse,
  DepositDeviceListResponse,
} from '@/src/types/deposit-device';

export function fetchDepositDevices(): Promise<DepositDeviceListResponse> {
  return apiFetch<DepositDeviceListResponse>(endpoints.depositDevices.list);
}

/** 기기 토큰을 한 번만 받는다 — 쿼리 캐시를 거치지 않게 뷰모델이 직접 부른다 */
export function createDepositDevice(
  body: CreateDepositDeviceRequest
): Promise<DepositDeviceCreatedResponse> {
  return apiPost<DepositDeviceCreatedResponse>(
    endpoints.depositDevices.list,
    body
  );
}

export function revokeDepositDevice(id: string): Promise<void> {
  return apiDelete(endpoints.depositDevices.revoke(id));
}
