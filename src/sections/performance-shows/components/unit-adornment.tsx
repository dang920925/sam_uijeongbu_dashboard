// ----------------------------------------------------------------------
// 입력칸 오른쪽 단위(매·시간·석·원) — designer 시안 `.d11-unit`(부가 글자, 클릭 통과).
// ----------------------------------------------------------------------
import InputAdornment from '@mui/material/InputAdornment';

import { Typo } from '@/src/components/typo';

interface UnitAdornmentProps {
  unit: string;
}

export function UnitAdornment({ unit }: UnitAdornmentProps) {
  return (
    <InputAdornment position='end' sx={{ pointerEvents: 'none' }}>
      <Typo.Caption.Regular color='text.secondary'>{unit}</Typo.Caption.Regular>
    </InputAdornment>
  );
}
