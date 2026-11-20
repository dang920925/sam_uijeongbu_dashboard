// ----------------------------------------------------------------------
// 업로드 전 이미지 축소·압축 계획(W5, 사용자 요청 2026-11-20 "포스터 15MB 화질 낮추기") — 순수 계산만.
// 브라우저 처리(디코드·canvas·인코드)는 src/lib/image-compress.ts 가 이 계획을 따라 한다.
// 순서: 긴 변 2400px 로 맞춤 → 품질 0.85 → 0.75 → 0.65 → 그래도 크면 긴 변 ×0.8 반복(하한 1000px, 품질 0.65).
// 건너뛰기: 서버 허용 형식이고 용도별 한도 안이며 긴 변 2400px 이하면 원본 그대로(재인코딩 금지).
// ----------------------------------------------------------------------
import { UPLOAD_CONTENT_TYPES } from '@/src/types/codes';

const MB = 1024 * 1024;

export const IMAGE_COMPRESS = {
  /** 결과 이미지 긴 변 상한(px) */
  MAX_EDGE: 2400,
  /** 크기 축소 하한 — 이보다 작게는 줄이지 않는다(그래도 크면 한도 초과 안내) */
  MIN_EDGE: 1000,
  /** 크기 축소 배율(긴 변 기준) */
  SCALE_STEP: 0.8,
  /** 손실 압축 품질 단계 — 크기 축소 단계는 마지막 품질로 */
  QUALITY_STEPS: [0.85, 0.75, 0.65],
  /** 입력 단계 원본 상한(서버 한도와 별개) */
  INPUT_MAX_BYTES: 50 * MB,
} as const;

/** 파일 입력 accept — 서버 허용 형식 + HEIC(열 수 있으면 JPEG 로 바꾸고, 못 열면 다시 저장 안내) */
export const UPLOAD_INPUT_ACCEPT = [
  ...UPLOAD_CONTENT_TYPES,
  'image/heic',
  'image/heif',
  '.heic',
  '.heif',
].join(',');

export interface ImageSize {
  width: number;
  height: number;
}

export interface CompressAttempt extends ImageSize {
  /** 0~1. 무손실(PNG) 출력이면 인코더가 무시한다 */
  quality: number;
}

/** 긴 변이 maxEdge 를 넘지 않게 비율대로 줄인 크기(키우지 않음, 최소 1px) */
export function fitWithin(size: ImageSize, maxEdge: number): ImageSize {
  const longEdge = Math.max(size.width, size.height);
  if (longEdge <= maxEdge) return { width: size.width, height: size.height };
  const ratio = maxEdge / longEdge;
  return {
    width: Math.max(1, Math.round(size.width * ratio)),
    height: Math.max(1, Math.round(size.height * ratio)),
  };
}

/**
 * 한도 안에 들 때까지 차례로 시도할 (크기·품질) 목록.
 * lossless(PNG 출력)면 품질 단계가 의미 없으므로 크기마다 한 번만 시도한다.
 */
export function planCompressAttempts(
  source: ImageSize,
  lossless = false
): CompressAttempt[] {
  const { MAX_EDGE, MIN_EDGE, SCALE_STEP, QUALITY_STEPS } = IMAGE_COMPRESS;
  const base = fitWithin(source, MAX_EDGE);
  const lastQuality = QUALITY_STEPS[QUALITY_STEPS.length - 1];
  const attempts: CompressAttempt[] = (
    lossless ? [QUALITY_STEPS[0]] : QUALITY_STEPS
  ).map((quality) => ({ ...base, quality }));

  let edge = Math.max(base.width, base.height);
  while (edge > MIN_EDGE) {
    edge = Math.max(MIN_EDGE, Math.round(edge * SCALE_STEP));
    attempts.push({ ...fitWithin(source, edge), quality: lastQuality });
  }
  return attempts;
}

/** 원본을 그대로 올려도 되는지 — 서버 허용 형식 · 한도 안 · 긴 변 2400px 이하 */
export function shouldKeepOriginal(
  file: { type: string; size: number },
  size: ImageSize,
  maxBytes: number
): boolean {
  return (
    (UPLOAD_CONTENT_TYPES as readonly string[]).includes(file.type) &&
    file.size <= maxBytes &&
    Math.max(size.width, size.height) <= IMAGE_COMPRESS.MAX_EDGE
  );
}

/** RGBA 픽셀 배열에 완전 불투명(255)이 아닌 픽셀이 하나라도 있는지 */
export function hasTransparentPixel(rgba: ArrayLike<number>): boolean {
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i] < 255) return true;
  }
  return false;
}

/** 바이트 → "15.2MB"(소수 한 자리, 0.1MB 미만은 0.1MB) */
export function formatMegabytes(bytes: number): string {
  return `${Math.max(0.1, bytes / MB).toFixed(1)}MB`;
}
