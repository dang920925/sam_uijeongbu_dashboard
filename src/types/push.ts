// ----------------------------------------------------------------------
// 새 예매 푸시(U37) 계약 — develop §21 `/admin/push/*`(서버 dto 와 같은 모양, server test/contract/push.contract.ts).
// ----------------------------------------------------------------------

/** GET /admin/push/public-key — 서버에서 푸시가 꺼져 있으면 null */
export interface PushPublicKeyResponse {
  publicKey: string | null;
}

/** 관리자 기기 1개(키는 내려오지 않는다) */
export interface PushDeviceResponse {
  id: string;
  endpoint: string;
  userAgent: string | null;
  createdAt: string;
  lastSuccessAt: string | null;
}

/** GET /admin/push/subscriptions — 이 계정 기기(등록 순) */
export interface PushDeviceListResponse {
  items: PushDeviceResponse[];
}

/** POST /admin/push/subscriptions — 같은 endpoint 면 서버가 갱신 */
export interface PushSubscribeRequest {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string | null;
}

/** DELETE /admin/push/subscriptions */
export interface PushUnsubscribeRequest {
  endpoint: string;
}

/** POST /admin/push/test */
export interface PushTestResponse {
  sent: number;
  removed: number;
  failed: number;
}
