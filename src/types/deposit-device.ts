// ----------------------------------------------------------------------
// 입금 알림 기기(U43 — 사용자 결정 2026-11-23) 계약 — 서버 `/admin/deposit-devices`(server test/contract/deposit-devices.contract.ts).
// ----------------------------------------------------------------------

/** 기기 1대(토큰·해시는 내려오지 않는다) */
export interface DepositDeviceResponse {
  id: string;
  name: string;
  createdAt: string;
  lastSeenAt: string | null;
}

/** GET /admin/deposit-devices — 해제 안 된 기기(등록 순)와 상한 */
export interface DepositDeviceListResponse {
  items: DepositDeviceResponse[];
  limit: number;
}

/** POST /admin/deposit-devices */
export interface CreateDepositDeviceRequest {
  name: string;
}

/** POST /admin/deposit-devices 201 — token 은 이 응답에서 한 번만 온다(화면·로그·캐시에 남기지 않는다) */
export interface DepositDeviceCreatedResponse {
  device: DepositDeviceResponse;
  token: string;
}
