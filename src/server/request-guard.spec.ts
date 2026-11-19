// @vitest-environment node
import { checkStateChangingRequest } from '@/src/server/request-guard';

const APP = 'http://localhost:4230';
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

describe('checkStateChangingRequest', () => {
  it('같은 출처의 JSON POST·본문 없는 POST·GET 은 통과한다', () => {
    // Arrange
    const sameOrigin = new Headers({
      ...JSON_HEADERS,
      origin: APP,
      'sec-fetch-site': 'same-origin',
    });
    const noBody = new Headers({
      origin: APP,
      'sec-fetch-site': 'same-origin',
    });

    // Act · Assert
    expect(checkStateChangingRequest('POST', sameOrigin, APP, true)).toBeNull();
    expect(checkStateChangingRequest('POST', noBody, APP, false)).toBeNull();
    expect(
      checkStateChangingRequest(
        'GET',
        new Headers({ origin: 'https://evil.example' }),
        APP,
        false
      )
    ).toBeNull();
  });

  it('Origin·Sec-Fetch-Site 가 없는 서버 간 호출은 JSON 이면 통과한다', () => {
    // Arrange
    const headers = new Headers(JSON_HEADERS);

    // Act
    const result = checkStateChangingRequest('PATCH', headers, APP, true);

    // Assert
    expect(result).toBeNull();
  });

  it('다른 출처 Origin 이나 cross-site·same-site 요청은 거부한다', () => {
    // Arrange
    const otherOrigin = new Headers({
      ...JSON_HEADERS,
      origin: 'https://evil.example',
    });
    const crossSite = new Headers({
      ...JSON_HEADERS,
      'sec-fetch-site': 'cross-site',
    });
    const sameSite = new Headers({
      ...JSON_HEADERS,
      'sec-fetch-site': 'same-site',
    });

    // Act · Assert
    expect(checkStateChangingRequest('POST', otherOrigin, APP, true)).toBe(
      'cross-site'
    );
    expect(checkStateChangingRequest('DELETE', crossSite, APP, false)).toBe(
      'cross-site'
    );
    expect(checkStateChangingRequest('POST', sameSite, APP, true)).toBe(
      'cross-site'
    );
  });

  it('본문이 있는데 JSON 이 아니면(폼 전송·타입 없음) 거부한다', () => {
    // Arrange
    const form = new Headers({
      origin: APP,
      'content-type': 'application/x-www-form-urlencoded',
    });
    const none = new Headers({ origin: APP });

    // Act · Assert
    expect(checkStateChangingRequest('POST', form, APP, true)).toBe('not-json');
    expect(checkStateChangingRequest('PUT', none, APP, true)).toBe('not-json');
  });
});
