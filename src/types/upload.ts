// 업로드(FN-18) — develop §3.4 `POST /admin/uploads` (서명 URL).
import type { UploadContentType, UploadPurpose } from '@/src/types/codes';

export interface UploadCreateRequest {
  purpose: UploadPurpose;
  contentType: UploadContentType;
  size: number;
}

export interface UploadCreateResponse {
  path: string;
  token: string;
  signedUrl: string;
  publicUrl: string;
  expiresAt: string;
}
