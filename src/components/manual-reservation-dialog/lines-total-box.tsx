// ----------------------------------------------------------------------
// LinesTotalBox — 합계 줄("등급 가격 합계 · 2매 · 24,000원") — muted 배경 상자(designer dialog-manual).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Typo } from '@/src/components/typo';

interface LinesTotalBoxProps {
  label: string;
  value: string;
}

export function LinesTotalBox({ label, value }: LinesTotalBoxProps) {
  return (
    <Box
      aria-live='polite'
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 3,
        px: 4,
        py: 3,
        borderRadius: 2,
        bgcolor: 'semantic.surface.hover',
      }}
    >
      <Typo.Badge.Medium>{label}</Typo.Badge.Medium>
      <Typo.Badge.Bold>{value}</Typo.Badge.Bold>
    </Box>
  );
}
