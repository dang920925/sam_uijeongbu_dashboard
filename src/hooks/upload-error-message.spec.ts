import { describe, expect, it } from 'vitest';

import { UploadValidationError } from '@/src/api/upload-mapper';
import { toUploadErrorMessage } from '@/src/hooks/upload-error-message';
import { ApiError } from '@/src/lib/api-client';

describe('toUploadErrorMessage', () => {
  it('사전 검사 UPL_001·UPL_002 를 계약 문구로 바꾼다', () => {
    expect(toUploadErrorMessage(new UploadValidationError('UPL_001'))).toBe(
      '지원하지 않는 파일 형식입니다.'
    );
    expect(toUploadErrorMessage(new UploadValidationError('UPL_002'))).toBe(
      '파일 크기가 초과되었습니다.'
    );
  });

  it('서버 오류 코드도 같은 문구로, 그 밖의 실패는 UPL_004 문구로 바꾼다', () => {
    const serverError = new ApiError(400, {
      statusCode: 400,
      status: 'Bad Request',
      message: '파일 크기가 초과되었습니다.',
      code: 'UPL_002',
      timestamp: '',
      path: '/api/v1/admin/uploads',
    });
    expect(toUploadErrorMessage(serverError)).toBe(
      '파일 크기가 초과되었습니다.'
    );
    expect(toUploadErrorMessage(new ApiError(0, null))).toBe(
      '파일 업로드에 실패했습니다. 다시 시도해주세요.'
    );
  });
});
