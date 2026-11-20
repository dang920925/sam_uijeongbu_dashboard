// ----------------------------------------------------------------------
// Image — next/image 를 unoptimized 로만 쓴다(Supabase 공개 URL 그대로, Vercel 이미지 변환 미사용 — 기획 R13).
// 크기는 부모 박스가 정하고 이미지는 fill + object-fit 로 채운다.
// ----------------------------------------------------------------------
import NextImage from 'next/image';

interface ImageProps {
  src: string;
  alt: string;
  fit?: 'cover' | 'contain';
  sizes?: string;
}

export function Image({
  src,
  alt,
  fit = 'cover',
  sizes = '200px',
}: ImageProps) {
  return (
    <NextImage
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      style={{ objectFit: fit }}
    />
  );
}
