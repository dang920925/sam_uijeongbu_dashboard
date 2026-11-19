// ----------------------------------------------------------------------
// 업로드 실패 → 사용자 문구(develop §3.1 UPL_001·002·004). 에러 코드만 단독 노출하지 않는다(§4.6).
// ----------------------------------------------------------------------
import { UploadValidationError } from '@/src/api/upload-mapper';
import { ApiError } from '@/src/lib/api-client';
import { MSG_UPLOAD } from '@/src/shared/messages/common';

export function toUploadErrorMessage(error: unknown): string {
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
