'use client';

// ----------------------------------------------------------------------
// 갤러리(SCR-D07) View — 머리 → 업로드 카드 → 카테고리 pill → 그리드 영역(content, 상태는 Container 가 고름).
// props 만으로 렌더한다. 삭제 확인은 ConfirmDialog(현행 window.confirm 대체, D11).
// ----------------------------------------------------------------------
import type { ReactNode } from 'react';

import { ConfirmDialog } from '@/src/components/confirm-dialog';
import { PageContainer } from '@/src/components/page-container';
import { PageHead } from '@/src/components/page-head';
import { SectionStack } from '@/src/components/section-stack';
import { SegmentPill, type SegmentOption } from '@/src/components/segment-pill';
import { GalleryUploadCard } from '@/src/sections/gallery/components/gallery-upload-card';
import type { GalleryFilter } from '@/src/sections/gallery/utils/gallery-tile';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D07 } from '@/src/shared/messages/d07';
import type { GalleryCategory } from '@/src/types/codes';

interface GalleryViewProps {
  upload: {
    category: GalleryCategory;
    description: string;
    isUploading: boolean;
    errorMessage: string | null;
    onCategoryChange: (category: GalleryCategory) => void;
    onDescriptionChange: (value: string) => void;
    onFileSelect: (file: File) => void;
  };
  filter: GalleryFilter;
  filterOptions: SegmentOption<GalleryFilter>[];
  onFilterChange: (filter: GalleryFilter) => void;
  content: ReactNode;
  isDeleteOpen: boolean;
  isDeleting: boolean;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}

export function GalleryView({
  upload,
  filter,
  filterOptions,
  onFilterChange,
  content,
  isDeleteOpen,
  isDeleting,
  onDeleteCancel,
  onDeleteConfirm,
}: GalleryViewProps) {
  return (
    <PageContainer>
      <SectionStack>
        <PageHead title={MSG_D07.TITLE} subtitle={MSG_D07.SUBTITLE} />
        <GalleryUploadCard {...upload} />
        <SegmentPill
          ariaLabel={MSG_D07.FILTER_ARIA}
          options={filterOptions}
          value={filter}
          onChange={onFilterChange}
        />
        {content}
      </SectionStack>
      <ConfirmDialog
        open={isDeleteOpen}
        message={MSG_D07.DELETE_CONFIRM}
        confirmLabel={MSG_COMMON.DELETE}
        isLoading={isDeleting}
        onConfirm={onDeleteConfirm}
        onCancel={onDeleteCancel}
      />
    </PageContainer>
  );
}
