// ----------------------------------------------------------------------
// prepareImageForUpload — jsdom 에는 createImageBitmap 이 없으므로 입력 검사와 "열 수 없음" 분기만 본다.
// 실제 축소·인코딩은 e2e-pw/upload-compress.spec.ts(Chromium)가 확인한다.
// ----------------------------------------------------------------------
import { describe, expect, it } from 'vitest';

import { UploadValidationError } from '@/src/api/upload-mapper';
import { prepareImageForUpload } from '@/src/lib/image-compress';
import { ImageDecodeError } from '@/src/lib/image-decode-error';

const MB = 1024 * 1024;

function fileOf(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('prepareImageForUpload', () => {
  it('허용 밖 형식(gif)은 UPL_001 로 거른다', async () => {
    // Act
    const result = prepareImageForUpload(
      'GALLERY',
      fileOf('a.gif', 'image/gif', 1 * MB)
    );
    // Assert
    await expect(result).rejects.toMatchObject({ code: 'UPL_001' });
  });

  it('입력 상한 50MB 를 넘으면 열지 않고 UPL_002 로 거른다', async () => {
    // Act
    const result = prepareImageForUpload(
      'GALLERY',
      fileOf('a.jpg', 'image/jpeg', 51 * MB)
    );
    // Assert
    await expect(result).rejects.toBeInstanceOf(UploadValidationError);
    await expect(result).rejects.toMatchObject({ code: 'UPL_002' });
  });

  it('열 수 없어도 허용 형식·한도 안이면 원본을 그대로 돌려준다', async () => {
    // Arrange
    const file = fileOf('a.png', 'image/png', 1 * MB);
    // Act
    const prepared = await prepareImageForUpload('POPUP', file);
    // Assert
    expect(prepared).toEqual({
      file,
      originalSize: null,
      width: null,
      height: null,
    });
  });

  it('열 수 없는 HEIC(확장자만 있어도)·한도 초과 원본은 ImageDecodeError 를 던진다', async () => {
    await expect(
      prepareImageForUpload('POPUP', fileOf('a.HEIC', '', 3 * MB))
    ).rejects.toBeInstanceOf(ImageDecodeError);
    await expect(
      prepareImageForUpload('POPUP', fileOf('a.jpg', 'image/jpeg', 15 * MB))
    ).rejects.toBeInstanceOf(ImageDecodeError);
  });
});
