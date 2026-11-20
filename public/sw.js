// ----------------------------------------------------------------------
// SAM 의정부 관리 — 서비스 워커(U37, develop §21).
// 하는 일은 둘뿐이다: ① push → 알림 띄우기(+ U40 앱 아이콘 배지) ② 알림 클릭 → 대시보드 그 화면 열기.
// fetch 를 가로채지 않고 캐시도 쓰지 않는다(J-109, PU-6) — 오프라인이면 브라우저 기본 오류가 그대로 보인다
// (입장 체크가 오프라인에서도 되는 것처럼 오해하지 않게).
// 알림 내용은 서버가 만든 { title, body, url } 그대로 — 이름·연락처는 서버가 넣지 않는다(J-108).
// (U40) payload 의 badgeCount(입금 대기 예매 수)가 숫자면 n > 0 → setAppBadge(n), 0 → clearAppBadge.
//   값이 없으면(시험 알림) 배지를 건드리지 않는다. 지원하지 않거나 거부되면 조용히 넘어간다(알림은 그대로).
// ----------------------------------------------------------------------
const DEFAULT_TITLE = 'SAM 의정부 관리';
const ICON = '/icons/icon-192.png';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/** 같은 출처의 경로만 연다(다른 사이트로 보내지 않게). 그 밖은 대시보드 첫 화면 */
function toSameOriginUrl(path) {
  const safe = typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
  return new URL(safe ? path : '/', self.location.origin).href;
}

function readPayload(event) {
  try {
    const data = event.data ? event.data.json() : {};
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

/** 앱 아이콘 배지 — 실패해도 알림을 막지 않는다 */
async function syncAppBadge(count) {
  if (typeof count !== 'number' || !Number.isFinite(count)) return;
  const registration = self.registration;
  try {
    const n = Math.max(0, Math.floor(count));
    if (n > 0) await registration.setAppBadge?.(n);
    else await registration.clearAppBadge?.();
  } catch {
    // 지원 안 함·권한 없음
  }
}

self.addEventListener('push', (event) => {
  const data = readPayload(event);
  const title = typeof data.title === 'string' && data.title ? data.title : DEFAULT_TITLE;
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body: typeof data.body === 'string' ? data.body : '',
        icon: ICON,
        badge: ICON,
        lang: 'ko',
        data: { url: toSameOriginUrl(data.url) },
      }),
      syncAppBadge(data.badgeCount),
    ])
  );
});

/** 알림에 담아 둔 주소 — 같은 출처가 아니면 첫 화면 */
function readClickUrl(notification) {
  try {
    const url = new URL(notification.data && notification.data.url, self.location.origin);
    return url.origin === self.location.origin ? url.href : toSameOriginUrl('/');
  } catch {
    return toSameOriginUrl('/');
  }
}

/** 열린 대시보드 창이 있으면 그 창을 앞으로 가져와 이동, 없거나 이동이 막히면 새 창 */
async function openDashboard(url) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const opened = windows.find((client) => new URL(client.url).origin === self.location.origin);
  if (opened) {
    try {
      await opened.focus();
      await opened.navigate(url);
      return;
    } catch {
      // 이 서비스 워커가 아직 그 창을 맡지 않았으면 navigate 가 거부된다 → 새 창
    }
  }
  await self.clients.openWindow(url);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(openDashboard(readClickUrl(event.notification)));
});
