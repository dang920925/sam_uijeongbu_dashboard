// ----------------------------------------------------------------------
// 업로드 실패 → 사용자 문구(develop §3.1 UPL_001·002·004 + 압축 단계 디코드 실패 W5). 에러 코드만 단독 노출하지 않는다(§4.6).
// ----------------------------------------------------------------------
import { UploadValidationError } from '@/src/api/upload-mapper';
import { ApiError } from '@/src/lib/api-client';
import { ImageDecodeError } from '@/src/lib/image-decode-error';
import { MSG_UPLOAD } from '@/src/shared/messages/common';

export function toUploadErrorMessage(error: unknown): string {
  if (error instanceof ImageDecodeError) return MSG_UPLOAD.DECODE_FAILED;
  const code =
    error instanceof UploadValidationError
      ? error.code
      : error instanceof ApiError
        ? error.code
        : undefined;
  if (code === 'UPL_001') return MSG_UPLOAD.TYPE_INVALID;
  if (code === 'UPL_002') return MSG_UPLOAD.SIZE_EXCEEDED;
  return MSG_UPLOAD.FAILED;
}

/**
 * "다시 시도"를 보일지 — 같은 파일로 다시 해도 결과가 같은 형식·크기 실패(UPL_001·002)엔 보이지 않는다
 * (§11.9 라벨 = 동작, designer §3.3 D03 "UPL_004(+ '다시 시도')" — qa1 QA1-024).
 */
export function canRetryUpload(message: string | null): boolean {
  return message === MSG_UPLOAD.FAILED;
}
