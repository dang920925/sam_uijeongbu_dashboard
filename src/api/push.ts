// ----------------------------------------------------------------------
// 새 예매 푸시 요청 함수(U37 — develop §21). 브라우저 → BFF `/api/backend/v1/admin/push/*` → 서버.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import { apiDelete, apiFetch, apiPost } from '@/src/lib/api-client';
import type {
  PushDeviceListResponse,
  PushDeviceResponse,
  PushPublicKeyResponse,
  PushSubscribeRequest,
  PushTestResponse,
  PushUnsubscribeRequest,
} from '@/src/types/push';

export function fetchPushPublicKey(): Promise<PushPublicKeyResponse> {
  return apiFetch<PushPublicKeyResponse>(endpoints.push.publicKey);
}

export function fetchPushDevices(): Promise<PushDeviceListResponse> {
  return apiFetch<PushDeviceListResponse>(endpoints.push.subscriptions);
}

export function registerPushDevice(
  body: PushSubscribeRequest
): Promise<PushDeviceResponse> {
  return apiPost<PushDeviceResponse>(endpoints.push.subscriptions, body);
}

export function deletePushDevice(body: PushUnsubscribeRequest): Promise<void> {
  return apiDelete(endpoints.push.subscriptions, body);
}

export function sendTestPush(): Promise<PushTestResponse> {
  return apiPost<PushTestResponse>(endpoints.push.test);
}
