// ----------------------------------------------------------------------
// 갤러리 업로드 실패 → 업로드 카드 문구.
// - 형식·크기 사전 검사(UPL_001·002, 서버도 같은 코드)는 계약 문구로 무엇이 잘못됐는지 알린다(FN-18 수용 기준).
// - 브라우저가 열지 못한 이미지(ImageDecodeError)는 "JPG·PNG 로 저장해 다시" 안내.
// - 그 밖(서명 URL 발급·전송 실패 UPL_004, 등록 실패 UPL_003, 네트워크)은 현행 문구 Gallery.tsx:126.
// ----------------------------------------------------------------------
import { UploadValidationError } from '@/src/api/upload-mapper';
import { ApiError } from '@/src/lib/api-client';
import { ImageDecodeError } from '@/src/lib/image-decode-error';
import { MSG_UPLOAD } from '@/src/shared/messages/common';
import { MSG_D07 } from '@/src/shared/messages/d07';

export function toGalleryUploadErrorMessage(error: unknown): string {
  // 브라우저가 열지 못한 이미지(HEIC 등) — 업로드 전 압축(지휘자 항목 6) 안내
  if (error instanceof ImageDecodeError) return MSG_UPLOAD.DECODE_FAILED;
  const code =
    error instanceof UploadValidationError || error instanceof ApiError
      ? error.code
      : undefined;
  if (code === 'UPL_001') return MSG_UPLOAD.TYPE_INVALID;
  if (code === 'UPL_002') return MSG_UPLOAD.SIZE_EXCEEDED;
  return MSG_D07.UPLOAD_FAILED;
}
