'use client';

// ----------------------------------------------------------------------
// 배우 패널 사진 — 원형 96 + "이미지 변경"(업로드 중 "업로드 중..." 비활성, 현행 Members.tsx:240-250).
// 실패는 업로드 문구(UPL_001·002·004) + "다시 시도". 파일 선택은 label 안 숨은 input(JPG·PNG·WEBP).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import type { ChangeEvent } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { MembersAvatar } from '@/src/sections/members/components/members-avatar';
import { MSG_COMMON, MSG_UPLOAD } from '@/src/shared/messages/common';
import { UPLOAD_INPUT_ACCEPT } from '@/src/utils/image-compress/compress-plan';

interface MembersPanelPhotoProps {
  imageUrl: string | null;
  alt: string;
  isBusy: boolean;
  errorMessage: string | null;
  onSelectFile: (file: File) => void;
  onRetry: () => void;
}

export function MembersPanelPhoto({
  imageUrl,
  alt,
  isBusy,
  errorMessage,
  onSelectFile,
  onRetry,
}: MembersPanelPhotoProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onSelectFile(file);
  };

  return (
    <div className='flex flex-col items-center gap-2'>
      <MembersAvatar src={imageUrl} alt={alt} size='xl' />
      <Button
        component='label'
        variant='outlined'
        color='inherit'
        size='small'
        disabled={isBusy}
        startIcon={<Iconify icon='solar:upload-linear' />}
      >
        {isBusy ? MSG_UPLOAD.UPLOADING : MSG_UPLOAD.CHANGE}
        <input
          type='file'
          hidden
          accept={UPLOAD_INPUT_ACCEPT}
          onChange={handleChange}
        />
      </Button>
      {errorMessage ? (
        <div className='flex flex-col items-center gap-1'>
          <Typo.Caption.Regular color='error.main' role='alert'>
            {errorMessage}
          </Typo.Caption.Regular>
          <Button size='small' color='inherit' onClick={onRetry}>
            {MSG_COMMON.RETRY}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
