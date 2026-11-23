// ----------------------------------------------------------------------
// (U51) 저장된 비율·위치대로 잘라 보여 주는 사진 — 부모 상자(비율·크기·모서리)를 채운다(back-end §27.2 렌더 공식).
// style 은 coverStyle(…) 결과(object-fit cover + object-position + scale). 비율이 원본이면 contain 으로 전체.
// next/image 는 unoptimized(Image 공용 컴포넌트와 같은 규칙) — 변환은 style 로만. props 만으로 렌더.
// ----------------------------------------------------------------------
import NextImage from 'next/image';
import type { CSSProperties } from 'react';

interface CroppedPhotoProps {
  src: string;
  alt: string;
  /** coverStyle 결과. 없으면 원본 전체(contain) */
  cropStyle: CSSProperties | null;
  sizes?: string;
}

export function CroppedPhoto({
  src,
  alt,
  cropStyle,
  sizes = '200px',
}: CroppedPhotoProps) {
  return (
    <NextImage
      src={src}
      alt={alt}
      fill
      unoptimized
      draggable={false}
      sizes={sizes}
      style={cropStyle ?? { objectFit: 'contain' }}
    />
  );
}
