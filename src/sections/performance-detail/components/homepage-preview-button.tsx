'use client';

// ----------------------------------------------------------------------
// (U48) [홈페이지 미리보기] — 공연 상세 머리 오른쪽(SCR-D04 · SCR-D14). 30분 만료 안내는 버튼 설명(aria-describedby)
// 과 열고 난 스낵바로. 홈페이지 주소가 없으면 잠그고 같은 자리에 이유. props(화면 ViewModel 의 useHomepagePreview 결과)만으로 렌더.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import { useId } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import type { HomepagePreview } from '@/src/sections/performance-detail/view/use-homepage-preview';
import { MSG_D14 } from '@/src/shared/messages/d14';

interface HomepagePreviewButtonProps {
  preview: HomepagePreview;
}

export function HomepagePreviewButton({ preview }: HomepagePreviewButtonProps) {
  const helpId = useId();
  return (
    <div className='flex max-w-80 flex-col items-end gap-1'>
      <Button
        variant='outlined'
        color='inherit'
        size='small'
        onClick={preview.onOpen}
        disabled={preview.isDisabled}
        loading={preview.isPending}
        aria-describedby={helpId}
        startIcon={<Iconify icon='solar:eye-linear' />}
      >
        {MSG_D14.PREVIEW_BUTTON}
      </Button>
      <Typo.Caption.Regular
        id={helpId}
        color='text.secondary'
        sx={{ textAlign: 'right' }}
      >
        {preview.help}
      </Typo.Caption.Regular>
    </div>
  );
}
