'use client';

// ----------------------------------------------------------------------
// ImageListUploadField — 여러 장(상세 이미지, ≤20) 업로드 + 순서(위·아래)·삭제(design SCR-D03 상세 이미지).
// 실패 행은 문구(UPL_001·002·004) + "다시 시도"·삭제(designer `.upload__item.is-error`).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import { useCallback, useEffect, useId, useRef, type ChangeEvent } from 'react';

import { FormField } from '@/src/components/form-field';
import { Iconify } from '@/src/components/iconify';
import { moveItem } from '@/src/components/image-upload-field/move-item';
import { UploadThumb } from '@/src/components/image-upload-field/upload-thumb';
import { Typo } from '@/src/components/typo';
import { canRetryUpload } from '@/src/hooks/upload-error-message';
import { useImageListUpload } from '@/src/hooks/use-image-list-upload';
import { MSG_COMMON, MSG_UPLOAD } from '@/src/shared/messages/common';
import { UPLOAD_CONTENT_TYPES, type UploadPurpose } from '@/src/types/codes';

interface ImageListUploadFieldProps {
  label: string;
  purpose: UploadPurpose;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  helper?: string;
  thumbAlt: (index: number) => string;
  onUploadingChange?: (isUploading: boolean) => void;
}

export function ImageListUploadField({
  label,
  purpose,
  value,
  onChange,
  max = 20,
  helper = MSG_UPLOAD.HELP,
  thumbAlt,
  onUploadingChange,
}: ImageListUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleUploaded = useCallback(
    (url: string) => onChange([...valueRef.current, url]),
    [onChange]
  );
  const uploader = useImageListUpload(purpose, handleUploaded);

  useEffect(() => {
    onUploadingChange?.(uploader.isUploading);
  }, [uploader.isUploading, onUploadingChange]);

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const room = Math.max(0, max - value.length - uploader.pending.length);
    const files = Array.from(event.target.files ?? []).slice(0, room);
    event.target.value = '';
    if (files.length > 0) uploader.uploadFiles(files);
  };

  const rowSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    p: 2,
    border: 1,
    borderColor: 'divider',
    borderRadius: 2,
  };

  return (
    <FormField label={label} htmlFor={inputId} helper={helper}>
      <input
        ref={inputRef}
        id={inputId}
        type='file'
        multiple
        accept={UPLOAD_CONTENT_TYPES.join(',')}
        hidden
        onChange={handleFiles}
      />
      <ol className='m-0 flex list-none flex-col gap-2 p-0'>
        {value.map((url, index) => (
          <Box component='li' key={`${url}-${index}`} sx={rowSx}>
            <Typo.Caption.Regular color='text.secondary'>
              {index + 1}
            </Typo.Caption.Regular>
            <UploadThumb src={url} alt={thumbAlt(index)} />
            <div className='flex flex-1 justify-end gap-1'>
              <IconButton
                aria-label={MSG_UPLOAD.MOVE_UP}
                disabled={index === 0}
                onClick={() => onChange(moveItem(value, index, -1))}
              >
                <Iconify icon='solar:arrow-up-linear' />
              </IconButton>
              <IconButton
                aria-label={MSG_UPLOAD.MOVE_DOWN}
                disabled={index === value.length - 1}
                onClick={() => onChange(moveItem(value, index, 1))}
              >
                <Iconify icon='solar:arrow-down-linear' />
              </IconButton>
              <IconButton
                aria-label={MSG_UPLOAD.REMOVE}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                sx={{ color: 'error.main' }}
              >
                <Iconify icon='solar:trash-bin-trash-linear' />
              </IconButton>
            </div>
          </Box>
        ))}
        {uploader.pending.map((item) => (
          <Box
            component='li'
            key={item.key}
            sx={[
              rowSx,
              { flexDirection: 'column', alignItems: 'stretch' },
              item.errorMessage
                ? {
                    borderColor: 'semantic.alert.errorBorder',
                    bgcolor: 'semantic.alert.errorBg',
                  }
                : {},
            ]}
          >
            {item.errorMessage ? (
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <Typo.Caption.Regular
                  color='semantic.alert.errorFg'
                  role='alert'
                >
                  {item.errorMessage}
                </Typo.Caption.Regular>
                <div className='flex gap-2'>
                  {canRetryUpload(item.errorMessage) ? (
                    <Button
                      size='small'
                      variant='outlined'
                      color='inherit'
                      onClick={() => uploader.retry(item.key)}
                    >
                      {MSG_COMMON.RETRY}
                    </Button>
                  ) : null}
                  <IconButton
                    aria-label={MSG_UPLOAD.REMOVE}
                    onClick={() => uploader.dismiss(item.key)}
                    sx={{ color: 'error.main' }}
                  >
                    <Iconify icon='solar:trash-bin-trash-linear' />
                  </IconButton>
                </div>
              </div>
            ) : (
              <>
                <Typo.Caption.Regular color='text.secondary' aria-live='polite'>
                  {MSG_UPLOAD.UPLOADING}
                </Typo.Caption.Regular>
                <LinearProgress
                  variant='determinate'
                  value={item.progress}
                  aria-label={MSG_UPLOAD.UPLOADING}
                />
              </>
            )}
          </Box>
        ))}
      </ol>
      {value.length + uploader.pending.length < max ? (
        <div>
          <Button
            size='small'
            variant='outlined'
            color='inherit'
            onClick={() => inputRef.current?.click()}
            startIcon={<Iconify icon='solar:upload-linear' />}
          >
            {MSG_UPLOAD.SELECT}
          </Button>
        </div>
      ) : null}
    </FormField>
  );
}
