import { describe, expect, it } from 'vitest';

import { toAccountUpdateRequest } from '@/src/api/account-mapper';

describe('toAccountUpdateRequest', () => {
  it('새 아이디의 앞뒤 공백을 떼고 새 비밀번호를 그대로 보낸다', () => {
    // Arrange
    const input = {
      currentPassword: ' current pw ',
      newUsername: '  fixture-r1-w4-admin ',
      newPassword: 'fixture-r1-w4-new-password',
    };

    // Act
    const request = toAccountUpdateRequest(input);

    // Assert
    expect(request).toEqual({
      currentPassword: ' current pw ',
      newUsername: 'fixture-r1-w4-admin',
      newPassword: 'fixture-r1-w4-new-password',
    });
  });

  it('새 비밀번호가 빈 칸이면 null(비밀번호 유지)로 보낸다', () => {
    // Arrange
    const input = {
      currentPassword: 'pw',
      newUsername: 'fixture-r1-w4-admin',
      newPassword: '',
    };

    // Act
    const request = toAccountUpdateRequest(input);

    // Assert
    expect(request.newPassword).toBeNull();
  });
});
