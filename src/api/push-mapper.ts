// ----------------------------------------------------------------------
// 새 예매 푸시 매퍼(U37) — 서버 응답 → 화면 모델, 브라우저 구독 → 등록 요청.
// - 기기 이름: userAgent 에서 기기(iPhone·iPad·Android·Mac·Windows·Linux) + 브라우저(Edge·Samsung·Chrome·Firefox·Safari)를 뽑는다.
// - 이 기기: 브라우저의 지금 구독 endpoint 와 같은 항목.
// ----------------------------------------------------------------------
import type {
  PushDeviceResponse,
  PushSubscribeRequest,
} from '@/src/types/push';
import { formatKstDate } from '@/src/utils/kst-date-format';

export interface PushDevice {
  id: string;
  endpoint: string;
  /** 예: "iPhone · Safari" */
  name: string;
  /** 등록일 YYYY.MM.DD(KST) */
  registeredAt: string;
  isCurrent: boolean;
}

export const UNKNOWN_DEVICE_NAME = '알 수 없는 기기';

const DEVICE_RULES: [RegExp, string][] = [
  [/iPhone/, 'iPhone'],
  [/iPad/, 'iPad'],
  [/Android/, 'Android'],
  [/Macintosh|Mac OS X/, 'Mac'],
  [/Windows/, 'Windows'],
  [/Linux|X11|CrOS/, 'Linux'],
];
// 순서가 중요하다 — Edge·Samsung UA 에도 Chrome·Safari 가, Chrome UA 에도 Safari 가 들어 있다
const BROWSER_RULES: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/SamsungBrowser/, '삼성 인터넷'],
  [/Firefox|FxiOS/, 'Firefox'],
  [/Chrome|CriOS/, 'Chrome'],
  [/Safari/, 'Safari'],
];

function pick(rules: [RegExp, string][], value: string): string | null {
  return rules.find(([pattern]) => pattern.test(value))?.[1] ?? null;
}

/** userAgent → "기기 · 브라우저"(하나만 알면 그것만, 둘 다 모르면 알 수 없는 기기) */
export function toDeviceName(userAgent: string | null): string {
  if (!userAgent) return UNKNOWN_DEVICE_NAME;
  const parts = [pick(DEVICE_RULES, userAgent), pick(BROWSER_RULES, userAgent)];
  const known = parts.filter((part): part is string => part !== null);
  return known.length > 0 ? known.join(' · ') : UNKNOWN_DEVICE_NAME;
}

export function toPushDevice(
  response: PushDeviceResponse,
  currentEndpoint: string | null
): PushDevice {
  return {
    id: response.id,
    endpoint: response.endpoint,
    name: toDeviceName(response.userAgent),
    registeredAt: formatKstDate(response.createdAt),
    isCurrent:
      currentEndpoint !== null && response.endpoint === currentEndpoint,
  };
}

/** 브라우저 PushSubscription.toJSON() → 등록 요청. 키가 빠졌으면 null(브라우저 이상 — 등록하지 않음) */
export function toPushSubscribeRequest(
  subscription: PushSubscriptionJSON,
  userAgent: string | null
): PushSubscribeRequest | null {
  const { endpoint, keys } = subscription;
  if (!endpoint || !keys?.p256dh || !keys.auth) return null;
  return {
    endpoint,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
    userAgent: userAgent ? userAgent.slice(0, 200) : null,
  };
}
