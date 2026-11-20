// ----------------------------------------------------------------------
// 등급별 매수(크게 — title 18, design §6.1b · 지휘자 결정): 기본 등급 = 글자 · 할인(링크 전용) 등급 = info Label ·
// 직접 입력 줄 = outline Label. 할인 줄에는 "링크 전용(할인)" 글자를 함께 붙인다(색만으로 알리지 않음). 화면 읽기는 "등급별 매수: 일반 3 · 스태프 1" 한 줄로 읽힌다.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import type { AdmissionLine } from '@/src/api/admission-mapper';
import { Typo } from '@/src/components/typo';
import { MSG_D13 } from '@/src/shared/messages/d13';
import { RADIUS } from '@/src/theme/layout-tokens';

interface AdmissionTierLinesProps {
  lines: AdmissionLine[];
  ariaText: string;
}

function lineSx(line: AdmissionLine) {
  if (line.isCustom)
    return {
      px: 2,
      borderRadius: `${RADIUS.sm}px`,
      border: 1,
      borderColor: 'text.secondary',
      color: 'text.primary',
    };
  if (line.isDiscount)
    return {
      px: 2,
      borderRadius: `${RADIUS.sm}px`,
      bgcolor: 'semantic.label.info.bg',
      color: 'semantic.label.info.fg',
    };
  return { color: 'text.primary' };
}

export function AdmissionTierLines({
  lines,
  ariaText,
}: AdmissionTierLinesProps) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <span className='sr-only'>{ariaText}</span>
      {lines.map((line) => (
        <Box
          key={`${line.tierName}-${line.isCustom}`}
          component='span'
          aria-hidden
          data-tier-kind={
            line.isCustom ? 'custom' : line.isDiscount ? 'discount' : 'public'
          }
          sx={lineSx(line)}
        >
          <Typo.Title.Semibold color='inherit'>
            {`${line.tierName} ${line.quantity}`}
          </Typo.Title.Semibold>
          {line.isDiscount ? (
            <Typo.Caption.Semibold color='inherit' sx={{ ml: 1 }}>
              {MSG_D13.DISCOUNT}
            </Typo.Caption.Semibold>
          ) : null}
        </Box>
      ))}
    </div>
  );
}
