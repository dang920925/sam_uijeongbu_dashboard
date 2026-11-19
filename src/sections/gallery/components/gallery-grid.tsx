// ----------------------------------------------------------------------
// 갤러리 정사각 그리드 — 2 → sm 3 → md 4 → lg 5열, gap 16(design SCR-D07 · 현행 Gallery.tsx:166).
// ----------------------------------------------------------------------
import { GalleryTileItem } from '@/src/sections/gallery/components/gallery-tile-item';
import type { GalleryTileModel } from '@/src/sections/gallery/utils/gallery-tile';
import { MSG_D07 } from '@/src/shared/messages/d07';

interface GalleryGridProps {
  tiles: GalleryTileModel[];
  onDelete: (id: string) => void;
}

export function GalleryGrid({ tiles, onDelete }: GalleryGridProps) {
  return (
    <ul
      aria-label={MSG_D07.GRID_ARIA}
      className='m-0 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
    >
      {tiles.map((tile) => (
        <li key={tile.id}>
          <GalleryTileItem tile={tile} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}
