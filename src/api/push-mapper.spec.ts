import { describe, expect, it } from 'vitest';

import {
  toDeviceName,
  toPushDevice,
  toPushSubscribeRequest,
  UNKNOWN_DEVICE_NAME,
} from '@/src/api/push-mapper';

const UA = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  androidSamsung:
    'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
  macChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  windowsEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  linuxFirefox:
    'Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0',
};

describe('toDeviceName', () => {
  it('기기와 브라우저를 "기기 · 브라우저" 로 만든다', () => {
    expect(toDeviceName(UA.iphoneSafari)).toBe('iPhone · Safari');
    expect(toDeviceName(UA.androidSamsung)).toBe('Android · 삼성 인터넷');
    expect(toDeviceName(UA.macChrome)).toBe('Mac · Chrome');
    expect(toDeviceName(UA.windowsEdge)).toBe('Windows · Edge');
    expect(toDeviceName(UA.linuxFirefox)).toBe('Linux · Firefox');
  });

  it('값이 없거나 알 수 없으면 "알 수 없는 기기" 다', () => {
    expect(toDeviceName(null)).toBe(UNKNOWN_DEVICE_NAME);
    expect(toDeviceName('fixture-ua')).toBe(UNKNOWN_DEVICE_NAME);
  });
});

describe('toPushDevice', () => {
  const response = {
    id: 'd1',
    endpoint: 'https://fcm.googleapis.com/fcm/send/fixture-1',
    userAgent: UA.macChrome,
    createdAt: '2026-11-19T16:30:00.000Z',
    lastSuccessAt: null,
  };

  it('등록일을 KST 날짜로, 지금 구독과 같으면 이 기기로 표시한다', () => {
    expect(toPushDevice(response, response.endpoint)).toEqual({
      id: 'd1',
      endpoint: response.endpoint,
      name: 'Mac · Chrome',
      registeredAt: '2026.11.20',
      isCurrent: true,
    });
  });

  it('지금 구독이 없거나 다르면 이 기기가 아니다', () => {
    expect(toPushDevice(response, null).isCurrent).toBe(false);
    expect(toPushDevice(response, 'https://other.test.example').isCurrent).toBe(
      false
    );
  });
});

describe('toPushSubscribeRequest', () => {
  it('endpoint·keys 와 200자로 자른 userAgent 를 담는다', () => {
    expect(
      toPushSubscribeRequest(
        { endpoint: 'https://e', keys: { p256dh: 'p', auth: 'a' } },
        'u'.repeat(300)
      )
    ).toEqual({
      endpoint: 'https://e',
      keys: { p256dh: 'p', auth: 'a' },
      userAgent: 'u'.repeat(200),
    });
  });

  it('키가 빠진 구독은 null 이다', () => {
    expect(toPushSubscribeRequest({ endpoint: 'https://e' }, null)).toBeNull();
    expect(
      toPushSubscribeRequest({ keys: { p256dh: 'p', auth: 'a' } }, null)
    ).toBeNull();
  });
});
