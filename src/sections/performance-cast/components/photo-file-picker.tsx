'use client';

// ----------------------------------------------------------------------
// (U48) 사진 한 장 고르기 — 숨은 file input + 호출 쪽이 그리는 버튼(open 으로 연다). 키보드는 버튼이 받는다.
// 같은 파일을 다시 골라도 change 가 나게 고른 뒤 값을 비운다. 형식 허용 목록은 기존 업로드와 같다.
// ----------------------------------------------------------------------
import { useState, type ChangeEvent, type ReactNode } from 'react';

import { UPLOAD_INPUT_ACCEPT } from '@/src/utils/image-compress/compress-plan';

interface PhotoFilePickerProps {
  onFile: (file: File) => void;
  children: (open: () => void) => ReactNode;
  /** E2E·보조기기용 이름(input 자체는 숨김) */
  inputLabel: string;
}

export function PhotoFilePicker({
  onFile,
  children,
  inputLabel,
}: PhotoFilePickerProps) {
  // 콜백 ref 로 받은 요소(렌더 중 ref.current 를 읽지 않게 — react-hooks/refs)
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onFile(file);
  };
  return (
    <>
      <input
        ref={setInput}
        type='file'
        accept={UPLOAD_INPUT_ACCEPT}
        hidden
        aria-label={inputLabel}
        onChange={handleChange}
      />
      {children(() => input?.click())}
    </>
  );
}
