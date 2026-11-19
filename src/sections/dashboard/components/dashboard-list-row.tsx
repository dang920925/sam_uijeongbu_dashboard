// ----------------------------------------------------------------------
// 요약 카드 안 목록 행 — [주 항목](Body semibold) + 부가(Caption secondary) 왼쪽, 상태 배지 오른쪽.
// 행 위아래 12 + 구분선, 첫 행 위·끝 행 아래 여백 없음(designer `.d02-row`).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import type { LabelTone } from '@/src/theme/semantic';

interface DashboardListRowProps {
  primary: string;
  secondary: string;
  labelText: string;
  labelTone: LabelTone;
}

export function DashboardListRow({
  primary,
  secondary,
  labelText,
  labelTone,
}: DashboardListRowProps) {
  return (
    <Box
      component='li'
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 3,
        py: 3,
        borderBottom: 1,
        borderColor: 'divider',
        '&:first-of-type': { pt: 0 },
        '&:last-of-type': { pb: 0, borderBottom: 0 },
      }}
    >
      <div className='flex min-w-0 flex-col'>
        <Typo.Body.Semibold noWrap>{primary}</Typo.Body.Semibold>
        <Typo.Caption.Regular color='text.secondary'>
          {secondary}
        </Typo.Caption.Regular>
      </div>
      <Label tone={labelTone}>{labelText}</Label>
    </Box>
  );
}
