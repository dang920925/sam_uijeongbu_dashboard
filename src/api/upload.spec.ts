// ----------------------------------------------------------------------
// uploadImage(FN-18) 요청 함수 — 압축(목) → 사전 검사 → POST /admin/uploads(서버 CreateUploadRequestDto 모양) →
// 서명 URL PUT → publicUrl. 전송(api-client)은 목으로 바꾸고 순서·인자·실패 전달만 본다.
// 응답 모양 출처: server src/admin/uploads/dto/create-upload-response.dto.ts
// ----------------------------------------------------------------------
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '@/src/api/endpoints';
import { uploadImage, uploadImageWithCompress } from '@/src/api/upload';
import { UploadValidationError } from '@/src/api/upload-mapper';
import { ApiError, apiPost, uploadToSignedUrl } from '@/src/lib/api-client';
import { prepareImageForUpload } from '@/src/lib/image-compress';
import { ImageDecodeError } from '@/src/lib/image-decode-error';
import type { UploadCreateResponse } from '@/src/types/upload';

vi.mock('@/src/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/src/lib/api-client')>();
  return { ...actual, apiPost: vi.fn(), uploadToSignedUrl: vi.fn() };
});

vi.mock('@/src/lib/image-compress', () => ({
  prepareImageForUpload: vi.fn(),
}));

const mockedPost = vi.mocked(apiPost);
const mockedPrepare = vi.mocked(prepareImageForUpload);
const mockedPut = vi.mocked(uploadToSignedUrl);

const TICKET: UploadCreateResponse = {
  path: 'gallery/2026/11/0190f000-0000-7000-8000-000000000001.png',
  token: '1795071315.signature',
  signedUrl:
    'http://localhost:4204/api/v1/local-storage/upload/gallery/2026/11/0190f000-0000-7000-8000-000000000001.png?token=1795071315.signature',
  publicUrl:
    'http://localhost:4204/api/v1/local-storage/public/gallery/2026/11/0190f000-0000-7000-8000-000000000001.png',
  expiresAt: '2026-11-19T06:55:15.000Z',
};

const MB = 1024 * 1024;

function fileOf(type: string, size: number): File {
  const file = new File(['x'], 'fixture.png', { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('uploadImage', () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedPut.mockReset();
    // 압축 단계는 원본 그대로 통과(건너뛰기 경로) — 아래는 발급·PUT 순서와 사전 검사만 본다
    mockedPrepare.mockReset();
    mockedPrepare.mockImplementation(async (_purpose, file) => ({
      file,
      originalSize: null,
    }));
  });

  it('서명 URL 을 받아 파일을 PUT 하고 공개 URL 을 돌려준다', async () => {
    // Arrange
    mockedPost.mockResolvedValue(TICKET);
    mockedPut.mockResolvedValue(undefined);
    const file = fileOf('image/png', 2 * MB);
    const onProgress = vi.fn();
    // Act
    const url = await uploadImage('GALLERY', file, onProgress);
    // Assert
    expect(url).toBe(TICKET.publicUrl);
    expect(mockedPost).toHaveBeenCalledWith(endpoints.uploads.create, {
      purpose: 'GALLERY',
      contentType: 'image/png',
      size: 2 * MB,
    });
    expect(mockedPut).toHaveBeenCalledWith(TICKET.signedUrl, file, onProgress);
  });

  it('크기 상한과 같은 파일(포스터 5MB)은 그대로 발급을 요청한다', async () => {
    // Arrange
    mockedPost.mockResolvedValue(TICKET);
    mockedPut.mockResolvedValue(undefined);
    // Act
    await uploadImage('PERFORMANCE_POSTER', fileOf('image/jpeg', 5 * MB));
    // Assert
    expect(mockedPost).toHaveBeenCalledTimes(1);
  });

  it('svg 는 서버를 부르지 않고 UPL_001 로 거른다', async () => {
    // Act
    const result = uploadImage('GALLERY', fileOf('image/svg+xml', 10));
    // Assert
    await expect(result).rejects.toMatchObject({ code: 'UPL_001' });
    await expect(result).rejects.toBeInstanceOf(UploadValidationError);
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('포스터 6MB 는 서버를 부르지 않고 UPL_002 로 거른다', async () => {
    // Act
    const result = uploadImage(
      'PERFORMANCE_POSTER',
      fileOf('image/png', 6 * MB)
    );
    // Assert
    await expect(result).rejects.toMatchObject({ code: 'UPL_002' });
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('발급 실패(서버 UPL_004)는 PUT 하지 않고 그대로 던진다', async () => {
    // Arrange
    const failure = new ApiError(500, {
      statusCode: 500,
      status: 'INTERNAL_SERVER_ERROR',
      message: '이미지 업로드 URL 을 만들지 못했습니다.',
      code: 'UPL_004',
      timestamp: '2026-11-19T04:55:15.000Z',
      path: '/api/v1/admin/uploads',
    });
    mockedPost.mockRejectedValue(failure);
    // Act
    const result = uploadImage('GALLERY', fileOf('image/png', 100));
    // Assert
    await expect(result).rejects.toBe(failure);
    expect(mockedPut).not.toHaveBeenCalled();
  });

  it('서명 URL PUT 실패(네트워크·CORS 는 status 0)는 그대로 던진다', async () => {
    // Arrange
    mockedPost.mockResolvedValue(TICKET);
    mockedPut.mockRejectedValue(new ApiError(0, null));
    // Act
    const result = uploadImage('POPUP', fileOf('image/webp', 100));
    // Assert
    await expect(result).rejects.toMatchObject({ status: 0 });
  });
});

describe('uploadImageWithCompress', () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedPut.mockReset();
    mockedPrepare.mockReset();
  });

  it('줄인 파일로 발급·PUT 하고 원본·결과 크기를 돌려준다', async () => {
    // Arrange
    const original = fileOf('image/jpeg', 15 * MB);
    const compressed = fileOf('image/jpeg', 2 * MB);
    mockedPrepare.mockResolvedValue({
      file: compressed,
      originalSize: 15 * MB,
    });
    mockedPost.mockResolvedValue(TICKET);
    mockedPut.mockResolvedValue(undefined);
    const onPrepared = vi.fn();
    // Act
    const result = await uploadImageWithCompress(
      'PERFORMANCE_POSTER',
      original,
      { onPrepared }
    );
    // Assert
    expect(mockedPrepare).toHaveBeenCalledWith('PERFORMANCE_POSTER', original);
    expect(onPrepared).toHaveBeenCalledTimes(1);
    expect(mockedPost).toHaveBeenCalledWith(endpoints.uploads.create, {
      purpose: 'PERFORMANCE_POSTER',
      contentType: 'image/jpeg',
      size: 2 * MB,
    });
    expect(mockedPut).toHaveBeenCalledWith(
      TICKET.signedUrl,
      compressed,
      undefined
    );
    expect(result).toEqual({
      url: TICKET.publicUrl,
      originalSize: 15 * MB,
      uploadedSize: 2 * MB,
    });
  });

  it('압축 단계가 실패(디코드 불가)하면 서버를 부르지 않고 그대로 던진다', async () => {
    // Arrange
    mockedPrepare.mockRejectedValue(new ImageDecodeError());
    // Act
    const result = uploadImageWithCompress(
      'GALLERY',
      fileOf('image/heic', 3 * MB)
    );
    // Assert
    await expect(result).rejects.toBeInstanceOf(ImageDecodeError);
    expect(mockedPost).not.toHaveBeenCalled();
  });
});
