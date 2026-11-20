// @vitest-environment node
import {
  readJwtExp,
  TOKEN_FALLBACK_TTL_MS,
  tokenExpiresAt,
} from '@/src/server/token-expiry';

function base64Url(value: string): string {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function jwtWith(payload: object): string {
  return [
    base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
    base64Url(JSON.stringify(payload)),
    'signature',
  ].join('.');
}

const NOW = new Date('2026-11-20T00:00:00.000Z');

describe('readJwtExp', () => {
  it('JWT payload 의 exp(초)를 읽는다', () => {
    // Arrange
    const token = jwtWith({ sub: 'admin', exp: 1_800_000_000 });

    // Act
    const exp = readJwtExp(token);

    // Assert
    expect(exp).toBe(1_800_000_000);
  });

  it('JWT 형식이 아니거나 exp 가 숫자가 아니면 null 이다', () => {
    // Arrange · Act · Assert
    expect(readJwtExp('3f0c1d2e-uuid-token')).toBeNull();
    expect(readJwtExp('a.%%%.c')).toBeNull();
    expect(readJwtExp(jwtWith({ sub: 'admin' }))).toBeNull();
    expect(readJwtExp(jwtWith({ exp: '1800000000' }))).toBeNull();
    expect(readJwtExp(`a.${base64Url('not json')}.c`)).toBeNull();
  });
});

describe('tokenExpiresAt', () => {
  it('exp 가 있으면 그 시각을 ISO 로 돌려준다', () => {
    // Arrange
    const token = jwtWith({ exp: 1_800_000_000 });

    // Act
    const expiresAt = tokenExpiresAt(token, NOW);

    // Assert
    expect(expiresAt).toBe(new Date(1_800_000_000_000).toISOString());
  });

  it('exp 를 못 읽으면 지금 + 7일이다', () => {
    // Arrange
    const token = 'opaque-token';

    // Act
    const expiresAt = tokenExpiresAt(token, NOW);

    // Assert
    expect(expiresAt).toBe(
      new Date(NOW.getTime() + TOKEN_FALLBACK_TTL_MS).toISOString()
    );
    expect(TOKEN_FALLBACK_TTL_MS).toBe(604_800_000);
  });
});
