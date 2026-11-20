// ----------------------------------------------------------------------
// 업로드 요청 매퍼·사전 검사(FN-18). 파일명은 보내지 않는다(경로는 서버가 무작위로 정함).
// 검사 실패는 UploadValidationError(code = 서버 오류 코드와 같은 UPL_001·UPL_002).
// ----------------------------------------------------------------------
import {
  UPLOAD_CONTENT_TYPES,
  UPLOAD_MAX_BYTES,
  type UploadContentType,
  type UploadPurpose,
} from '@/src/types/codes';
import type { UploadCreateRequest } from '@/src/types/upload';

export type UploadValidationCode = 'UPL_001' | 'UPL_002';

export class UploadValidationError extends Error {
  readonly code: UploadValidationCode;
  constructor(code: UploadValidationCode) {
    super(code);
    this.name = 'UploadValidationError';
    this.code = code;
  }
}

function isAllowedType(type: string): type is UploadContentType {
  return (UPLOAD_CONTENT_TYPES as readonly string[]).includes(type);
}

export function validateUploadFile(
  purpose: UploadPurpose,
  file: { type: string; size: number }
): UploadValidationCode | null {
  if (!isAllowedType(file.type)) return 'UPL_001';
  if (file.size > UPLOAD_MAX_BYTES[purpose]) return 'UPL_002';
  return null;
}

export function toUploadCreateRequest(
  purpose: UploadPurpose,
  file: { type: string; size: number }
): UploadCreateRequest {
  const invalid = validateUploadFile(purpose, file);
  if (invalid) throw new UploadValidationError(invalid);
  return {
    purpose,
    contentType: file.type as UploadContentType,
    size: file.size,
  };
}
