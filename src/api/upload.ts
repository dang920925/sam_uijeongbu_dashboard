// ----------------------------------------------------------------------
// 이미지 업로드(FN-18) — ⓪ 브라우저에서 축소·압축(W5, src/lib/image-compress — 서명 URL 요청 전)
// ① POST /admin/uploads 로 서명 URL 발급 ② 브라우저가 Storage 로 직접 PUT
// ③ publicUrl 을 돌려준다(화면은 이 URL 을 해당 리소스 저장 요청에 넣는다). Vercel 4.5MB 본문 한도 회피.
// 형식·크기는 서버도 검사하지만(UPL_001·002) 같은 기준으로 먼저 걸러 즉시 알린다.
// 압축 안내("15.2MB → 2.1MB로 …")가 필요한 화면은 uploadImageWithCompress 로 원본·결과 크기를 받는다.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import { toUploadCreateRequest } from '@/src/api/upload-mapper';
import { apiPost, uploadToSignedUrl } from '@/src/lib/api-client';
import {
  prepareImageForUpload,
  type PreparedUpload,
} from '@/src/lib/image-compress';
import type { UploadPurpose } from '@/src/types/codes';
import type { UploadCreateResponse } from '@/src/types/upload';

export interface CompressedUploadResult {
  url: string;
  /** 압축했으면 원본 바이트 수, 원본 그대로면 null */
  originalSize: number | null;
  /** 실제로 올린 바이트 수 */
  uploadedSize: number;
  /** (U51) 올린 파일의 가로·세로 px — 모르면 null */
  width: number | null;
  height: number | null;
}

async function sendImage(
  purpose: UploadPurpose,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const request = toUploadCreateRequest(purpose, file);
  const ticket = await apiPost<UploadCreateResponse>(
    endpoints.uploads.create,
    request
  );
  await uploadToSignedUrl(ticket.signedUrl, file, onProgress);
  return ticket.publicUrl;
}

/** 축소·압축 → 발급 → PUT. onPrepared 는 압축이 끝나 전송을 시작할 때 한 번 */
export async function uploadImageWithCompress(
  purpose: UploadPurpose,
  file: File,
  handlers: {
    onPrepared?: (prepared: PreparedUpload) => void;
    onProgress?: (percent: number) => void;
  } = {}
): Promise<CompressedUploadResult> {
  const prepared = await prepareImageForUpload(purpose, file);
  handlers.onPrepared?.(prepared);
  const url = await sendImage(purpose, prepared.file, handlers.onProgress);
  return {
    url,
    originalSize: prepared.originalSize,
    uploadedSize: prepared.file.size,
    width: prepared.width,
    height: prepared.height,
  };
}

/** 공개 URL 만 필요한 호출(갤러리 등) — 압축은 같이 한다 */
export async function uploadImage(
  purpose: UploadPurpose,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const result = await uploadImageWithCompress(purpose, file, { onProgress });
  return result.url;
}
