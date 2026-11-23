// ----------------------------------------------------------------------
// (U51) 조정 창 '홈페이지 미리보기' — 끄는 대로 바로 바뀜(전환 없음). 크기 비율은 실제와 같게 줄임(designer §21.2).
// - 배역: 모바일 카드 · PC 카드(폭 100:164) · 보드 썸네일 32·48(실제 크기, 1:1 원형).
// - 단체·팀샷: 모바일 · PC(같은 비율 — 고른 비율은 모든 화면 크기에 같게). 원본이면 원본 비율 전체.
// props 만으로 렌더.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { CroppedPhoto } from '@/src/sections/performance-cast/components/cropped-photo';
import type { PhotoCropEditor } from '@/src/sections/performance-cast/view/use-photo-crop-editor';
import { MSG_D14 } from '@/src/shared/messages/d14';
import { LAYOUT, RADIUS } from '@/src/theme/layout-tokens';

interface PhotoCropPreviewProps {
  editor: PhotoCropEditor;
}

/** 미리보기 폭(px, 4px 격자) — 모바일 카드 : PC 카드 ≈ 100 : 163 */
const ROLE_W = { mobile: { xs: 56, md: 100 }, pc: { xs: 92, md: 164 } };
const WIDE_W = { mobile: 112, pc: 184 };

function Caption({ icon, text }: { icon: string; text: string }) {
  return (
    <span className='flex items-center gap-1'>
      <Iconify icon={icon} size='sm' sx={{ color: 'text.secondary' }} />
      <Typo.Caption.Regular color='text.secondary'>{text}</Typo.Caption.Regular>
    </span>
  );
}

export function PhotoCropPreview({ editor }: PhotoCropPreviewProps) {
  const { preview } = editor;
  const box = (ratio: number, width: number | { xs: number; md: number }) => ({
    position: 'relative' as const,
    width,
    aspectRatio: `${ratio}`,
    overflow: 'hidden',
    borderRadius: `${RADIUS.md}px`,
    bgcolor: 'semantic.surface.muted',
    flexShrink: 0,
  });
  const originalRatio = preview.size
    ? preview.size.width / preview.size.height
    : 16 / 9;

  const items =
    editor.kind === 'role' && preview.card && preview.thumb ? (
      <>
        {[
          {
            w: ROLE_W.mobile,
            icon: 'solar:smartphone-linear',
            text: MSG_D14.CROP_PREVIEW_MOBILE_CARD,
          },
          {
            w: ROLE_W.pc,
            icon: 'solar:monitor-linear',
            text: MSG_D14.CROP_PREVIEW_PC_CARD,
          },
        ].map((item) => (
          <figure key={item.text} className='m-0 flex flex-col gap-1'>
            <Box sx={box(preview.card?.ratio ?? 0.75, item.w)}>
              <CroppedPhoto
                src={preview.imageUrl}
                alt=''
                cropStyle={preview.card?.style ?? null}
                sizes='164px'
              />
            </Box>
            <Caption icon={item.icon} text={item.text} />
          </figure>
        ))}
        <figure className='m-0 flex flex-col gap-1'>
          <Box
            className='flex items-center gap-3 px-3 py-2'
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: `${RADIUS.md}px`,
            }}
          >
            {[LAYOUT.avatarSm, LAYOUT.avatarMd].map((side) => (
              <Box
                key={side}
                sx={{ ...box(1, side), borderRadius: `${RADIUS.pill}px` }}
              >
                <CroppedPhoto
                  src={preview.imageUrl}
                  alt=''
                  cropStyle={preview.thumb?.style ?? null}
                  sizes='48px'
                />
              </Box>
            ))}
          </Box>
          <Caption
            icon='solar:user-rounded-linear'
            text={MSG_D14.CROP_PREVIEW_BOARD}
          />
        </figure>
      </>
    ) : (
      [
        {
          w: WIDE_W.mobile,
          icon: 'solar:smartphone-linear',
          text: MSG_D14.CROP_PREVIEW_MOBILE,
        },
        {
          w: WIDE_W.pc,
          icon: 'solar:monitor-linear',
          text: MSG_D14.CROP_PREVIEW_PC,
        },
      ].map((item) => (
        <figure key={item.text} className='m-0 flex flex-col gap-1'>
          <Box sx={box(preview.card?.ratio ?? originalRatio, item.w)}>
            <CroppedPhoto
              src={preview.imageUrl}
              alt=''
              cropStyle={preview.card?.style ?? null}
              sizes='184px'
            />
          </Box>
          <Caption icon={item.icon} text={item.text} />
        </figure>
      ))
    );

  return (
    <section
      aria-label={MSG_D14.CROP_PREVIEW_TITLE}
      className='flex min-w-0 flex-col gap-3'
      data-testid='crop-preview'
    >
      <div className='flex flex-col gap-1'>
        <Typo.Badge.Bold component='h3'>
          {MSG_D14.CROP_PREVIEW_TITLE}
        </Typo.Badge.Bold>
        <Typo.Caption.Regular color='text.secondary'>
          {MSG_D14.CROP_PREVIEW_HELP}
        </Typo.Caption.Regular>
      </div>
      <div className='flex flex-wrap items-end gap-3 md:gap-4'>{items}</div>
      <Box
        className='hidden pt-3 md:block'
        sx={{ borderTop: 1, borderColor: 'divider' }}
      >
        <Typo.Caption.Regular color='text.secondary'>
          {editor.kind === 'role'
            ? MSG_D14.CROP_NOTE_ROLE
            : MSG_D14.CROP_NOTE_WIDE}
        </Typo.Caption.Regular>
      </Box>
    </section>
  );
}
