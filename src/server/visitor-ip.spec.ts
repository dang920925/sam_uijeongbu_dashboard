// @vitest-environment node
import { visitorIpOf } from '@/src/server/visitor-ip';

describe('visitorIpOf', () => {
  it('x-vercel-forwarded-for 를 가장 먼저 쓴다', () => {
    // Arrange
    const headers = new Headers({
      'x-vercel-forwarded-for': '203.0.113.7',
      'x-real-ip': '198.51.100.1',
      'x-forwarded-for': '192.0.2.1',
    });

    // Act
    const ip = visitorIpOf(headers);

    // Assert
    expect(ip).toBe('203.0.113.7');
  });

  it('없으면 x-real-ip, 그것도 없으면 x-forwarded-for 의 첫 값을 쓴다', () => {
    // Arrange
    const realIp = new Headers({ 'x-real-ip': '198.51.100.1' });
    const forwarded = new Headers({
      'x-forwarded-for': ' 192.0.2.1 , 10.0.0.1',
    });

    // Act · Assert
    expect(visitorIpOf(realIp)).toBe('198.51.100.1');
    expect(visitorIpOf(forwarded)).toBe('192.0.2.1');
  });

  it('헤더가 없거나 비었거나 너무 길면 null 이다', () => {
    // Arrange
    const empty = new Headers();
    const blank = new Headers({ 'x-forwarded-for': ' , 10.0.0.1' });
    const tooLong = new Headers({ 'x-real-ip': 'a'.repeat(65) });

    // Act · Assert
    expect(visitorIpOf(empty)).toBeNull();
    expect(visitorIpOf(blank)).toBeNull();
    expect(visitorIpOf(tooLong)).toBeNull();
  });
});
