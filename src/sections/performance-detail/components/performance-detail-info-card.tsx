// ----------------------------------------------------------------------
// "공연 정보" 카드 — 포스터 96(2:3, 없으면 "포스터 없음" 자리) + 2열 정보(designer `.d04-info`).
// 공연명·타입·상태·등록일·[D5] 홈페이지 노출·상세 이미지 [n]장·설명(2열 걸침, 없으면 숨김 — 현행 :220).
// xs 는 포스터가 위. 오른쪽 위 "수정"(outlined sm).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import type { ReactNode } from 'react';

import { Iconify } from '@/src/components/iconify';
import { UploadThumb } from '@/src/components/image-upload-field/upload-thumb';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { PerformanceDetailSectionCard } from '@/src/sections/performance-detail/components/performance-detail-section-card';
import type { PerformanceInfoDisplay } from '@/src/sections/performance-detail/utils/performance-detail-display';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D04 } from '@/src/shared/messages/d04';
import { MSG_PERF_FORM } from '@/src/shared/messages/performance-form';
import { LAYOUT } from '@/src/theme/layout-tokens';

/** 포스터 2:3 — 폭 96(avatarXl) → 높이 144 */
const POSTER_HEIGHT = (LAYOUT.avatarXl * 3) / 2;

interface PerformanceDetailInfoCardProps {
  info: PerformanceInfoDisplay;
  onEdit: () => void;
}

interface InfoItemProps {
  label: string;
  children: ReactNode;
  isWide?: boolean;
}

function InfoItem({ label, children, isWide = false }: InfoItemProps) {
  return (
    <div
      className={
        isWide
          ? 'col-span-2 flex min-w-0 flex-col gap-1'
          : 'flex min-w-0 flex-col gap-1'
      }
    >
      <Typo.Caption.Regular component='dt' color='text.secondary'>
        {label}
      </Typo.Caption.Regular>
      <dd className='m-0 min-w-0 break-words'>{children}</dd>
    </div>
  );
}

export function PerformanceDetailInfoCard({
  info,
  onEdit,
}: PerformanceDetailInfoCardProps) {
  return (
    <PerformanceDetailSectionCard
      title={MSG_D04.INFO_TITLE}
      action={
        <Button
          variant='outlined'
          color='inherit'
          size='small'
          onClick={onEdit}
          startIcon={<Iconify icon='solar:pen-linear' />}
        >
          {MSG_COMMON.EDIT}
        </Button>
      }
    >
      <div className='flex flex-col gap-6 sm:flex-row'>
        <UploadThumb
          src={info.posterImageUrl}
          alt={info.posterImageUrl ? MSG_PERF_FORM.POSTER : MSG_D04.NO_POSTER}
          shape='portrait'
          size={POSTER_HEIGHT}
        />
        <dl className='m-0 grid flex-1 grid-cols-2 gap-x-6 gap-y-4'>
          <InfoItem label={MSG_D04.INFO_NAME}>
            <Typo.Badge.Medium>{info.title}</Typo.Badge.Medium>
          </InfoItem>
          <InfoItem label={MSG_D04.INFO_TYPE}>
            <Typo.Badge.Medium>{info.typeLabel}</Typo.Badge.Medium>
          </InfoItem>
          <InfoItem label={MSG_D04.INFO_STATUS}>
            <Label tone={info.statusTone}>{info.statusLabel}</Label>
          </InfoItem>
          <InfoItem label={MSG_D04.INFO_CREATED}>
            <Typo.Badge.Regular>{info.createdAtText}</Typo.Badge.Regular>
          </InfoItem>
          <InfoItem label={MSG_COMMON.VISIBLE_LABEL}>
            <span className='inline-flex items-center gap-1'>
              <Iconify
                icon={
                  info.isVisible
                    ? 'solar:eye-linear'
                    : 'solar:eye-closed-linear'
                }
                sx={{
                  color: info.isVisible ? 'text.primary' : 'text.secondary',
                }}
              />
              <Typo.Badge.Regular
                color={info.isVisible ? 'text.primary' : 'text.secondary'}
              >
                {info.visibleText}
              </Typo.Badge.Regular>
            </span>
          </InfoItem>
          <InfoItem label={MSG_D04.INFO_DETAIL_IMAGES}>
            <Typo.Badge.Regular>{info.detailImageCountText}</Typo.Badge.Regular>
          </InfoItem>
          {info.description ? (
            <InfoItem label={MSG_D04.INFO_DESCRIPTION} isWide>
              <Typo.Badge.Regular sx={{ whiteSpace: 'pre-line' }}>
                {info.description}
              </Typo.Badge.Regular>
            </InfoItem>
          ) : null}
        </dl>
      </div>
    </PerformanceDetailSectionCard>
  );
}
