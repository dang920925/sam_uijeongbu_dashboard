// ----------------------------------------------------------------------
// 목 업로드(FN-18) — POST /admin/uploads 가 서명 URL 을 발급하고, 브라우저는 그 URL 로 PUT 한다.
// 목에서는 서명 URL·공개 URL 이 BFF(`/api/backend/__mock-storage/...`)를 가리키고 바이트를 메모리에 둔다.
// 형식·크기 검사는 계약대로(UPL_001·UPL_002), 경로는 `{purpose 소문자}/{yyyy}/{mm}/{id}.{ext}`.
// ----------------------------------------------------------------------
import { randomUUID } from 'node:crypto';

import {
  apiError,
  json,
  MOCK_PUBLIC_PREFIX,
  newId,
  noContent,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { getStore } from '@/src/_mock/backend/mock-store';
import {
  UPLOAD_CONTENT_TYPES,
  UPLOAD_MAX_BYTES,
  type UploadPurpose,
} from '@/src/types/codes';

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function isPurpose(value: unknown): value is UploadPurpose {
  return typeof value === 'string' && value in UPLOAD_MAX_BYTES;
}

export const uploadRoutes: MockRoute[] = [
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/uploads$/,
    auth: true,
    handle: (ctx) => {
      const { purpose, contentType, size } = ctx.body;
      if (!isPurpose(purpose) || typeof size !== 'number') {
        return apiError(ctx, 400, 'COMMON_001', '입력값을 확인해주세요.');
      }
      if (
        typeof contentType !== 'string' ||
        !(UPLOAD_CONTENT_TYPES as readonly string[]).includes(contentType)
      ) {
        return apiError(ctx, 400, 'UPL_001', '지원하지 않는 파일 형식입니다.');
      }
      if (size > UPLOAD_MAX_BYTES[purpose]) {
        return apiError(ctx, 400, 'UPL_002', '파일 크기가 초과되었습니다.');
      }
      const now = new Date();
      const path = `${purpose.toLowerCase()}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${newId()}.${EXT[contentType]}`;
      const token = randomUUID();
      getStore().uploads.set(path, { contentType, bytes: null, token });
      return json(
        {
          path,
          token,
          signedUrl: `/api/backend/__mock-storage/upload/${path}?token=${token}`,
          publicUrl: `${MOCK_PUBLIC_PREFIX}${path}`,
          expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        },
        201
      );
    },
  },
  {
    method: 'PUT',
    pattern: /^\/__mock-storage\/upload\/(?<path>.+)$/,
    auth: false,
    handle: (ctx) => {
      const path = decodeURIComponent(ctx.params.path);
      const entry = getStore().uploads.get(path);
      if (!entry || entry.token !== ctx.query.get('token')) {
        return apiError(
          ctx,
          400,
          'UPL_004',
          '파일 업로드에 실패했습니다. 다시 시도해주세요.'
        );
      }
      entry.bytes = ctx.req.body;
      return noContent();
    },
  },
  {
    method: 'GET',
    pattern: /^\/__mock-storage\/object\/(?<path>.+)$/,
    auth: false,
    handle: (ctx) => {
      const entry = getStore().uploads.get(decodeURIComponent(ctx.params.path));
      if (!entry?.bytes)
        return apiError(
          ctx,
          404,
          'COMMON_002',
          '요청한 정보를 찾을 수 없습니다.'
        );
      return new Response(entry.bytes, {
        status: 200,
        headers: { 'content-type': entry.contentType },
      });
    },
  },
];
