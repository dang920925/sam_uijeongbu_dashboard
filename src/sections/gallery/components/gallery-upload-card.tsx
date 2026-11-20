'use client';

// ----------------------------------------------------------------------
// 갤러리 업로드 카드 — 카테고리(128) · "설명 (선택)"(남은 폭, 최소 160) · "이미지 선택" 한 줄, 좁으면 wrap(designer SCR-D07).
// 파일을 고르면 바로 onFileSelect. 진행 중에는 버튼 "업로드 중..." 비활성, 실패 문구는 카드 안(현행 Gallery.tsx:125-127).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useId, useRef, type ChangeEvent } from 'react';

import { FormField } from '@/src/components/form-field';
import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { MSG_UPLOAD } from '@/src/shared/messages/common';
import { MSG_D07 } from '@/src/shared/messages/d07';
import {
  GALLERY_CATEGORIES,
  GALLERY_CATEGORY_LABEL,
  UPLOAD_CONTENT_TYPES,
  type GalleryCategory,
} from '@/src/types/codes';

interface GalleryUploadCardProps {
  category: GalleryCategory;
  description: string;
  isUploading: boolean;
  errorMessage: string | null;
  onCategoryChange: (category: GalleryCategory) => void;
  onDescriptionChange: (value: string) => void;
  onFileSelect: (file: File) => void;
}

export function GalleryUploadCard({
  category,
  description,
  isUploading,
  errorMessage,
  onCategoryChange,
  onDescriptionChange,
  onFileSelect,
}: GalleryUploadCardProps) {
  const categoryId = useId();
  const descriptionId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onFileSelect(file);
  };

  return (
    <Card component='section' sx={{ p: { xs: 4, md: 6 } }}>
      <div className='flex flex-col gap-4'>
        <Typo.Title.Bold component='h2'>{MSG_D07.UPLOAD_TITLE}</Typo.Title.Bold>
        <div className='flex flex-wrap items-end gap-4'>
          <div className='w-32'>
            <FormField
              label={MSG_D07.CATEGORY}
              htmlFor={categoryId}
              labelId={`${categoryId}-label`}
            >
              <TextField
                id={categoryId}
                select
                slotProps={{
                  select: {
                    SelectDisplayProps: {
                      'aria-labelledby': `${categoryId}-label`,
                    } as object,
                  },
                }}
                fullWidth
                value={category}
                disabled={isUploading}
                onChange={(e) =>
                  onCategoryChange(e.target.value as GalleryCategory)
                }
              >
                {GALLERY_CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {GALLERY_CATEGORY_LABEL[c]}
                  </MenuItem>
                ))}
              </TextField>
            </FormField>
          </div>
          <div className='min-w-40 flex-1'>
            <FormField label={MSG_D07.DESCRIPTION} htmlFor={descriptionId}>
              <TextField
                id={descriptionId}
                fullWidth
                value={description}
                placeholder={MSG_D07.DESCRIPTION_PH}
                disabled={isUploading}
                onChange={(e) => onDescriptionChange(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 200 } }}
              />
            </FormField>
          </div>
          <input
            ref={inputRef}
            type='file'
            accept={UPLOAD_CONTENT_TYPES.join(',')}
            hidden
            onChange={handleFile}
          />
          <Button
            variant='contained'
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            startIcon={
              isUploading ? (
                <CircularProgress size={16} color='inherit' />
              ) : (
                <Iconify icon='solar:upload-linear' />
              )
            }
          >
            {isUploading ? MSG_UPLOAD.UPLOADING : MSG_UPLOAD.SELECT}
          </Button>
        </div>
        {errorMessage ? (
          <Typo.Caption.Regular color='error.main' role='alert'>
            {errorMessage}
          </Typo.Caption.Regular>
        ) : null}
      </div>
    </Card>
  );
}
