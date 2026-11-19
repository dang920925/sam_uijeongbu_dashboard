// ----------------------------------------------------------------------
// 이미지 업로드(FN-18) — ① POST /admin/uploads 로 서명 URL 발급 ② 브라우저가 Storage 로 직접 PUT
// ③ publicUrl 을 돌려준다(화면은 이 URL 을 해당 리소스 저장 요청에 넣는다). Vercel 4.5MB 본문 한도 회피.
// 형식·크기는 서버도 검사하지만(UPL_001·002) 같은 기준으로 먼저 걸러 즉시 알린다.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import { toUploadCreateRequest } from '@/src/api/upload-mapper';
import { apiPost, uploadToSignedUrl } from '@/src/lib/api-client';
import type { UploadPurpose } from '@/src/types/codes';
import type { UploadCreateResponse } from '@/src/types/upload';

export async function uploadImage(
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
