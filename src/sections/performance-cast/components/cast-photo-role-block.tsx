'use client';

// ----------------------------------------------------------------------
// (U48) '캐스트 사진' ③ 배역 사진 — 배역 블록(xl 2열) × 배우 줄: 3:4 썸네일 · 이름 + 팀 칩 · 홈페이지에 보이는 모양 ·
// 교체·삭제(배역 사진 있음) / "사진 올리기"(없음) / 올리는 중 / 실패(문구 + 다시 시도). xs 는 동작이 정보 아래로.
// (U51) 썸네일은 배역 카드 비율·저장된 위치대로 잘려 보이고(누르면 조정 창), 상태 "배역 사진 · 위치 조정됨/가운데",
// 동작에 [위치 조정](crop 아이콘 + 글자, 44).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { CastPhotoFrame } from '@/src/sections/performance-cast/components/cast-photo-frame';
import { PhotoDropButton } from '@/src/sections/performance-cast/components/photo-drop-button';
import { PhotoFilePicker } from '@/src/sections/performance-cast/components/photo-file-picker';
import { PhotoUploadError } from '@/src/sections/performance-cast/components/photo-upload-error';
import type {
  ActorPhotoRow,
  ActorPhotoSource,
  RolePhotoBlock,
} from '@/src/sections/performance-cast/utils/cast-photo-rows';
import type { CastPhotoSection } from '@/src/sections/performance-cast/view/use-cast-photo-section';
import { MSG_D14 } from '@/src/shared/messages/d14';
import { LAYOUT, RADIUS } from '@/src/theme/layout-tokens';

interface CastPhotoRoleBlockProps {
  blocks: RolePhotoBlock[];
  /** 배역 카드 비율(가로/세로) */
  cardAspect: number;
  section: CastPhotoSection;
}

const ICON_SX = { width: LAYOUT.touch, height: LAYOUT.touch };

const SOURCE: Record<
  ActorPhotoSource,
  { icon: string; text: string; color: string }
> = {
  role: {
    icon: 'solar:check-circle-linear',
    text: MSG_D14.PHOTO_SRC_ROLE,
    color: 'success.main',
  },
  profile: {
    icon: 'solar:user-rounded-linear',
    text: MSG_D14.PHOTO_SRC_PROFILE,
    color: 'text.secondary',
  },
  silhouette: {
    icon: 'solar:ghost-linear',
    text: MSG_D14.PHOTO_SRC_SILHOUETTE,
    color: 'semantic.alert.warningFg',
  },
  hidden: {
    icon: 'solar:eye-closed-linear',
    text: MSG_D14.PHOTO_SRC_HIDDEN,
    color: 'text.secondary',
  },
  unknown: {
    icon: 'solar:user-rounded-linear',
    text: MSG_D14.PHOTO_SRC_UNKNOWN,
    color: 'text.secondary',
  },
};

export function CastPhotoRoleBlock({
  blocks,
  cardAspect,
  section,
}: CastPhotoRoleBlockProps) {
  const row = (item: ActorPhotoRow) => {
    const isBusy = item.upload !== null && item.upload.phase !== 'error';
    const isError = item.upload?.phase === 'error';
    const source =
      item.source === 'role'
        ? {
            ...SOURCE.role,
            text: item.isAdjusted
              ? MSG_D14.STATUS_ADJUSTED
              : MSG_D14.STATUS_CENTER,
          }
        : SOURCE[item.source];
    const adjustLabel = MSG_D14.ADJUST_ROLE_ARIA(item.roleLabel, item.name);
    const frame = (open: () => void) => (
      <CastPhotoFrame
        ratio={cardAspect}
        imageUrl={item.rolePhotoUrl}
        photoStyle={item.photoStyle}
        alt={MSG_D14.PHOTO_ROLE_ALT(item.roleLabel, item.name)}
        upload={item.upload}
        sizes='72px'
      >
        <PhotoDropButton
          icon={
            isError ? 'solar:danger-triangle-linear' : 'solar:upload-linear'
          }
          help={isError ? undefined : MSG_D14.PHOTO_UPLOAD_SHORT}
          ariaLabel={MSG_D14.PHOTO_ROLE_UPLOAD_ARIA(item.roleLabel, item.name)}
          onClick={open}
        />
      </CastPhotoFrame>
    );
    return (
      <li key={item.slotKey} data-testid='cast-photo-row'>
        <PhotoFilePicker
          onFile={(file) => section.onUploadRole(item, file)}
          inputLabel={MSG_D14.PHOTO_ROLE_UPLOAD_ARIA(item.roleLabel, item.name)}
        >
          {(open) => (
            <div className='grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 py-2 md:grid-cols-[72px_minmax(0,1fr)_auto]'>
              {item.rolePhotoUrl && !isBusy ? (
                <ButtonBase
                  aria-label={adjustLabel}
                  onClick={() => section.onAdjustRole(item)}
                  sx={{
                    display: 'block',
                    width: '100%',
                    borderRadius: `${RADIUS.sm}px`,
                  }}
                >
                  {frame(open)}
                </ButtonBase>
              ) : (
                frame(open)
              )}
              <div className='flex min-w-0 flex-col gap-1'>
                <span className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                  <Typo.Badge.Semibold>{item.name}</Typo.Badge.Semibold>
                  {item.teamLabels.map((label) => (
                    <Box
                      key={label}
                      component='span'
                      className='px-2'
                      sx={{
                        border: 1,
                        borderColor: 'semantic.input.borderStrong',
                        borderRadius: `${RADIUS.pill}px`,
                        color: 'text.secondary',
                      }}
                    >
                      <Typo.Caption.Semibold color='inherit'>
                        {MSG_D14.PHOTO_TEAM_NAME(label)}
                      </Typo.Caption.Semibold>
                    </Box>
                  ))}
                </span>
                {isBusy ? (
                  <Typo.Caption.Regular color='text.secondary' role='status'>
                    {MSG_D14.PHOTO_UPLOADING}
                  </Typo.Caption.Regular>
                ) : isError ? null : (
                  <span className='flex items-center gap-1'>
                    <Iconify
                      icon={source.icon}
                      sx={{ color: source.color, flexShrink: 0 }}
                    />
                    <Typo.Caption.Regular color={source.color}>
                      {source.text}
                    </Typo.Caption.Regular>
                  </span>
                )}
              </div>
              <div className='col-start-2 flex items-center gap-1 md:col-start-auto'>
                {isError && item.upload ? (
                  <PhotoUploadError
                    message={item.upload.errorMessage ?? MSG_D14.PHOTO_FAILED}
                    canRetry={item.upload.canRetry}
                    onRetry={() => section.onRetryUpload(item.slotKey)}
                    onDismiss={() => section.onDismissUpload(item.slotKey)}
                  />
                ) : isBusy ? null : item.rolePhotoUrl ? (
                  <>
                    <Button
                      size='small'
                      variant='outlined'
                      color='inherit'
                      aria-label={adjustLabel}
                      onClick={() => section.onAdjustRole(item)}
                      startIcon={<Iconify icon='solar:crop-linear' />}
                    >
                      {MSG_D14.ADJUST}
                    </Button>
                    <IconButton
                      aria-label={MSG_D14.PHOTO_ROLE_REPLACE_ARIA(
                        item.roleLabel,
                        item.name
                      )}
                      onClick={open}
                      sx={{ ...ICON_SX, color: 'text.secondary' }}
                    >
                      <Iconify icon='solar:refresh-linear' />
                    </IconButton>
                    <IconButton
                      aria-label={MSG_D14.PHOTO_ROLE_DELETE_ARIA(
                        item.roleLabel,
                        item.name
                      )}
                      onClick={() => section.onDeleteRole(item)}
                      sx={{ ...ICON_SX, color: 'error.main' }}
                    >
                      <Iconify icon='solar:trash-bin-trash-linear' />
                    </IconButton>
                  </>
                ) : (
                  <Button
                    size='small'
                    variant='outlined'
                    color='inherit'
                    onClick={open}
                    startIcon={<Iconify icon='solar:upload-linear' />}
                  >
                    {MSG_D14.PHOTO_UPLOAD}
                  </Button>
                )}
              </div>
            </div>
          )}
        </PhotoFilePicker>
      </li>
    );
  };

  return (
    <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
      {blocks.map((block) => (
        <Box
          key={block.roleId}
          component='section'
          aria-label={block.label}
          className='px-4 py-3'
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: `${RADIUS.md}px`,
          }}
        >
          <div className='mb-2 flex items-center gap-2'>
            <Typo.Badge.Bold component='h4'>{block.label}</Typo.Badge.Bold>
            <Typo.Caption.Regular color='text.secondary'>
              {MSG_D14.PHOTO_ROLE_COUNT(block.actorCount)}
            </Typo.Caption.Regular>
          </div>
          <Box
            component='ul'
            className='m-0 flex list-none flex-col p-0'
            sx={{
              '& > li + li': { borderTop: 1, borderColor: 'divider' },
            }}
          >
            {block.rows.map(row)}
          </Box>
        </Box>
      ))}
    </div>
  );
}
