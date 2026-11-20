// ----------------------------------------------------------------------
// public/sw.js(U37) — 실제 파일을 가짜 self 위에서 실행해 확인한다.
// PU-6: fetch 를 가로채지 않고 캐시를 쓰지 않는다 · J-108: 서버 본문 그대로 · PU-5: 클릭 → 그 주소로 이동.
// ----------------------------------------------------------------------
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const SOURCE = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8');
const ORIGIN = 'https://admin.test.example';

type Listener = (event: Record<string, unknown>) => void;

function loadWorker() {
  const listeners = new Map<string, Listener>();
  const showNotification = vi.fn().mockResolvedValue(undefined);
  const setAppBadge = vi.fn().mockResolvedValue(undefined);
  const clearAppBadge = vi.fn().mockResolvedValue(undefined);
  const windowClient = {
    url: `${ORIGIN}/account`,
    focus: vi.fn().mockResolvedValue(undefined),
    navigate: vi.fn().mockResolvedValue(undefined),
  };
  const clients = {
    claim: vi.fn().mockResolvedValue(undefined),
    matchAll: vi.fn().mockResolvedValue([windowClient]),
    openWindow: vi.fn().mockResolvedValue(undefined),
  };
  const self = {
    location: { origin: ORIGIN },
    registration: { showNotification, setAppBadge, clearAppBadge },
    clients,
    skipWaiting: vi.fn(),
    addEventListener: (type: string, listener: Listener) =>
      listeners.set(type, listener),
  };
  new Function('self', SOURCE)(self);
  return {
    listeners,
    showNotification,
    setAppBadge,
    clearAppBadge,
    registration: self.registration as Record<string, unknown>,
    clients,
    windowClient,
  };
}

/** 이벤트를 보내고 waitUntil 에 넘긴 약속까지 기다린다 */
async function dispatch(listener: Listener, event: Record<string, unknown>) {
  let pending: Promise<unknown> = Promise.resolve();
  listener({
    ...event,
    waitUntil: (promise: Promise<unknown>) => {
      pending = promise;
    },
  });
  await pending;
}

describe('public/sw.js', () => {
  let worker: ReturnType<typeof loadWorker>;

  beforeEach(() => {
    worker = loadWorker();
  });

  it('push·notificationclick·install·activate 만 듣고 fetch 는 듣지 않는다(PU-6)', () => {
    expect([...worker.listeners.keys()].sort()).toEqual([
      'activate',
      'install',
      'notificationclick',
      'push',
    ]);
    expect(SOURCE).not.toMatch(
      /caches\.|CacheStorage|addEventListener\('fetch'/
    );
  });

  it('push 본문의 제목·내용을 그대로 띄우고 클릭 주소를 같은 출처로 담는다', async () => {
    await dispatch(worker.listeners.get('push')!, {
      data: {
        json: () => ({
          title: '새 예매',
          body: 'Dear 12/12 14:00 · 2매 (입금 대기)',
          url: '/reservations?performanceId=p1&q=0420',
        }),
      },
    });

    expect(worker.showNotification).toHaveBeenCalledWith('새 예매', {
      body: 'Dear 12/12 14:00 · 2매 (입금 대기)',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      lang: 'ko',
      data: { url: `${ORIGIN}/reservations?performanceId=p1&q=0420` },
    });
  });

  it('본문이 없거나 깨졌으면 기본 제목, 다른 사이트 주소는 첫 화면으로 바꾼다', async () => {
    await dispatch(worker.listeners.get('push')!, {
      data: { json: () => ({ url: '//evil.test.example/x' }) },
    });
    await dispatch(worker.listeners.get('push')!, {
      data: {
        json: () => {
          throw new SyntaxError('bad');
        },
      },
    });

    expect(worker.showNotification).toHaveBeenNthCalledWith(
      1,
      'SAM 의정부 관리',
      expect.objectContaining({ body: '', data: { url: `${ORIGIN}/` } })
    );
    expect(worker.showNotification).toHaveBeenCalledTimes(2);
  });

  it('(U40) badgeCount 가 1 이상이면 setAppBadge(n), 0 이면 clearAppBadge 를 부른다', async () => {
    const push = (payload: Record<string, unknown>) =>
      dispatch(worker.listeners.get('push')!, {
        data: { json: () => ({ title: '새 예매', ...payload }) },
      });

    await push({ badgeCount: 3 });
    await push({ badgeCount: 0 });

    expect(worker.setAppBadge).toHaveBeenCalledWith(3);
    expect(worker.clearAppBadge).toHaveBeenCalledTimes(1);
    expect(worker.showNotification).toHaveBeenCalledTimes(2);
  });

  it('(U40) badgeCount 가 없으면(시험 알림) 배지를 건드리지 않는다', async () => {
    await dispatch(worker.listeners.get('push')!, {
      data: { json: () => ({ title: '시험 알림', url: '/account' }) },
    });

    expect(worker.setAppBadge).not.toHaveBeenCalled();
    expect(worker.clearAppBadge).not.toHaveBeenCalled();
  });

  it('(U40) Badging API 가 없거나 거부돼도 알림은 뜨고 오류를 내지 않는다', async () => {
    delete worker.registration.setAppBadge;
    await dispatch(worker.listeners.get('push')!, {
      data: { json: () => ({ title: '새 예매', badgeCount: 2 }) },
    });
    worker.clearAppBadge.mockRejectedValueOnce(new TypeError('x'));
    await dispatch(worker.listeners.get('push')!, {
      data: { json: () => ({ title: '새 예매', badgeCount: 0 }) },
    });

    expect(worker.showNotification).toHaveBeenCalledTimes(2);
  });

  it('클릭하면 알림을 닫고 열린 대시보드 창을 그 예매 주소로 옮긴다(PU-5)', async () => {
    const close = vi.fn();
    const url = `${ORIGIN}/reservations?performanceId=p1&q=0420`;

    await dispatch(worker.listeners.get('notificationclick')!, {
      notification: { close, data: { url } },
    });

    expect(close).toHaveBeenCalled();
    expect(worker.windowClient.focus).toHaveBeenCalled();
    expect(worker.windowClient.navigate).toHaveBeenCalledWith(url);
    expect(worker.clients.openWindow).not.toHaveBeenCalled();
  });

  it('열린 창이 없거나 이동이 막히면 새 창으로 연다', async () => {
    const url = `${ORIGIN}/reservations?performanceId=p1&q=0420`;
    worker.windowClient.navigate.mockRejectedValueOnce(new TypeError('x'));

    await dispatch(worker.listeners.get('notificationclick')!, {
      notification: { close: vi.fn(), data: { url } },
    });
    worker.clients.matchAll.mockResolvedValueOnce([]);
    await dispatch(worker.listeners.get('notificationclick')!, {
      notification: {
        close: vi.fn(),
        data: { url: 'https://evil.test.example/' },
      },
    });

    expect(worker.clients.openWindow).toHaveBeenNthCalledWith(1, url);
    expect(worker.clients.openWindow).toHaveBeenNthCalledWith(2, `${ORIGIN}/`);
  });
});
