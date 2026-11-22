'use client';

// ----------------------------------------------------------------------
// SCR-D14 맨 위 공개 스위치(design §12) — "캐스트·참여자 홈페이지 공개"(기본 꺼짐) + 도움말 +
// 배우·연출진 노출은 단원 관리(D05)·연출진 관리(D09)에서 바꾼다는 안내 링크.
// ----------------------------------------------------------------------
import Link from '@mui/material/Link';
import NextLink from 'next/link';

import { paths } from '@/app/paths';
import { SwitchField } from '@/src/components/switch-field';
import { Typo } from '@/src/components/typo';
import { PerformanceDetailSectionCard } from '@/src/sections/performance-detail/components/performance-detail-section-card';
import { MSG_D14 } from '@/src/shared/messages/d14';

interface CastPublicCardProps {
  checked: boolean;
  isSaving: boolean;
  onChange: (checked: boolean) => void;
}

export function CastPublicCard({
  checked,
  isSaving,
  onChange,
}: CastPublicCardProps) {
  return (
    <PerformanceDetailSectionCard title={MSG_D14.PUBLIC_TITLE}>
      <div className='flex flex-col gap-2'>
        <SwitchField
          label={MSG_D14.PUBLIC_SWITCH}
          checked={checked}
          onChange={onChange}
          disabled={isSaving}
        />
        <Typo.Badge.Regular color='text.secondary'>
          {MSG_D14.PUBLIC_HELP}
        </Typo.Badge.Regular>
        <Typo.Caption.Regular color='text.secondary'>
          {MSG_D14.PUBLIC_LINKS_HELP}{' '}
          <Link component={NextLink} href={paths.members.root}>
            {MSG_D14.LINK_MEMBERS}
          </Link>
          {' · '}
          <Link component={NextLink} href={paths.staff}>
            {MSG_D14.LINK_STAFF}
          </Link>
        </Typo.Caption.Regular>
      </div>
    </PerformanceDetailSectionCard>
  );
}
