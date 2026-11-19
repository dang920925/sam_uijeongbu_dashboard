// ----------------------------------------------------------------------
// KPI 카드 — 제목(Badge medium secondary) / 값(Title bold) / 설명(Caption) + 오른쪽 아이콘 타일 40(흰 아이콘 20).
// 값 크기 Title(18)은 designer 기본안(한 화면 4티어 — 사용자 확정).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import type { DashboardKpiTone } from '@/src/sections/dashboard/utils/build-dashboard-view';
import { LAYOUT, RADIUS } from '@/src/theme/layout-tokens';

interface DashboardKpiCardProps {
  title: string;
  value: string;
  description: string;
  icon: string;
  tone: DashboardKpiTone;
}

export function DashboardKpiCard({
  title,
  value,
  description,
  icon,
  tone,
}: DashboardKpiCardProps) {
  return (
    <Card sx={{ p: { xs: 4, md: 6 } }}>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex min-w-0 flex-col gap-2'>
          <Typo.Badge.Medium color='text.secondary'>{title}</Typo.Badge.Medium>
          <Typo.Title.Bold>{value}</Typo.Title.Bold>
          <Typo.Caption.Regular color='text.secondary'>
            {description}
          </Typo.Caption.Regular>
        </div>
        <Box
          sx={{
            width: LAYOUT.control,
            height: LAYOUT.control,
            borderRadius: `${RADIUS.md}px`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            bgcolor: `semantic.kpi.${tone}`,
            color: 'semantic.kpi.iconFg',
          }}
        >
          <Iconify icon={icon} size='md' />
        </Box>
      </div>
    </Card>
  );
}
