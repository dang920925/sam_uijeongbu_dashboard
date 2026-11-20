import { describe, expect, it } from 'vitest';

import {
  fitWithin,
  formatMegabytes,
  hasTransparentPixel,
  planCompressAttempts,
  shouldKeepOriginal,
} from '@/src/utils/image-compress/compress-plan';

const MB = 1024 * 1024;

describe('fitWithin', () => {
  it('긴 변을 상한에 맞춰 비율대로 줄인다', () => {
    expect(fitWithin({ width: 4000, height: 6000 }, 2400)).toEqual({
      width: 1600,
      height: 2400,
    });
    expect(fitWithin({ width: 6000, height: 4000 }, 2400)).toEqual({
      width: 2400,
      height: 1600,
    });
  });

  it('상한 이하인 이미지는 키우지 않고 그대로 둔다', () => {
    expect(fitWithin({ width: 800, height: 1200 }, 2400)).toEqual({
      width: 800,
      height: 1200,
    });
  });

  it('아주 가는 이미지도 1px 아래로 내려가지 않는다', () => {
    expect(fitWithin({ width: 10000, height: 1 }, 2400)).toEqual({
      width: 2400,
      height: 1,
    });
  });
});

describe('planCompressAttempts', () => {
  it('2400px 에서 품질 0.85 → 0.75 → 0.65 뒤 긴 변 ×0.8 을 하한 1000px 까지 반복한다', () => {
    // Act
    const attempts = planCompressAttempts({ width: 4000, height: 6000 });
    // Assert
    expect(attempts.slice(0, 3)).toEqual([
      { width: 1600, height: 2400, quality: 0.85 },
      { width: 1600, height: 2400, quality: 0.75 },
      { width: 1600, height: 2400, quality: 0.65 },
    ]);
    expect(
      attempts.slice(3).map((a) => [Math.max(a.width, a.height), a.quality])
    ).toEqual([
      [1920, 0.65],
      [1536, 0.65],
      [1229, 0.65],
      [1000, 0.65],
    ]);
  });

  it('하한보다 작은 이미지는 품질 단계만 시도한다', () => {
    // Act
    const attempts = planCompressAttempts({ width: 600, height: 900 });
    // Assert
    expect(attempts).toEqual([
      { width: 600, height: 900, quality: 0.85 },
      { width: 600, height: 900, quality: 0.75 },
      { width: 600, height: 900, quality: 0.65 },
    ]);
  });

  it('무손실(PNG) 출력이면 크기마다 한 번만 시도한다', () => {
    // Act
    const attempts = planCompressAttempts({ width: 3000, height: 2000 }, true);
    // Assert
    expect(attempts.map((a) => a.width)).toEqual([
      2400, 1920, 1536, 1229, 1000,
    ]);
  });
});

describe('shouldKeepOriginal', () => {
  it('허용 형식·한도 안·긴 변 2400px 이하면 원본을 그대로 올린다', () => {
    expect(
      shouldKeepOriginal(
        { type: 'image/png', size: 2 * MB },
        { width: 2400, height: 1600 },
        5 * MB
      )
    ).toBe(true);
  });

  it('한도를 넘거나 긴 변이 2400px 을 넘거나 형식이 다르면 다시 인코딩한다', () => {
    const big = { width: 2401, height: 100 };
    const small = { width: 100, height: 100 };
    expect(
      shouldKeepOriginal({ type: 'image/jpeg', size: 15 * MB }, small, 5 * MB)
    ).toBe(false);
    expect(
      shouldKeepOriginal({ type: 'image/jpeg', size: 1 * MB }, big, 5 * MB)
    ).toBe(false);
    expect(
      shouldKeepOriginal({ type: 'image/heic', size: 1 * MB }, small, 5 * MB)
    ).toBe(false);
  });
});

describe('hasTransparentPixel', () => {
  it('알파가 255 미만인 픽셀이 있으면 투명으로 본다', () => {
    expect(hasTransparentPixel([0, 0, 0, 255, 9, 9, 9, 254])).toBe(true);
    expect(hasTransparentPixel([0, 0, 0, 255, 9, 9, 9, 255])).toBe(false);
  });
});

describe('formatMegabytes', () => {
  it('소수 한 자리 MB 로 표시한다', () => {
    expect(formatMegabytes(15.2 * MB)).toBe('15.2MB');
    expect(formatMegabytes(2.14 * MB)).toBe('2.1MB');
    expect(formatMegabytes(10 * 1024)).toBe('0.1MB');
  });
});
