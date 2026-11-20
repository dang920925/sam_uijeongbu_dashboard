// ----------------------------------------------------------------------
// 브라우저 푸시 어댑터(U37 — develop §21). 화면(ViewModel)은 이 함수들만 부르고 navigator·Notification 을 직접 만지지 않는다.
// - 서비스 워커 `/sw.js`(scope `/`) — 푸시 수신·알림 클릭만(fetch 가로채기·캐시 없음, J-109).
// - 지원 조건: serviceWorker + PushManager + Notification. iPhone·iPad 는 iOS 16.4 이상에서 '홈 화면에 추가'한 앱에서만
//   PushManager 가 생긴다(Safari 탭에서는 미지원으로 보인다 — 화면이 iOS 안내를 늘 함께 보인다).
// - 권한 요청은 사용자 동작(토글) 안에서만 부른다(Safari·Firefox 규칙).
// - 이미 구독이 있고 서버 공개키가 같으면 그대로 쓰고, 키가 바뀌었으면 해지 뒤 다시 구독한다.
// ----------------------------------------------------------------------
import { base64UrlToBytes } from '@/src/utils/base64url-to-bytes';

export const SERVICE_WORKER_URL = '/sw.js';

export type PushPermission = NotificationPermission | 'unsupported';

/** 권한이 거부·무시된 경우 — 화면이 "브라우저 설정에서 알림을 허용해주세요." 를 보인다 */
export class PushPermissionError extends Error {
  constructor() {
    super('notification-permission-denied');
    this.name = 'PushPermissionError';
  }
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function readPushPermission(): PushPermission {
  return isPushSupported() ? Notification.permission : 'unsupported';
}

function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' });
}

/** 이 브라우저의 지금 구독 endpoint(없거나 미지원이면 null) */
export async function readCurrentPushEndpoint(): Promise<string | null> {
  if (!isPushSupported()) return null;
  const registration = await registerServiceWorker();
  const subscription = await registration.pushManager.getSubscription();
  return subscription?.endpoint ?? null;
}

function sameKey(current: ArrayBuffer | null, next: Uint8Array): boolean {
  if (!current || current.byteLength !== next.byteLength) return false;
  const bytes = new Uint8Array(current);
  return bytes.every((value, index) => value === next[index]);
}

/** 권한 요청 → 구독(있으면 재사용) → toJSON. 권한이 없으면 PushPermissionError */
export async function subscribeThisBrowser(
  publicKey: string
): Promise<PushSubscriptionJSON> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new PushPermissionError();
  const registration = await registerServiceWorker();
  const applicationServerKey = base64UrlToBytes(publicKey);
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    if (sameKey(existing.options.applicationServerKey, applicationServerKey)) {
      return existing.toJSON();
    }
    await existing.unsubscribe();
  }
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
  return subscription.toJSON();
}

/** 이 브라우저 구독을 해지하고 그 endpoint 를 돌려준다(없으면 null) */
export async function unsubscribeThisBrowser(): Promise<string | null> {
  if (!isPushSupported()) return null;
  const registration = await registerServiceWorker();
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return null;
  await subscription.unsubscribe();
  return subscription.endpoint;
}
