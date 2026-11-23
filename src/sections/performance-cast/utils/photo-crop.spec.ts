import {
  aspectRatioOf,
  coverStyle,
  CROP_DEFAULT,
  cropFromRect,
  cropKeyAction,
  cropRect,
  isBlurry,
  isCentered,
  moveCrop,
  normalizeCrop,
  pinchZoom,
  ratioOf,
  sanitizeCrop,
  thumbRect,
  zoomCrop,
} from '@/src/sections/performance-cast/utils/photo-crop';

const LANDSCAPE = { width: 1600, height: 1200 };

describe('cropRect (U51 §21.1 · u51-crop.js cardRect)', () => {
  it('zoom 1 은 원본 안에 들어가는 가장 큰 목표 비율 상자를 가운데에 둔다', () => {
    // Act
    const rect = cropRect(LANDSCAPE, ratioOf('3:4'), CROP_DEFAULT);
    // Assert — 세로 1200 꽉 차고 가로 900, 가운데
    expect(rect).toEqual({ x: 350, y: 0, w: 900, h: 1200 });
  });

  it('zoom 이 커지면 한 변이 1/zoom 이 되고, 원본 밖으로 나가면 안쪽으로 밀어 넣는다', () => {
    // Act
    const rect = cropRect(LANDSCAPE, 0.75, { x: 0, y: 100, zoom: 2 });
    // Assert
    expect(rect.w).toBe(450);
    expect(rect.h).toBe(600);
    expect(rect.x).toBe(0);
    expect(rect.y).toBe(600);
  });
});

describe('thumbRect (back-end §27.1)', () => {
  it('thumbCrop 이 없으면 crop 을 그대로 1:1 에 적용한다', () => {
    const crop = { x: 26, y: 40, zoom: 1.3 };
    expect(thumbRect(LANDSCAPE, crop, null)).toEqual(
      cropRect(LANDSCAPE, 1, crop)
    );
  });

  it('thumbCrop 이 있으면 그것으로 자른다', () => {
    const thumb = { x: 24, y: 33, zoom: 3 };
    expect(thumbRect(LANDSCAPE, CROP_DEFAULT, thumb).w).toBe(400);
  });
});

describe('coverStyle (back-end §27.2 렌더 공식)', () => {
  it('크기를 알면 확대 후 보이는 왼쪽 끝이 cropRect 의 x 와 같아진다', () => {
    // Arrange
    const crop = { x: 26, y: 40, zoom: 1.3 };
    const ratio = 0.75;
    const rect = cropRect(LANDSCAPE, ratio, crop);
    // Act
    const style = coverStyle(LANDSCAPE, ratio, crop);
    const [px] = style.objectPosition.split(' ').map((v) => parseFloat(v));
    // Assert — 왼쪽 끝 = px% × (W − cw)
    expect((px / 100) * (LANDSCAPE.width - rect.w)).toBeCloseTo(rect.x, 0);
    expect(style.transform).toBe('scale(1.3)');
    expect(style.transformOrigin).toBe(style.objectPosition);
  });

  it('크기를 모르면 x% y% 근사, crop 이 없으면 가운데 · 확대 1', () => {
    expect(
      coverStyle(null, 0.75, { x: 30, y: 20, zoom: 2 }).objectPosition
    ).toBe('30% 20%');
    expect(coverStyle(LANDSCAPE, 0.75, null)).toMatchObject({
      objectPosition: '50% 50%',
      transform: 'scale(1)',
    });
  });
});

describe('moveCrop · zoomCrop · normalizeCrop', () => {
  it('끝까지 밀린 중심은 실제 상자 중심으로 맞춰 끌 때 안 움직이는 구간이 없다', () => {
    // Act — 3:4 zoom 1 은 세로로 꽉 차서 y 를 옮겨도 50
    const moved = moveCrop(LANDSCAPE, 0.75, CROP_DEFAULT, -100, 30);
    // Assert
    expect(moved).toEqual({ x: 28.1, y: 50, zoom: 1 });
  });

  it('확대는 1~3 으로 묶고 소수 둘째 자리로 반올림한다', () => {
    expect(zoomCrop(LANDSCAPE, 0.75, CROP_DEFAULT, 5).zoom).toBe(3);
    expect(zoomCrop(LANDSCAPE, 0.75, CROP_DEFAULT, 0.5).zoom).toBe(1);
    expect(
      normalizeCrop(LANDSCAPE, 1, { x: 50, y: 50, zoom: 1.234 }).zoom
    ).toBe(1.23);
  });

  it('상자 → 저장값은 중심 %와 그 비율 기준 zoom 이다', () => {
    const rect = cropRect(LANDSCAPE, 1, { x: 30, y: 40, zoom: 2 });
    expect(cropFromRect(LANDSCAPE, 1, rect)).toEqual({ x: 30, y: 40, zoom: 2 });
  });
});

describe('값 가드 · 상태', () => {
  it('범위 밖·빈 값은 가운데 기준으로 고친다', () => {
    expect(sanitizeCrop(null)).toEqual(CROP_DEFAULT);
    expect(sanitizeCrop({ x: 120, y: -3, zoom: 9 })).toEqual({
      x: 100,
      y: 0,
      zoom: 3,
    });
  });

  it('원본 비율은 자르지 않고(null), 가운데 값은 isCentered', () => {
    expect(aspectRatioOf('ORIGINAL')).toBeNull();
    expect(aspectRatioOf('16:9')).toBeCloseTo(16 / 9);
    expect(isCentered(null)).toBe(true);
    expect(isCentered({ x: 50, y: 50, zoom: 1.1 })).toBe(false);
  });

  it('잘린 부분 가로가 600px 미만이면 흐림 경고', () => {
    expect(isBlurry({ x: 0, y: 0, w: 599, h: 800 })).toBe(true);
    expect(isBlurry({ x: 0, y: 0, w: 600, h: 800 })).toBe(false);
  });
});

describe('cropKeyAction · pinchZoom', () => {
  it('화살표 1% · Shift 10% · +/− 확대 10%, 다른 키는 null', () => {
    expect(cropKeyAction('ArrowLeft', false)).toEqual({
      kind: 'move',
      dx: -1,
      dy: 0,
    });
    expect(cropKeyAction('ArrowDown', true)).toEqual({
      kind: 'move',
      dx: 0,
      dy: 10,
    });
    expect(cropKeyAction('+', false)).toEqual({ kind: 'zoom', delta: 0.1 });
    expect(cropKeyAction('-', false)).toEqual({ kind: 'zoom', delta: -0.1 });
    expect(cropKeyAction('Enter', false)).toBeNull();
  });

  it('두 손가락 거리 비율만큼 확대하고 1~3 으로 묶는다', () => {
    expect(pinchZoom(1.2, 100, 150)).toBeCloseTo(1.8);
    expect(pinchZoom(2, 100, 400)).toBe(3);
    expect(pinchZoom(1.5, 0, 100)).toBe(1.5);
  });
});
