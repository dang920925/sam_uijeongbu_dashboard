'use client';

// ----------------------------------------------------------------------
// 검색 결과 0(design SCR-D13 상태) — 문구 + [현장 예매 등록]. 회차에 예매가 하나도 없을 때도 같은 틀(문구만 다름).
// ----------------------------------------------------------------------
import Card from '@mui/material/Card';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { AdmissionOnsiteButton } from '@/src/sections/admission/components/admission-onsite-button';

interface AdmissionNoResultProps {
  message: string;
  onOnsite: () => void;
}

export function AdmissionNoResult({
  message,
  onOnsite,
}: AdmissionNoResultProps) {
  return (
    <Card>
      <div className='flex flex-col items-center gap-4 px-4 py-12 text-center'>
        <Iconify
          icon='solar:magnifier-linear'
          size='lg'
          sx={{ color: 'text.secondary' }}
        />
        <Typo.Body.Regular>{message}</Typo.Body.Regular>
        <AdmissionOnsiteButton onClick={onOnsite} />
      </div>
    </Card>
  );
}
