// ----------------------------------------------------------------------
// 1층 전송 래퍼 — 유일한 fetch/XHR 호출 지점(가이드 A6.1).
// - 브라우저는 BFF(`/api/backend/v1/...`, `/api/auth/...`)만 부른다. 토큰은 httpOnly 쿠키라 JS 가 모른다.
// - 실패는 ApiError(status, payload) 로 던지고, 401/403 전역 처리는 QueryProvider 가 한다.
// - 서명 URL 업로드는 진행률이 필요해 XHR 로 PUT 한다(storage-js uploadToSignedUrl 과 같은 요청 형식:
//   PUT {signedUrl} · x-upsert:false · content-type = 파일 형식 · 본문 = 파일). 실제 Supabase 동작은 integration 확인.
// ----------------------------------------------------------------------
import type { ApiErrorResponse } from '@/src/types/common';

export class ApiError extends Error {
  readonly status: number;
  readonly payload: ApiErrorResponse | null;
  /**
   * 오류 코드 — 보통 payload.code. BFF 503 COMMON_005 는 화면 문구용 payload 를 비우지만(U13)
   * 재시도 규칙이 알아볼 수 있게 code 는 남긴다(qa2 QA2-007).
   */
  readonly code: string | undefined;

  constructor(
    status: number,
    payload: ApiErrorResponse | null,
    code: string | undefined = payload?.code
  ) {
    super(payload?.message ?? `요청에 실패했습니다. (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
    this.code = code;
  }
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as { message: unknown }).message === 'string'
  );
}

/** BFF 가 서버에 닿지 못했을 때 만드는 오류 코드(qa1 U13 — develop §3.1 "BFF 서버 연결 실패") */
const BFF_UNAVAILABLE_CODE = 'COMMON_005';

/**
 * 실패 응답 → ApiError. 본문이 없거나 계약 모양이 아니면 payload null.
 * BFF 의 503 COMMON_005(서버 연결 실패)는 payload 를 비우고 code 만 남긴다 — 화면은 그 message 를 보이지 않고
 * 본문 없는 실패와 같은 기존 문구(다시 시도·"오류가 발생했습니다." 등)를 쓰며(U13), 재시도 규칙은 code 로 판단한다.
 */
async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    return new ApiError(response.status, null);
  }
  if (!isApiErrorResponse(body)) return new ApiError(response.status, null);
  return response.status === 503 && body.code === BFF_UNAVAILABLE_CODE
    ? new ApiError(503, null, BFF_UNAVAILABLE_CODE)
    : new ApiError(response.status, body);
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: 'same-origin',
    headers: { accept: 'application/json', ...init?.headers },
  });
  if (!response.ok) throw await toApiError(response);
  const text = await response.text(); // 204 No Content 대응
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

function apiSend<T>(method: string, input: string, body?: unknown): Promise<T> {
  return apiFetch<T>(input, {
    method,
    headers:
      body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiPost<T>(input: string, body?: unknown): Promise<T> {
  return apiSend<T>('POST', input, body);
}
export function apiPatch<T>(input: string, body: unknown): Promise<T> {
  return apiSend<T>('PATCH', input, body);
}
export function apiPut<T>(input: string, body: unknown): Promise<T> {
  return apiSend<T>('PUT', input, body);
}
export function apiDelete<T = void>(input: string): Promise<T> {
  return apiSend<T>('DELETE', input);
}

/** 쿼리 문자열 — undefined·null·'' 는 뺀다 */
export function withQuery(path: string, query?: object): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** 서명 URL 로 파일 직접 업로드(FN-18). onProgress 는 0~100. */
export function uploadToSignedUrl(
  signedUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('content-type', file.type);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new ApiError(xhr.status, null));
    };
    xhr.onerror = () => reject(new ApiError(0, null));
    xhr.send(file);
  });
}
