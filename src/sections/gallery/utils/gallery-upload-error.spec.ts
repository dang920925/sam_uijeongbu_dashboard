import { describe, expect, it } from 'vitest';

import { UploadValidationError } from '@/src/api/upload-mapper';
import { ApiError } from '@/src/lib/api-client';
import { toGalleryUploadErrorMessage } from '@/src/sections/gallery/utils/gallery-upload-error';

const apiError = (status: number, code: string) =>
  new ApiError(status, {
    statusCode: status,
    status: 'Bad Request',
    message: 'm',
    code,
    timestamp: '2026-11-19T00:00:00.000Z',
    path: '/api/v1/admin/uploads',
  });

describe('toGalleryUploadErrorMessage', () => {
  it('형식·크기 사전 검사 실패는 계약 문구로 알린다', () => {
    expect(
      toGalleryUploadErrorMessage(new UploadValidationError('UPL_001'))
    ).toBe('지원하지 않는 파일 형식입니다.');
    expect(toGalleryUploadErrorMessage(apiError(400, 'UPL_002'))).toBe(
      '파일 크기가 초과되었습니다.'
    );
  });

  it('전송·등록·네트워크 실패는 현행 업로드 실패 문구를 쓴다', () => {
    expect(toGalleryUploadErrorMessage(apiError(500, 'UPL_004'))).toBe(
      '업로드 중 오류가 발생했습니다'
    );
    expect(toGalleryUploadErrorMessage(apiError(400, 'UPL_003'))).toBe(
      '업로드 중 오류가 발생했습니다'
    );
    expect(toGalleryUploadErrorMessage(new Error('network'))).toBe(
      '업로드 중 오류가 발생했습니다'
    );
  });
});
