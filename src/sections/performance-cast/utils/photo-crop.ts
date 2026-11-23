// ----------------------------------------------------------------------
// (U51) 캐스트 사진 '보이는 비율 + 위치' 계산 — 순수 함수(designer §21.1 · 시안 design/screens/u51-crop.js 그대로).
// 비파괴: 원본은 그대로 두고 초점 중심 x·y(원본 기준 %, 0~100) + 확대 zoom(1~3)만 저장한다. 값이 없으면 가운데(50·50·1).
// - cropRect: zoom 1 = 원본 안에 들어가는 가장 큰 목표 비율 상자, zoom z = 한 변 1/z. 중심 = 초점, 원본 밖이면 안쪽으로 밀어 넣는다.
// - thumbRect: 보드 썸네일(1:1) — thumbCrop 이 없으면 crop 을 그대로 1:1 에 적용(계약 back-end §27.1 — 시안 '카드 틀 × 0.6' 대신).
// - coverStyle: 화면 렌더(§27.2 공식 — object-fit cover + object-position + scale).
// - 저장 직전 normalizeCrop 으로 '밀려 들어간 중심'을 실제 상자 중심으로 맞춘다(끌 때 안 움직이는 구간이 없게).
// ----------------------------------------------------------------------

export interface PhotoCrop {
  /** 초점 중심 가로(원본 기준 %, 0~100) */
  x: number;
  /** 초점 중심 세로(원본 기준 %, 0~100) */
  y: number;
  /** 확대 1.00~3.00 */
  zoom: number;
}

export interface PhotoSize {
  width: number;
  height: number;
}

/** 원본 px 기준 상자 */
export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 배역 카드 비율 — 공연마다 하나(기본 3:4) */
export type RoleCardRatio = '3:4' | '2:3' | '4:5' | '1:1';
/** 단체샷·팀샷 보이는 비율 — 사진마다(기본 원본) */
export type PhotoAspect = 'ORIGINAL' | '16:9' | '4:3' | '1:1' | '3:4';

export const ROLE_CARD_RATIOS: readonly RoleCardRatio[] = [
  '3:4',
  '2:3',
  '4:5',
  '1:1',
];
export const PHOTO_ASPECTS: readonly PhotoAspect[] = [
  'ORIGINAL',
  '16:9',
  '4:3',
  '1:1',
  '3:4',
];
export const DEFAULT_ROLE_CARD_RATIO: RoleCardRatio = '3:4';
export const DEFAULT_PHOTO_ASPECT: PhotoAspect = 'ORIGINAL';

export const CROP_DEFAULT: PhotoCrop = { x: 50, y: 50, zoom: 1 };

export const CROP_LIMIT = {
  zoomMin: 1,
  zoomMax: 3,
  /** 슬라이더 한 칸(5%) */
  zoomSlider: 0.05,
  /** [−][+] 버튼·+/− 키 한 번(10%) */
  zoomStep: 0.1,
  /** 화살표 1% · Shift 10% */
  moveSmall: 1,
  moveLarge: 10,
} as const;

/** 잘린 부분 가로가 이보다 작으면 흐림 경고(PC 카드 약 280px × 2배 밀도) */
export const BLUR_MIN_WIDTH = 600;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** '3:4' → 0.75(가로/세로) */
export function ratioOf(
  ratio: RoleCardRatio | Exclude<PhotoAspect, 'ORIGINAL'>
) {
  const [w, h] = ratio.split(':').map(Number);
  return w / h;
}

/** 원본이면 null(잘라 보기 없음) */
export function aspectRatioOf(aspect: PhotoAspect): number | null {
  return aspect === 'ORIGINAL' ? null : ratioOf(aspect);
}

/** 값이 범위를 벗어나거나 비어 있으면 가운데 */
export function sanitizeCrop(crop: Partial<PhotoCrop> | null | undefined) {
  if (!crop) return { ...CROP_DEFAULT };
  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return {
    x: clamp(num(crop.x, 50), 0, 100),
    y: clamp(num(crop.y, 50), 0, 100),
    zoom: clamp(num(crop.zoom, 1), CROP_LIMIT.zoomMin, CROP_LIMIT.zoomMax),
  };
}

/** 원본 안에 들어가는 가장 큰 ratio 상자의 가로·세로(zoom 1) */
function baseSize(size: PhotoSize, ratio: number) {
  return size.width / size.height > ratio
    ? { w: size.height * ratio, h: size.height }
    : { w: size.width, h: size.width / ratio };
}

/** 저장값 → 원본 px 상자 */
export function cropRect(
  size: PhotoSize,
  ratio: number,
  crop: PhotoCrop
): CropBox {
  const base = baseSize(size, ratio);
  const zoom = clamp(crop.zoom, CROP_LIMIT.zoomMin, CROP_LIMIT.zoomMax);
  const w = base.w / zoom;
  const h = base.h / zoom;
  return {
    x: clamp((crop.x / 100) * size.width - w / 2, 0, size.width - w),
    y: clamp((crop.y / 100) * size.height - h / 2, 0, size.height - h),
    w,
    h,
  };
}

/** 보드 썸네일(1:1) 상자 — thumbCrop 이 없으면 crop 을 그대로 1:1 에 적용(back-end §27.1) */
export function thumbRect(
  size: PhotoSize,
  crop: PhotoCrop,
  thumbCrop: PhotoCrop | null
): CropBox {
  return cropRect(size, 1, thumbCrop ?? crop);
}

/** 상자 → 저장값(중심 % + 그 비율 기준 zoom) */
export function cropFromRect(
  size: PhotoSize,
  ratio: number,
  rect: CropBox
): PhotoCrop {
  const base = baseSize(size, ratio);
  return {
    x: round1(((rect.x + rect.w / 2) / size.width) * 100),
    y: round1(((rect.y + rect.h / 2) / size.height) * 100),
    zoom: round2(
      clamp(base.w / rect.w, CROP_LIMIT.zoomMin, CROP_LIMIT.zoomMax)
    ),
  };
}

/** 중심을 실제 상자 중심으로 맞추고 소수 1자리(zoom 2자리)로 */
export function normalizeCrop(
  size: PhotoSize,
  ratio: number,
  crop: PhotoCrop
): PhotoCrop {
  const zoom = round2(clamp(crop.zoom, CROP_LIMIT.zoomMin, CROP_LIMIT.zoomMax));
  const rect = cropRect(size, ratio, { ...crop, zoom });
  return {
    x: round1(((rect.x + rect.w / 2) / size.width) * 100),
    y: round1(((rect.y + rect.h / 2) / size.height) * 100),
    zoom,
  };
}

/** 원본 가로·세로의 % 만큼 옮긴다 */
export function moveCrop(
  size: PhotoSize,
  ratio: number,
  crop: PhotoCrop,
  dxPercent: number,
  dyPercent: number
): PhotoCrop {
  const current = normalizeCrop(size, ratio, crop);
  return normalizeCrop(size, ratio, {
    ...current,
    x: clamp(current.x + dxPercent, 0, 100),
    y: clamp(current.y + dyPercent, 0, 100),
  });
}

export function zoomCrop(
  size: PhotoSize,
  ratio: number,
  crop: PhotoCrop,
  zoom: number
): PhotoCrop {
  return normalizeCrop(size, ratio, { ...crop, zoom });
}

export function isCentered(crop: PhotoCrop | null): boolean {
  return (
    crop === null ||
    (crop.x === CROP_DEFAULT.x &&
      crop.y === CROP_DEFAULT.y &&
      crop.zoom === CROP_DEFAULT.zoom)
  );
}

export function isBlurry(rect: CropBox): boolean {
  return rect.w < BLUR_MIN_WIDTH;
}

/**
 * 상자(overflow hidden) 안 <img> 스타일 — back-end §27.2 렌더 공식(홈페이지와 같은 결과).
 * cover 가 zoom 1 상자를 고르고 object-position = transform-origin 이면 확대 후 왼쪽 끝이 cardRect 와 같아진다.
 * 크기를 모르면 근사(x% y%), crop 이 없으면 가운데 · 확대 1.
 */
export function coverStyle(
  size: PhotoSize | null,
  ratio: number,
  crop: PhotoCrop | null
) {
  const c = crop ?? CROP_DEFAULT;
  let px = c.x;
  let py = c.y;
  if (size) {
    const zoom = clamp(c.zoom, CROP_LIMIT.zoomMin, CROP_LIMIT.zoomMax);
    const cw = Math.min(size.width, size.height * ratio) / zoom;
    const ch = Math.min(size.height, size.width / ratio) / zoom;
    px =
      size.width > cw
        ? clamp(((c.x / 100) * size.width - cw / 2) / (size.width - cw), 0, 1) *
          100
        : 50;
    py =
      size.height > ch
        ? clamp(
            ((c.y / 100) * size.height - ch / 2) / (size.height - ch),
            0,
            1
          ) * 100
        : 50;
  }
  const position = `${round2(px)}% ${round2(py)}%`;
  return {
    objectFit: 'cover' as const,
    objectPosition: position,
    transform: `scale(${c.zoom})`,
    transformOrigin: position,
  };
}

/** 무대(원본 전체) 위 틀의 위치(%) */
export function framePlacement(size: PhotoSize, rect: CropBox) {
  return {
    left: (rect.x / size.width) * 100,
    top: (rect.y / size.height) * 100,
    width: (rect.w / size.width) * 100,
    height: (rect.h / size.height) * 100,
  };
}

/** 두 손가락 거리 비율로 확대 */
export function pinchZoom(
  startZoom: number,
  startDistance: number,
  distance: number
) {
  if (startDistance <= 0) return startZoom;
  return clamp(
    startZoom * (distance / startDistance),
    CROP_LIMIT.zoomMin,
    CROP_LIMIT.zoomMax
  );
}

/** 키 → 옮기기·확대 동작(해당 없으면 null) */
export type CropKeyAction =
  { kind: 'move'; dx: number; dy: number } | { kind: 'zoom'; delta: number };

export function cropKeyAction(
  key: string,
  shiftKey: boolean
): CropKeyAction | null {
  const step = shiftKey ? CROP_LIMIT.moveLarge : CROP_LIMIT.moveSmall;
  switch (key) {
    case 'ArrowLeft':
      return { kind: 'move', dx: -step, dy: 0 };
    case 'ArrowRight':
      return { kind: 'move', dx: step, dy: 0 };
    case 'ArrowUp':
      return { kind: 'move', dx: 0, dy: -step };
    case 'ArrowDown':
      return { kind: 'move', dx: 0, dy: step };
    case '+':
    case '=':
      return { kind: 'zoom', delta: CROP_LIMIT.zoomStep };
    case '-':
    case '_':
      return { kind: 'zoom', delta: -CROP_LIMIT.zoomStep };
    default:
      return null;
  }
}
