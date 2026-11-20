'use client';

// ----------------------------------------------------------------------
// ImageUploadField — 이미지 1장 서명 URL 업로드(FN-18, designer components.css `.upload`).
// 빈 칸(점선 + "이미지 선택") → 압축("이미지 최적화 중...", W5) → 진행("업로드 중..." + 진행 막대) → 썸네일("이미지 변경"·삭제) / 실패 행(문구 + "다시 시도").
// 압축해 올렸으면 썸네일 아래 "15.2MB → 2.1MB로 줄여 올렸습니다.". 업로드가 끝나면 publicUrl 을 onChange 로 넘긴다. 저장 요청은 호출 쪽 폼이 한다.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import { useId, useRef, type ChangeEvent } from 'react';

import { FormField } from '@/src/components/form-field';
import { Iconify } from '@/src/components/iconify';
import {
  UploadThumb,
  type ThumbShape,
} from '@/src/components/image-upload-field/upload-thumb';
import { Typo } from '@/src/components/typo';
import { canRetryUpload } from '@/src/hooks/upload-error-message';
import { useImageUpload } from '@/src/hooks/use-image-upload';
import { MSG_COMMON, MSG_UPLOAD } from '@/src/shared/messages/common';
import type { UploadPurpose } from '@/src/types/codes';
import { UPLOAD_INPUT_ACCEPT } from '@/src/utils/image-compress/compress-plan';

interface ImageUploadFieldProps {
  label: string;
  purpose: UploadPurpose;
  value: string | null;
  onChange: (url: string | null) => void;
  required?: boolean;
  /** 폼 검증 오류(예: "이미지를 업로드해주세요.") */
  error?: string | null;
  helper?: string;
  shape?: ThumbShape;
  /** 썸네일 대체 텍스트(이미지 의미) */
  thumbAlt: string;
  onUploadingChange?: (isUploading: boolean) => void;
}

export function ImageUploadField({
  label,
  purpose,
  value,
  onChange,
  required = false,
  error,
  helper = MSG_UPLOAD.HELP,
  shape = 'square',
  thumbAlt,
  onUploadingChange,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploader = useImageUpload(purpose);

  const runUpload = async (job: () => Promise<string | null>) => {
    onUploadingChange?.(true);
    const url = await job();
    onUploadingChange?.(false);
    if (url) onChange(url);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void runUpload(() => uploader.upload(file));
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <FormField
      label={label}
      htmlFor={inputId}
      required={required}
      error={error}
      helper={helper}
    >
      <input
        ref={inputRef}
        id={inputId}
        type='file'
        accept={UPLOAD_INPUT_ACCEPT}
        hidden
        onChange={handleFile}
      />
      {uploader.isUploading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: 3,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typo.Badge.Regular color='text.secondary' aria-live='polite'>
            {uploader.isOptimizing
              ? MSG_UPLOAD.OPTIMIZING
              : MSG_UPLOAD.UPLOADING}
          </Typo.Badge.Regular>
          {uploader.isOptimizing ? (
            <LinearProgress aria-label={MSG_UPLOAD.OPTIMIZING} />
          ) : (
            <LinearProgress
              variant='determinate'
              value={uploader.progress}
              aria-label={MSG_UPLOAD.UPLOADING}
            />
          )}
        </Box>
      ) : uploader.errorMessage ? (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            p: 3,
            border: 1,
            borderRadius: 2,
            borderColor: 'semantic.alert.errorBorder',
            bgcolor: 'semantic.alert.errorBg',
          }}
        >
          <Typo.Caption.Regular color='semantic.alert.errorFg' role='alert'>
            {uploader.errorMessage}
          </Typo.Caption.Regular>
          <div className='flex gap-2'>
            <Button
              size='small'
              variant='outlined'
              color='inherit'
              onClick={openPicker}
            >
              {MSG_UPLOAD.SELECT}
            </Button>
            {canRetryUpload(uploader.errorMessage) ? (
              <Button
                size='small'
                variant='outlined'
                color='inherit'
                onClick={() => void runUpload(uploader.retry)}
              >
                {MSG_COMMON.RETRY}
              </Button>
            ) : null}
          </div>
        </Box>
      ) : value ? (
        <div className='flex flex-col gap-1'>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <UploadThumb src={value} alt={thumbAlt} shape={shape} />
            <div className='flex flex-1 flex-wrap justify-end gap-2'>
              <Button
                size='small'
                variant='outlined'
                color='inherit'
                onClick={openPicker}
              >
                {MSG_UPLOAD.CHANGE}
              </Button>
              <IconButton
                aria-label={MSG_UPLOAD.REMOVE}
                onClick={() => onChange(null)}
                sx={{ color: 'error.main' }}
              >
                <Iconify icon='solar:trash-bin-trash-linear' />
              </IconButton>
            </div>
          </Box>
          {uploader.notice ? (
            <Typo.Caption.Regular color='text.secondary' aria-live='polite'>
              {uploader.notice}
            </Typo.Caption.Regular>
          ) : null}
        </div>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            minHeight: 112,
            p: 4,
            border: 1,
            borderStyle: 'dashed',
            borderColor: error ? 'error.main' : 'divider',
            borderRadius: 2,
            bgcolor: 'background.default',
            color: 'text.secondary',
          }}
        >
          <Iconify icon='solar:gallery-add-linear' size='lg' />
          <Button
            size='small'
            variant='outlined'
            color='inherit'
            onClick={openPicker}
          >
            {MSG_UPLOAD.SELECT}
          </Button>
        </Box>
      )}
    </FormField>
  );
}
