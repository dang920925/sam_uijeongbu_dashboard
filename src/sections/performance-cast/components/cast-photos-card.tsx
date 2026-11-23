'use client';

// ----------------------------------------------------------------------
// (U48) SCR-D14 '캐스트 사진' 카드(designer §19.4 · U48-SCR-D14.html) — '팀 구성' 아래.
// 머리: 제목 + 도움말 | "배역 사진 n / 총" 진행 막대 · "홈페이지에서 보기"(공개 켜짐 + 홈페이지 주소 있을 때).
// 본문: 공개 안내(켜짐 info / 꺼짐 warning) → ① 단체샷 → ② 팀샷 → ③ 배역 사진(보기 pill 전체 / 사진 없음).
// 로딩 스켈레톤 · 조회 실패 "다시 시도". props 만으로 렌더.
// (U51) 본문 맨 위 '배역 카드 비율'(공연 하나 — 3:4 | 2:3 | 4:5 | 1:1) + '보이는 위치 조정' 창(열렸을 때만).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import { useId, type ReactNode } from 'react';

import { ErrorRetry } from '@/src/components/error-retry';
import { Iconify } from '@/src/components/iconify';
import { SegmentPill } from '@/src/components/segment-pill';
import { Typo } from '@/src/components/typo';
import { CastPhotoGroupBlock } from '@/src/sections/performance-cast/components/cast-photo-group-block';
import { CastPhotoRoleBlock } from '@/src/sections/performance-cast/components/cast-photo-role-block';
import { CastPhotoTeamBlock } from '@/src/sections/performance-cast/components/cast-photo-team-block';
import type { CastPhotoFilter } from '@/src/sections/performance-cast/utils/cast-photo-rows';
import { ROLE_CARD_RATIOS } from '@/src/sections/performance-cast/utils/photo-crop';
import { PhotoCropDialogContainer } from '@/src/sections/performance-cast/view/photo-crop-dialog-container';
import type { CastPhotoSection } from '@/src/sections/performance-cast/view/use-cast-photo-section';
import { MSG_D14 } from '@/src/shared/messages/d14';

interface CastPhotosCardProps {
  section: CastPhotoSection;
  isPublic: boolean;
  /** 공개 켜짐일 때 '홈페이지에서 보기' 주소(없으면 버튼 없음) */
  homepageUrl: string | null;
}

function Block({
  title,
  help,
  children,
}: {
  title: string;
  help: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        '& + &': { borderTop: 1, borderColor: 'divider', pt: 6, mt: 6 },
      }}
    >
      <div className='mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1'>
        <Typo.Badge.Bold component='h3'>{title}</Typo.Badge.Bold>
        <Typo.Caption.Regular color='text.secondary'>
          {help}
        </Typo.Caption.Regular>
      </div>
      {children}
    </Box>
  );
}

export function CastPhotosCard({
  section,
  isPublic,
  homepageUrl,
}: CastPhotosCardProps) {
  const titleId = useId();
  const board = section.board;
  const meter = board?.meter ?? { have: 0, total: 0 };
  const percent =
    meter.total === 0 ? 0 : Math.round((meter.have / meter.total) * 100);

  const filterOptions: { value: CastPhotoFilter; label: string }[] = [
    { value: 'all', label: MSG_D14.PHOTO_FILTER_ALL(board?.counts.all ?? 0) },
    {
      value: 'missing',
      label: MSG_D14.PHOTO_FILTER_MISSING(board?.counts.missing ?? 0),
    },
  ];

  const body =
    section.status === 'loading' || !board ? (
      section.status === 'error' ? (
        <ErrorRetry
          message={section.errorMessage ?? MSG_D14.PHOTO_ERROR}
          onRetry={section.onRetry}
        />
      ) : (
        <Skeleton variant='rounded' height={160} />
      )
    ) : (
      <>
        <div className='mb-6 flex flex-col gap-2' data-testid='cast-card-ratio'>
          <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
            <Typo.Badge.Bold component='h3'>
              {MSG_D14.CARD_RATIO_LABEL}
            </Typo.Badge.Bold>
            <Typo.Caption.Regular color='text.secondary'>
              {MSG_D14.CARD_RATIO_HELP}
            </Typo.Caption.Regular>
          </div>
          <SegmentPill
            options={ROLE_CARD_RATIOS.map((value) => ({ value, label: value }))}
            value={board.cardRatio}
            onChange={section.cardRatio.onChange}
            ariaLabel={MSG_D14.CARD_RATIO_LABEL}
          />
        </div>
        <Box
          role='note'
          className='mb-6 flex items-start gap-2 px-4 py-3'
          sx={{
            borderRadius: 2,
            border: 1,
            borderColor: isPublic
              ? 'transparent'
              : 'semantic.alert.warningBorder',
            bgcolor: isPublic
              ? 'semantic.alert.infoBg'
              : 'semantic.alert.warningBg',
            color: isPublic
              ? 'semantic.alert.infoFg'
              : 'semantic.alert.warningFg',
          }}
        >
          <Iconify
            icon={
              isPublic ? 'solar:info-circle-linear' : 'solar:eye-closed-linear'
            }
            sx={{ flexShrink: 0 }}
          />
          <Typo.Badge.Medium color='inherit'>
            {isPublic ? MSG_D14.PHOTO_INFO_PUBLIC : MSG_D14.PHOTO_INFO_PRIVATE}
          </Typo.Badge.Medium>
        </Box>
        <Block
          title={MSG_D14.PHOTO_GROUP_TITLE}
          help={MSG_D14.PHOTO_GROUP_HELP(board.groupMax)}
        >
          <CastPhotoGroupBlock board={board} section={section} />
        </Block>
        <Block title={MSG_D14.PHOTO_TEAM_TITLE} help={MSG_D14.PHOTO_TEAM_HELP}>
          <CastPhotoTeamBlock teams={board.teams} section={section} />
        </Block>
        <Block title={MSG_D14.PHOTO_ROLE_TITLE} help={MSG_D14.PHOTO_ROLE_HELP}>
          {board.hasActors ? (
            <div className='flex flex-col gap-3'>
              <SegmentPill
                options={filterOptions}
                value={section.filter}
                onChange={section.onFilter}
                ariaLabel={MSG_D14.PHOTO_FILTER_ARIA}
              />
              {board.blocks.length === 0 ? (
                <Typo.Badge.Regular color='text.secondary'>
                  {MSG_D14.PHOTO_ROLE_MISSING_NONE}
                </Typo.Badge.Regular>
              ) : (
                <CastPhotoRoleBlock
                  blocks={board.blocks}
                  cardAspect={board.cardAspect}
                  section={section}
                />
              )}
            </div>
          ) : (
            <Typo.Badge.Regular color='text.secondary'>
              {MSG_D14.PHOTO_ROLE_NONE}
            </Typo.Badge.Regular>
          )}
        </Block>
      </>
    );

  return (
    <Card
      component='section'
      aria-labelledby={titleId}
      data-testid='cast-photos-card'
    >
      <div className='flex flex-wrap items-start justify-between gap-x-4 gap-y-3 p-4 md:p-6'>
        <div className='flex flex-col gap-1'>
          <Typo.Title.Bold component='h2' id={titleId}>
            {MSG_D14.PHOTO_TITLE}
          </Typo.Title.Bold>
          <Typo.Badge.Regular color='text.secondary'>
            {MSG_D14.PHOTO_HELP}
          </Typo.Badge.Regular>
        </div>
        {board ? (
          <div className='flex flex-wrap items-center gap-3'>
            <div className='flex min-w-32 flex-col gap-1'>
              <Typo.Caption.Regular color='text.secondary'>
                {MSG_D14.PHOTO_METER}{' '}
                <Typo.Caption.Semibold component='b' color='text.primary'>
                  {`${meter.have} / ${meter.total}`}
                </Typo.Caption.Semibold>
              </Typo.Caption.Regular>
              <LinearProgress
                variant='determinate'
                value={percent}
                aria-label={MSG_D14.PHOTO_METER_ARIA}
                aria-valuetext={`${meter.have} / ${meter.total}`}
              />
            </div>
            {isPublic && homepageUrl ? (
              <Button
                size='small'
                variant='outlined'
                color='inherit'
                href={homepageUrl}
                target='_blank'
                rel='noopener noreferrer'
                startIcon={
                  <Iconify icon='solar:square-arrow-right-up-linear' />
                }
              >
                {MSG_D14.PHOTO_VIEW_HOMEPAGE}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className='px-4 pb-4 md:px-6 md:pb-6'>{body}</div>
      {section.editor.request ? (
        <PhotoCropDialogContainer
          key={section.editor.request.key}
          request={section.editor.request}
          onSave={section.editor.onSave}
          onClose={section.editor.onClose}
        />
      ) : null}
    </Card>
  );
}
