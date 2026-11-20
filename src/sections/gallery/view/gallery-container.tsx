'use client';

// ----------------------------------------------------------------------
// 갤러리(SCR-D07) 컨테이너 — 그리드 영역 상태 분기만: 로딩 스켈레톤 / 오류 "다시 시도" / 빈 / 그리드.
// 업로드 카드·필터는 상태와 무관하게 늘 보인다(빈 상태에서도 첫 업로드를 해야 하므로).
// ----------------------------------------------------------------------
import { EmptyContent } from '@/src/components/empty-content';
import { ErrorRetry } from '@/src/components/error-retry';
import { GalleryGrid } from '@/src/sections/gallery/components/gallery-grid';
import { GalleryGridSkeleton } from '@/src/sections/gallery/components/gallery-grid-skeleton';
import { GalleryView } from '@/src/sections/gallery/view/gallery-view';
import { useGalleryViewModel } from '@/src/sections/gallery/view/use-gallery-view-model';
import { MSG_D07 } from '@/src/shared/messages/d07';

export function GalleryContainer() {
  const vm = useGalleryViewModel();

  const content = vm.isLoading ? (
    <GalleryGridSkeleton />
  ) : vm.isError ? (
    <ErrorRetry message={vm.errorMessage} onRetry={vm.onRetry} />
  ) : vm.tiles.length === 0 ? (
    <EmptyContent message={MSG_D07.EMPTY} icon='solar:gallery-linear' />
  ) : (
    <GalleryGrid tiles={vm.tiles} onDelete={vm.onDeleteRequest} />
  );

  return (
    <GalleryView
      upload={vm.upload}
      filter={vm.filter}
      filterOptions={vm.filterOptions}
      onFilterChange={vm.onFilterChange}
      content={content}
      isDeleteOpen={vm.isDeleteOpen}
      isDeleting={vm.isDeleting}
      onDeleteCancel={vm.onDeleteCancel}
      onDeleteConfirm={vm.onDeleteConfirm}
    />
  );
}
