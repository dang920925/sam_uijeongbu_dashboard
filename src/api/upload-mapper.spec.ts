import { describe, expect, it } from 'vitest';

import {
  toUploadCreateRequest,
  UploadValidationError,
  validateUploadFile,
} from '@/src/api/upload-mapper';

const MB = 1024 * 1024;

describe('upload-mapper', () => {
  it('허용 형식·크기의 파일을 업로드 요청 바디로 매핑한다', () => {
    // Arrange
    const file = { type: 'image/png', size: 2 * MB };
    // Act
    const request = toUploadCreateRequest('PERFORMANCE_POSTER', file);
    // Assert
    expect(request).toEqual({
      purpose: 'PERFORMANCE_POSTER',
      contentType: 'image/png',
      size: 2 * MB,
    });
  });

  it('svg 는 UPL_001 로 거른다', () => {
    expect(
      validateUploadFile('GALLERY', { type: 'image/svg+xml', size: 10 })
    ).toBe('UPL_001');
  });

  it('포스터 6MB 는 UPL_002, 상세 이미지 6MB 는 통과한다', () => {
    expect(
      validateUploadFile('PERFORMANCE_POSTER', {
        type: 'image/jpeg',
        size: 6 * MB,
      })
    ).toBe('UPL_002');
    expect(
      validateUploadFile('PERFORMANCE_DETAIL', {
        type: 'image/jpeg',
        size: 6 * MB,
      })
    ).toBeNull();
  });

  it('검사에 실패하면 코드가 담긴 UploadValidationError 를 던진다', () => {
    // Act
    const act = () =>
      toUploadCreateRequest('POPUP', { type: 'image/gif', size: 1 });
    // Assert
    expect(act).toThrow(UploadValidationError);
    try {
      act();
    } catch (e: unknown) {
      expect(e instanceof UploadValidationError && e.code).toBe('UPL_001');
    }
  });
});
