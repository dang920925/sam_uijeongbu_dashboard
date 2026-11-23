// ----------------------------------------------------------------------
// 업로드 전 이미지 축소·압축(브라우저 전용, W5) — 서명 URL 요청(POST /admin/uploads) 전에 부른다.
// ① createImageBitmap(EXIF 방향 반영)으로 연다 ② 원본이 허용 형식·한도 안·긴 변 2400px 이하면 그대로
// ③ 아니면 compress-plan 순서대로 canvas(OffscreenCanvas 우선)에 그려 인코딩해 한도 안에 드는 첫 결과를 쓴다.
// 출력 형식: 투명 픽셀이 있으면 WebP(인코더 미지원 브라우저는 PNG), 그 밖은 JPEG.
// 실패: 허용 밖 형식 UPL_001 · 50MB 초과/끝까지 한도 초과 UPL_002 · 열 수 없음 ImageDecodeError.
// ⚠ 허용 형식이고 한도 안인데 브라우저가 못 여는 경우(구형 브라우저 등)는 원본을 그대로 올린다(이전 동작).
// ----------------------------------------------------------------------
import { UploadValidationError } from '@/src/api/upload-mapper';
import { ImageDecodeError } from '@/src/lib/image-decode-error';
import {
  UPLOAD_CONTENT_TYPES,
  UPLOAD_MAX_BYTES,
  type UploadPurpose,
} from '@/src/types/codes';
import {
  hasTransparentPixel,
  IMAGE_COMPRESS,
  planCompressAttempts,
  shouldKeepOriginal,
  type CompressAttempt,
} from '@/src/utils/image-compress/compress-plan';

export interface PreparedUpload {
  file: File;
  /** 압축했으면 원본 바이트 수, 원본 그대로면 null */
  originalSize: number | null;
  /** (U51) 올리는 파일의 가로·세로 px(EXIF 방향 반영). 브라우저가 못 열면 null */
  width: number | null;
  height: number | null;
}

type Canvas2D = OffscreenCanvas | HTMLCanvasElement;
type Context2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

const HEIC_TYPES = ['image/heic', 'image/heif'];
const HEIC_EXT = /\.hei[cf]$/i;
/** 투명 여부를 볼 때 쓰는 축소 크기(전체 해상도 픽셀을 읽지 않으려고) */
const ALPHA_PROBE_EDGE = 256;
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function isAllowedType(type: string): boolean {
  return (UPLOAD_CONTENT_TYPES as readonly string[]).includes(type);
}

function isHeic(file: File): boolean {
  return HEIC_TYPES.includes(file.type) || HEIC_EXT.test(file.name);
}

async function decode(file: File): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap !== 'function') return null;
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // imageOrientation 을 모르는 브라우저는 옵션 없이 한 번 더
    try {
      return await createImageBitmap(file);
    } catch {
      return null;
    }
  }
}

interface Surface {
  canvas: Canvas2D;
  context: Context2D;
}

function documentSurface(width: number, height: number): Surface | null {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  return context ? { canvas, context } : null;
}

/** OffscreenCanvas 우선, 2D 를 못 주면(구형 Safari) 문서 canvas */
function createSurface(width: number, height: number): Surface | null {
  if (typeof OffscreenCanvas === 'function') {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (context) return { canvas, context };
  }
  return documentSurface(width, height);
}

function draw(bitmap: ImageBitmap, width: number, height: number): Surface {
  const surface = createSurface(width, height);
  if (!surface) throw new ImageDecodeError();
  const { context } = surface;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, width, height);
  return surface;
}

function encode(
  canvas: Canvas2D,
  type: string,
  quality: number
): Promise<Blob> {
  if (canvas instanceof HTMLCanvasElement) {
    return new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new ImageDecodeError())),
        type,
        quality
      )
    );
  }
  return canvas.convertToBlob({ type, quality });
}

function hasTransparency(bitmap: ImageBitmap): boolean {
  const ratio = Math.min(
    1,
    ALPHA_PROBE_EDGE / Math.max(bitmap.width, bitmap.height)
  );
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));
  const { context } = draw(bitmap, width, height);
  return hasTransparentPixel(context.getImageData(0, 0, width, height).data);
}

async function encodeAttempt(
  bitmap: ImageBitmap,
  attempt: CompressAttempt,
  type: string
): Promise<Blob> {
  const { canvas } = draw(bitmap, attempt.width, attempt.height);
  return encode(canvas, type, attempt.quality);
}

/** 투명 픽셀이 있으면 WebP(인코더가 없어 PNG 로 돌려주는 브라우저는 PNG), 그 밖은 JPEG */
async function pickOutputType(
  file: File,
  bitmap: ImageBitmap
): Promise<string> {
  if (file.type === 'image/jpeg' || !hasTransparency(bitmap)) {
    return 'image/jpeg';
  }
  const probe = await encode(draw(bitmap, 1, 1).canvas, 'image/webp', 0.85);
  return probe.type === 'image/webp' ? 'image/webp' : 'image/png';
}

function renamed(name: string, type: string): string {
  const base = name.replace(/\.[^.]+$/, '') || 'image';
  return `${base}.${EXT[type] ?? 'jpg'}`;
}

/** 업로드할 파일을 준비한다 — 원본 그대로이거나 한도 안으로 줄인 새 파일 */
export async function prepareImageForUpload(
  purpose: UploadPurpose,
  file: File
): Promise<PreparedUpload> {
  const maxBytes = UPLOAD_MAX_BYTES[purpose];
  const allowed = isAllowedType(file.type);
  if (!allowed && !isHeic(file)) throw new UploadValidationError('UPL_001');
  if (file.size > IMAGE_COMPRESS.INPUT_MAX_BYTES) {
    throw new UploadValidationError('UPL_002');
  }

  const bitmap = await decode(file);
  if (!bitmap) {
    if (allowed && file.size <= maxBytes)
      return { file, originalSize: null, width: null, height: null };
    throw new ImageDecodeError();
  }

  try {
    const source = { width: bitmap.width, height: bitmap.height };
    if (shouldKeepOriginal(file, source, maxBytes)) {
      return { file, originalSize: null, ...source };
    }

    const type = await pickOutputType(file, bitmap);
    for (const attempt of planCompressAttempts(source, type === 'image/png')) {
      const blob = await encodeAttempt(bitmap, attempt, type);
      if (blob.size <= maxBytes) {
        return {
          file: new File([blob], renamed(file.name, type), { type }),
          originalSize: file.size,
          width: attempt.width,
          height: attempt.height,
        };
      }
    }
    throw new UploadValidationError('UPL_002');
  } finally {
    bitmap.close();
  }
}
