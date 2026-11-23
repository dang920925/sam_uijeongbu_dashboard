'use client';

// ----------------------------------------------------------------------
// (U48) '캐스트 사진' ① 단체샷 — 최대 n장 그리드(xs 1 · md 2 · xl 4열), 16:9 + 순서 칩(첫 장 '대표').
// 장마다 ◀▶ 순서 · 교체 · 삭제(44). 남은 자리가 있으면 "단체샷 추가 n장 더". 한 장도 없으면 가로 점선 "단체샷 올리기".
// ----------------------------------------------------------------------
import IconButton from '@mui/material/IconButton';

import { Iconify } from '@/src/components/iconify';
import { CastPhotoFrame } from '@/src/sections/performance-cast/components/cast-photo-frame';
import { PhotoDropButton } from '@/src/sections/performance-cast/components/photo-drop-button';
import { PhotoFilePicker } from '@/src/sections/performance-cast/components/photo-file-picker';
import { PhotoUploadError } from '@/src/sections/performance-cast/components/photo-upload-error';
import type {
  CastPhotoBoard,
  GroupPhotoTile,
} from '@/src/sections/performance-cast/utils/cast-photo-rows';
import { castPhotoSlotKey } from '@/src/sections/performance-cast/utils/cast-photo-rows';
import type { CastPhotoSection } from '@/src/sections/performance-cast/view/use-cast-photo-section';
import { MSG_D14 } from '@/src/shared/messages/d14';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface CastPhotoGroupBlockProps {
  board: CastPhotoBoard;
  section: CastPhotoSection;
}

const ICON_SX = { width: LAYOUT.touch, height: LAYOUT.touch };
const GRID = 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4';

export function CastPhotoGroupBlock({
  board,
  section,
}: CastPhotoGroupBlockProps) {
  const add = board.groupAdd;
  const addError =
    add.upload?.phase === 'error' ? (
      <PhotoUploadError
        message={add.upload.errorMessage ?? MSG_D14.PHOTO_FAILED}
        canRetry={add.upload.canRetry}
        onRetry={() => section.onRetryUpload(castPhotoSlotKey.groupAdd)}
        onDismiss={() => section.onDismissUpload(castPhotoSlotKey.groupAdd)}
      />
    ) : null;
  const isAdding = add.upload !== null && add.upload.phase !== 'error';

  if (board.groups.length === 0 && !isAdding) {
    return (
      <div className='flex flex-col gap-2'>
        <PhotoFilePicker
          onFile={section.onAddGroup}
          inputLabel={MSG_D14.PHOTO_GROUP_UPLOAD}
        >
          {(open) => (
            <PhotoDropButton
              isRow
              label={MSG_D14.PHOTO_GROUP_UPLOAD}
              help={MSG_D14.PHOTO_GROUP_UPLOAD_HELP}
              onClick={open}
            />
          )}
        </PhotoFilePicker>
        {addError}
      </div>
    );
  }

  const tile = (item: GroupPhotoTile) => (
    <div key={item.id} className='flex min-w-0 flex-col gap-2'>
      <CastPhotoFrame
        ratio='16 / 9'
        imageUrl={item.imageUrl}
        alt={MSG_D14.PHOTO_GROUP_ALT(item.position)}
        upload={item.upload}
        badge={item.orderLabel}
      />
      <PhotoFilePicker
        onFile={(file) => section.onReplaceGroup(item, file)}
        inputLabel={MSG_D14.PHOTO_GROUP_REPLACE_ARIA(item.position)}
      >
        {(open) => (
          <div className='flex items-center gap-1'>
            <IconButton
              aria-label={MSG_D14.PHOTO_GROUP_LEFT_ARIA(item.position)}
              disabled={!item.canMoveLeft || section.isReordering}
              onClick={() => section.onMoveGroup(item, -1)}
              sx={ICON_SX}
            >
              <Iconify icon='solar:alt-arrow-left-linear' />
            </IconButton>
            <IconButton
              aria-label={MSG_D14.PHOTO_GROUP_RIGHT_ARIA(item.position)}
              disabled={!item.canMoveRight || section.isReordering}
              onClick={() => section.onMoveGroup(item, 1)}
              sx={ICON_SX}
            >
              <Iconify icon='solar:alt-arrow-right-linear' />
            </IconButton>
            <span className='flex-1' />
            <IconButton
              aria-label={MSG_D14.PHOTO_GROUP_REPLACE_ARIA(item.position)}
              disabled={item.upload !== null && item.upload.phase !== 'error'}
              onClick={open}
              sx={{ ...ICON_SX, color: 'text.secondary' }}
            >
              <Iconify icon='solar:refresh-linear' />
            </IconButton>
            <IconButton
              aria-label={MSG_D14.PHOTO_GROUP_DELETE_ARIA(item.position)}
              onClick={() => section.onDeleteGroup(item)}
              sx={{ ...ICON_SX, color: 'error.main' }}
            >
              <Iconify icon='solar:trash-bin-trash-linear' />
            </IconButton>
          </div>
        )}
      </PhotoFilePicker>
      {item.upload?.phase === 'error' ? (
        <PhotoUploadError
          message={item.upload.errorMessage ?? MSG_D14.PHOTO_FAILED}
          canRetry={item.upload.canRetry}
          onRetry={() => section.onRetryUpload(item.slotKey)}
          onDismiss={() => section.onDismissUpload(item.slotKey)}
        />
      ) : null}
    </div>
  );

  return (
    <div className={GRID}>
      {board.groups.map(tile)}
      {add.canAdd ? (
        <div className='flex min-w-0 flex-col gap-2'>
          <CastPhotoFrame
            ratio='16 / 9'
            imageUrl={null}
            alt=''
            upload={add.upload}
          >
            <PhotoFilePicker
              onFile={section.onAddGroup}
              inputLabel={MSG_D14.PHOTO_GROUP_ADD}
            >
              {(open) => (
                <PhotoDropButton
                  label={MSG_D14.PHOTO_GROUP_ADD}
                  help={MSG_D14.PHOTO_GROUP_ADD_LEFT(add.remaining)}
                  onClick={open}
                />
              )}
            </PhotoFilePicker>
          </CastPhotoFrame>
          {addError}
        </div>
      ) : null}
    </div>
  );
}
